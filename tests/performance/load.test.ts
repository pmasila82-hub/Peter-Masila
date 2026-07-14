import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import apiRouter from "../../src/backend/routes/api";
import { rateLimiter } from "../../src/backend/middlewares/rate-limit";
import { securityHeaders } from "../../src/backend/middlewares/security";

describe("CELCOM ERP PRO - Performance & Load Simulation", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityHeaders);
    
    // Configured with high-concurrency capability for load benchmarks
    app.use(
      "/api",
      rateLimiter({
        windowMs: 60 * 1000,
        max: 50, // Relaxed ceiling for concurrent load tests
        message: "Load limit exceeded.",
      }),
      apiRouter
    );
  });

  it("should handle 30 concurrent status checks within acceptable latency thresholds", async () => {
    const totalRequests = 30;
    const requestPromises: Promise<{ duration: number; status: number }>[] = [];

    const startTime = Date.now();

    for (let i = 0; i < totalRequests; i++) {
      const singleReqPromise = (async () => {
        const reqStart = Date.now();
        const res = await request(app).get("/api/v1/auth/status");
        return {
          duration: Date.now() - reqStart,
          status: res.status,
        };
      })();
      requestPromises.push(singleReqPromise);
    }

    const results = await Promise.all(requestPromises);
    const totalDuration = Date.now() - startTime;

    // Calculate response latency statistics
    const latencies = results.map(r => r.duration);
    const averageLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];

    console.log(`\n================= PERFORMANCE RUN STATISTICS =================`);
    console.log(`Total Simulated Concurrent Requests: ${totalRequests}`);
    console.log(`Aggregate Execution Duration: ${totalDuration}ms`);
    console.log(`Average Latency per Endpoint Request: ${averageLatency.toFixed(2)}ms`);
    console.log(`95th Percentile (p95) Latency: ${p95Latency}ms`);
    console.log(`Successful/Bypassed Rate-Limit Statuses (401/404): ${results.filter(r => r.status !== 429).length}`);
    console.log(`===============================================================\n`);

    // Latency standards validation
    // Individual requests on in-memory supertest are typically extremely fast (e.g. < 50ms)
    expect(averageLatency).toBeLessThan(250); // Hard threshold of 250ms for in-memory handlers
    expect(results.every(r => r.status === 401 || r.status === 404)).toBe(true);
  });
});

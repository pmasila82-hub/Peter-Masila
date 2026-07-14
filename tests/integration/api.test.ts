import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import apiRouter from "../../src/backend/routes/api";
import authRouter from "../../src/backend/routes/auth";
import { rateLimiter } from "../../src/backend/middlewares/rate-limit";
import { securityHeaders } from "../../src/backend/middlewares/security";
import { errorHandler } from "../../src/backend/middlewares/error-handler";

describe("CELCOM ERP PRO - API Integration Tests", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityHeaders);

    // Apply the global API rate limiter (max 3 requests for testing limits quickly)
    app.use(
      "/api",
      rateLimiter({
        windowMs: 5000, // 5 seconds window
        max: 3,
        message: "Rate limit reached.",
      })
    );

    // Mount routers
    app.use("/api/v1/auth", authRouter);
    app.use("/api", apiRouter);

    // Global Error Handler
    app.use(errorHandler);
  });

  it("GET /api/v1/auth/me - should return 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    // Secure route must fail with 401 unauthorized due to missing signature header
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("POST /api/v1/auth/login - should validate missing fields and return 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "" }); // Missing password and empty email

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Request validation failed");
  });

  it("Rate Limiting Gates - should return 429 when max threshold is exceeded", async () => {
    // Send 3 requests (within limit)
    await request(app).get("/api/v1/auth/me");
    await request(app).get("/api/v1/auth/me");
    const thirdReq = await request(app).get("/api/v1/auth/me");

    expect(thirdReq.headers["x-ratelimit-limit"]).toBe("3");
    expect(thirdReq.headers["x-ratelimit-remaining"]).toBe("0");

    // Fourth request should be blocked by rate-limiting
    const fourthReq = await request(app).get("/api/v1/auth/me");
    expect(fourthReq.status).toBe(429);
    expect(fourthReq.body.error).toBe("TOO_MANY_REQUESTS");
    expect(fourthReq.body.message).toBe("Rate limit reached.");
  });
});

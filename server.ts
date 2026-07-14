import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import apiRouter from "./src/backend/routes/api";
import { securityHeaders } from "./src/backend/middlewares/security";
import { rateLimiter } from "./src/backend/middlewares/rate-limit";
import { requestLogger } from "./src/backend/middlewares/logging";
import { errorHandler } from "./src/backend/middlewares/error-handler";
import { getPrismaClient } from "./src/backend/services/prisma.service";
import { logger } from "./src/backend/services/logger.service";

// Load environment variables from .env
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const PORT = 3000;
const HOST = "0.0.0.0";

async function bootstrap() {
  const app = express();

  // 1. Core Security Headers & CORS
  app.use(securityHeaders);

  // 2. HTTP Logging Audit Trail
  app.use(requestLogger);

  // 3. Parser Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static assets from uploads & reports directories if required
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/reports", express.static(path.join(process.cwd(), "reports")));

  // 4. Robust DB-connectivity Health Check endpoint
  app.get("/api/health", async (req, res) => {
    let dbStatus = "DISCONNECTED";
    let isHealthy = false;
    
    try {
      const prisma = getPrismaClient();
      // Fast query to confirm PostgreSQL connection loop viability
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "CONNECTED";
      isHealthy = true;
    } catch (err: any) {
      dbStatus = `ERROR: ${err.message || "Failed to query database"}`;
      logger.error("HEALTH_CHECK", "Database connection test failed on health ping", err);
    }

    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? "HEALTHY" : "DEGRADED",
      database: dbStatus,
      service: "CELCOM ERP PRO API Core",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes (must precede Vite middleware, protected by general rate-limiting)
  app.use(
    "/api",
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 300, // max 300 requests per IP per 15 minutes
      message: "Too many system queries from this IP. Please wait a few moments before trying again.",
    }),
    apiRouter
  );

  // Mock API routes to verify full-stack connection prior to module generation
  app.get("/api/v1/auth/status", (req, res) => {
    res.json({
      authenticated: false,
      message: "Authentication server skeleton running. Ready for integration.",
    });
  });

  // 5. Global Express Central Error Boundary (Must follow API routes)
  app.use(errorHandler);

  // Vite development server middleware or production static serving
  if (!isProduction) {
    logger.info("BOOTSTRAP", "Starting CELCOM ERP PRO in DEVELOPMENT mode with Vite integration...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    logger.info("BOOTSTRAP", "Starting CELCOM ERP PRO in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static client assets
    app.use(express.static(distPath));
    
    // SPA fallback: Route all non-API paths to index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server to port 3000
  app.listen(PORT, HOST, () => {
    console.log(`===========================================================`);
    console.log(`CELCOM ERP PRO running on: http://${HOST}:${PORT}`);
    console.log(`Environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);
    console.log(`Press Ctrl+C to terminate`);
    console.log(`===========================================================`);
  });
}

bootstrap().catch((error) => {
  logger.error("BOOTSTRAP_CRITICAL", "Failed to start CELCOM ERP PRO App Server:", error);
  process.exit(1);
});

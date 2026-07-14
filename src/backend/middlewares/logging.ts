import { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger.service";

/**
 * Audit and execution performance logging middleware
 * Intercepts incoming requests and monitors output status codes and request/response latencies.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  const { method, originalUrl, ip } = req;

  // Listen for response compilation to conclude
  res.on("finish", () => {
    const diff = process.hrtime(start);
    const durationMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
    const statusCode = res.statusCode;

    const logMsg = `${method} ${originalUrl} ${statusCode} - ${durationMs}ms - IP: ${ip}`;

    if (statusCode >= 500) {
      logger.error("HTTP_SERVER", logMsg);
    } else if (statusCode >= 400) {
      logger.warn("HTTP_CLIENT", logMsg);
    } else {
      logger.info("HTTP_SUCCESS", logMsg);
    }
  });

  next();
}

export default requestLogger;

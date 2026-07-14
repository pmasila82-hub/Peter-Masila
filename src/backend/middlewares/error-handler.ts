import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../services/logger.service";

/**
 * Express error boundary middleware
 * Catches all controller unhandled exceptions, parses Prisma query errors, 
 * and outputs structured, sanitised error contexts.
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = error.statusCode || 500;
  let errorCode = error.code || "INTERNAL_SERVER_ERROR";
  let message = error.message || "An unexpected system anomaly occurred inside the ERP backend.";
  let details = error.details || undefined;

  // Map Prisma Database Specific Exceptions to clean HTTP error structures
  if (error.code && typeof error.code === "string" && error.code.startsWith("P")) {
    statusCode = 400;
    switch (error.code) {
      case "P2002":
        errorCode = "DUPLICATE_RECORD";
        message = `A record already exists with that unique field value: ${
          Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unspecified"
        }.`;
        break;
      case "P2025":
        statusCode = 404;
        errorCode = "RECORD_NOT_FOUND";
        message = "The requested transaction or master database record does not exist.";
        break;
      default:
        errorCode = `PRISMA_DATABASE_ERROR_${error.code}`;
        message = "A database constraint violation blocked this operations transaction.";
    }
  }

  // Production security: hide database stack traces from external consumers
  const isProd = process.env.NODE_ENV === "production";
  
  // Log the error via our central structured Logger Service
  logger.error(
    "SYSTEM_ERROR_BOUNDARY",
    `[${req.method}] ${req.path} -> ${message}`,
    error,
    { statusCode, errorCode, details }
  );

  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(details ? { details } : {}),
    ...(isProd ? {} : { debug_stack: error.stack }),
  });
}

export default errorHandler;

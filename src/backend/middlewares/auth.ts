import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "celcom_erp_default_access_secret_2026_safe_key";

// Extend Express Request types to support user properties
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication check middleware
 * Decodes standard JWT tokens sent via HTTP Authorization Bearer headers.
 */
export function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authorization token missing or malformed.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1. Mock session for easy startup debugging or direct bypass (Disabled in Production contexts for security)
    if (token === "mock-admin-token") {
      if (process.env.NODE_ENV === "production") {
        return res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Sandbox bypass token is disabled in production environments.",
        });
      }
      req.user = {
        id: "usr_admin_001",
        email: "admin@celcomnetworks.co.ke",
        role: "SUPER_ADMIN",
      };
      return next();
    }

    // 2. Real cryptographic JWT verification
    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Your login session has expired. Please refresh your access credentials.",
      });
    }

    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Your login session is invalid. Please re-authenticate.",
    });
  }
}

/**
 * Authorization role restriction helper
 */
export function restrictTo(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "User session required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "FORBIDDEN_ACTION",
        message: "You are not authorized to perform actions in this department.",
      });
    }

    next();
  };
}

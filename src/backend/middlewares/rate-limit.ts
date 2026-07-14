import { Request, Response, NextFunction } from "express";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Periodically clean up expired keys to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000).unref(); // Run every minute, do not keep process alive

/**
 * Enterprise-grade in-memory Rate Limiter middleware.
 * Implements a high-performance sliding/fixed-window request limiter without bulky Redis overhead.
 */
export function rateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Rely on Express trust-proxy headers or general IP resolution
    const ip = req.ip || req.socket.remoteAddress || "unknown_client";
    const now = Date.now();
    const key = `${req.path}:${ip}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      res.setHeader("X-RateLimit-Limit", config.max);
      res.setHeader("X-RateLimit-Remaining", config.max - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + config.windowMs) / 1000));
      return next();
    }

    if (record.count >= config.max) {
      res.setHeader("X-RateLimit-Limit", config.max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));

      return res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        message: config.message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count += 1;
    rateLimitStore.set(key, record);

    res.setHeader("X-RateLimit-Limit", config.max);
    res.setHeader("X-RateLimit-Remaining", config.max - record.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    next();
  };
}

export default rateLimiter;

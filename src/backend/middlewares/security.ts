import { Request, Response, NextFunction } from "express";

/**
 * Enterprise-grade Security Headers & CORS Middleware.
 * Replaces bulky external security dependencies with clean, performant, native headers.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // 1. Cross-Origin Resource Sharing (CORS) Configuration
  const isProd = process.env.NODE_ENV === "production";
  const origin = req.headers.origin;
  
  if (isProd) {
    // Whitelist trusted client domains in production (or same origin)
    const allowedOrigins = [
      "https://celcomnetworks.co.ke",
      "https://admin.celcomnetworks.co.ke"
    ];
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // Do not set Access-Control-Allow-Origin for untrusted origins in production
    }
  } else {
    // Relaxed for local / sandbox development
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Correlation-ID"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle browser preflight checks instantly
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 2. Clickjacking Defense
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // 3. MIME-Type Sniffing Prevention
  res.setHeader("X-Content-Type-Options", "nosniff");

  // 4. Cross-Site Scripting (XSS) Filtering
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // 5. Referrer Leakage Mitigation
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // 6. Content Security Policy (CSP) - Mitigation for XSS & Data Injection Attacks
  // Restricts loading resources to safe sources
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:;"
  );

  // 7. Strict Transport Security (HSTS) - Enabled for secure contexts
  if (isProd || req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
}

export default securityHeaders;

import crypto from "crypto";

/**
 * Enterprise-grade PBKDF2-SHA512 password hashing with custom salt generation.
 * Highly secure, dependency-free, and cross-platform stable.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 210000; // Increased from 10000 to 210000 following OWASP SHA512 security guidelines
  const keylen = 64;
  const digest = "sha512";
  
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return `${iterations}:${salt}:${hash}`;
}

/**
 * Verify a plain text password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3) {
      return false;
    }
    
    const iterations = parseInt(parts[0], 10);
    const salt = parts[1];
    const hash = parts[2];
    const keylen = 64;
    const digest = "sha512";
    
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
    return hash === testHash;
  } catch (error) {
    return false;
  }
}

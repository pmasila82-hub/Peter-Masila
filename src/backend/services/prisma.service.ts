import { PrismaClient } from "@prisma/client";

// Guard database connections inside a process-wide singleton structure
// to avoid exhaustion of connection pools during hot-reloads
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("WARNING: DATABASE_URL variable is not set. Database commands will fail.");
    }
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  return prisma;
}

export default getPrismaClient;

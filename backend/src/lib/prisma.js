import { PrismaClient } from "@prisma/client";

// Reuse a single instance across hot reloads in dev (node --watch restarts the module).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Default 5s/2s is too tight for hosted Postgres (Neon, etc) where each round trip
    // inside a sale's transaction (stock upserts + audit log rows) can take over a second.
    transactionOptions: { timeout: 20000, maxWait: 10000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

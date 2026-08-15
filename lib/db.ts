import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Raw TCP connections to Neon (via `@prisma/adapter-pg`) were intermittently
 * dropping mid-query ("Connection terminated unexpectedly" / "Authentication
 * timed out") even against the pooled endpoint. Neon's serverless driver
 * tunnels over a WebSocket to Neon's proxy instead of holding a raw
 * postgres-protocol TCP socket, which is far more tolerant of the flaky
 * network path we were hitting. `ws` supplies the WebSocket client Node
 * doesn't provide globally.
 */
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Stopgap for whatever connection drops still get through — retries a query
 * a couple of times with backoff. Not a substitute for the adapter switch
 * above, just insurance against a single flaky attempt.
 */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw lastError;
}

import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Cloudflare Workers reuses the same module scope across many unrelated
// requests, so a module-level singleton here would let one request's I/O
// handles leak into another's and throw "Cannot perform I/O on behalf of
// a different request." Build a fresh client per call instead.
export function getPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

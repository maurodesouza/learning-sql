/**
 * PrismaClient singleton.
 *
 * Prisma 7 requires a driver adapter — we use @prisma/adapter-pg against the
 * OWNER connection (DATABASE_URL). Prisma is used for schema, migrations and
 * seeding ONLY. The query console talks to the database through `pg` directly
 * with the read-only role (see src/lib/db/readonly.ts).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#/generated/prisma/client";

import { env } from "#/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

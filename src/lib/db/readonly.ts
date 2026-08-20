/**
 * Read-only database access for the query console.
 *
 * Uses `pg` (node-postgres) directly with the `sql_lab_readonly` role — NEVER
 * Prisma. Prisma is for schema/migrations/seed only.
 *
 * Type fidelity: bigint, numeric, date/timestamptz are returned as strings to
 * avoid precision loss and timezone drift. jsonb is kept as parsed objects.
 */
import { Pool, types as pgTypes } from "pg";
import { env } from "#/lib/env";

// ─── Type parsers ────────────────────────────────────────────────────────────
// Override default parsers to preserve fidelity for the browser.
// int8 (20): keep as string (JS Number loses precision above 2^53)
pgTypes.setTypeParser(20, "text", (val: string) => val);
// numeric (1700): keep as string (JS Number loses decimal precision)
pgTypes.setTypeParser(1700, "text", (val: string) => val);
// money (790): keep as string
pgTypes.setTypeParser(790, "text", (val: string) => val);
// date (1082): return ISO string (not JS Date, to avoid timezone drift)
pgTypes.setTypeParser(1082, "text", (val: string) => val);
// timestamp (1114): return ISO string
pgTypes.setTypeParser(1114, "text", (val: string) => val);
// timestamptz (1184): return ISO string
pgTypes.setTypeParser(1184, "text", (val: string) => val);
// int8 array (1016): keep as string array
pgTypes.setTypeParser(1016 as unknown as 20, "text", (val: string) => val);
// numeric array (1231): keep as string array
pgTypes.setTypeParser(1231 as unknown as 1700, "text", (val: string) => val);

const globalForPool = globalThis as unknown as {
  readonlyPool?: Pool;
};

function createPool(): Pool {
  return new Pool({
    connectionString: env.databaseUrlReadonly,
    max: 10,
    application_name: "sql-lab-query-console",
    connectionTimeoutMillis: 3000,
    // Use our custom type parsers.
    types: {
      getTypeParser: pgTypes.getTypeParser,
    },
  });
}

export const readonlyPool = globalForPool.readonlyPool ?? createPool();
if (!globalForPool.readonlyPool) {
  globalForPool.readonlyPool = readonlyPool;
}

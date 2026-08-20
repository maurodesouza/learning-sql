/**
 * Shared pg pool for the seed — connects as the OWNER role (DATABASE_URL).
 *
 * The seed needs write access, so it uses the owner connection, not the
 * read-only role. We use `pg` directly for bulk inserts (multi-row INSERT)
 * instead of Prisma's createMany for better performance and control.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

// Load .env (tsx doesn't do this automatically).
loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}

export const pool = new Pool({
  connectionString,
  max: 5,
});

/**
 * Build a multi-row INSERT statement with parameterized values.
 * Returns { text, values } ready for pool.query.
 *
 * Example:
 *   bulkInsert("sellers", ["name", "slug"], [["Acme", "acme"], ["Foo", "foo"]])
 */
export function bulkInsert(
  table: string,
  columns: string[],
  rows: (string | number | boolean | null | Date | string[])[][],
): {
  text: string;
  values: (string | number | boolean | null | Date | string[])[];
} {
  if (rows.length === 0) {
    return { text: "SELECT 1", values: [] };
  }

  const colList = columns.map((c) => `"${c}"`).join(", ");
  const placeholders: string[] = [];
  const values: (string | number | boolean | null | Date | string[])[] = [];
  let paramIdx = 1;

  for (const row of rows) {
    const rowPlaceholders: string[] = [];
    for (const value of row) {
      if (Array.isArray(value)) {
        // Postgres array literal: $n::text[]
        rowPlaceholders.push(`$${paramIdx}::text[]`);
      } else {
        rowPlaceholders.push(`$${paramIdx}`);
      }
      values.push(value);
      paramIdx++;
    }
    placeholders.push(`(${rowPlaceholders.join(", ")})`);
  }

  const text = `INSERT INTO "${table}" (${colList}) VALUES ${placeholders.join(", ")}`;
  return { text, values };
}

/** Insert rows in batches to avoid exceeding parameter limits. Returns inserted count. */
export async function bulkInsertBatched(
  table: string,
  columns: string[],
  rows: (string | number | boolean | null | Date | string[])[][],
  batchSize = 500,
): Promise<number> {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { text, values } = bulkInsert(table, columns, batch);
    await pool.query(text, values);
    total += batch.length;
  }
  return total;
}

/** Insert rows and return the `id` of each inserted row (in order). */
export async function bulkInsertReturningIds(
  table: string,
  columns: string[],
  rows: (string | number | boolean | null | Date | string[])[][],
  batchSize = 500,
): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { text, values } = bulkInsert(table, columns, batch);
    const result = await pool.query<{ id: number }>(
      `${text} RETURNING "id"`,
      values,
    );
    ids.push(...result.rows.map((r) => r.id));
  }
  return ids;
}

/** Run a query and return rows. */
export async function query<
  T extends Record<string, unknown> = Record<string, unknown>,
>(text: string, values?: (string | number | boolean | null)[]): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}

/** Run a statement. */
export async function exec(
  text: string,
  values?: (string | number | boolean | null)[],
): Promise<void> {
  await pool.query(text, values);
}

/** Close the pool (call at end of seed). */
export async function closePool(): Promise<void> {
  await pool.end();
}

/** Minimal .env loader — sets vars on process.env if not already set. */
function loadEnvFile(file: string): void {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

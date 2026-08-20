/**
 * Validate that all example queries execute successfully against the seeded DB.
 *
 * Run via: pnpm validate:examples
 * Exits with code 0 if all pass, 1 if any fail.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { EXAMPLE_QUERIES } from "../src/lib/sql/examples";

// Load .env
loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString = process.env.DATABASE_URL_READONLY;
if (!connectionString) {
  console.error("DATABASE_URL_READONLY is not set. Copy .env.example to .env.");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 3 });

async function main(): Promise<void> {
  console.log(`Validating ${EXAMPLE_QUERIES.length} example queries...\n`);

  let passed = 0;
  let failed = 0;
  const failures: { id: string; title: string; error: string }[] = [];

  for (const example of EXAMPLE_QUERIES) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      await client.query(`SET LOCAL statement_timeout = 10000`);
      const result = await client.query(example.sql);
      await client.query("ROLLBACK");

      const rowCount = result.rows.length;
      console.log(
        `  PASS  [${example.difficulty.padEnd(12)}] ${example.title} (${rowCount} rows)`,
      );
      passed++;
    } catch (err) {
      const error = err as Error;
      console.log(
        `  FAIL  [${example.difficulty.padEnd(12)}] ${example.title}`,
      );
      console.log(`        ${error.message}`);
      failures.push({
        id: example.id,
        title: example.title,
        error: error.message,
      });
      failed++;
      try {
        await client.query("ROLLBACK");
      } catch {
        // Connection may be broken
      }
    } finally {
      client.release();
    }
  }

  console.log();
  console.log(
    `Results: ${passed} passed, ${failed} failed out of ${EXAMPLE_QUERIES.length}`,
  );

  if (failed > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  - ${f.title} (${f.id}): ${f.error}`);
    }
    process.exit(1);
  }

  console.log("\nAll example queries validated successfully!");
  await pool.end();
}

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

main().catch((error) => {
  console.error("Validation failed:", error);
  process.exit(1);
});

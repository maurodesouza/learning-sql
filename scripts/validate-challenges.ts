/**
 * Validate that all challenge reference solutions execute successfully against
 * the seeded DB and return the expected columns.
 *
 * Run via: pnpm validate:challenges
 * Exits with code 0 if all pass, 1 if any fail.
 *
 * Asserts per challenge:
 *   - the solution executes without error
 *   - returns at least 1 row
 *   - is under the row cap (HARD_MAX_ROWS = 5000)
 *   - column names match expectedColumns exactly
 *   - has at least one hint
 *
 * Asserts globally:
 *   - slugs are unique
 *   - (level, orderIndex) pairs are unique
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { CHALLENGES } from "../prisma/seed/data/challenges";

const HARD_MAX_ROWS = 5000;

// Load .env
loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString = process.env.DATABASE_URL_READONLY;
if (!connectionString) {
  console.error("DATABASE_URL_READONLY is not set. Copy .env.example to .env.");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 3 });

async function main(): Promise<void> {
  console.log(`Validating ${CHALLENGES.length} challenge solutions...\n`);

  // ─── Global checks ──────────────────────────────────────────────────────
  const slugSet = new Set<string>();
  const levelOrderSet = new Set<string>();
  let globalErrors = 0;

  for (const c of CHALLENGES) {
    if (slugSet.has(c.slug)) {
      console.error(`  GLOBAL FAIL: duplicate slug "${c.slug}"`);
      globalErrors++;
    }
    slugSet.add(c.slug);

    const levelKey = `${c.level}:${CHALLENGES.filter(
      (x) => x.level === c.level,
    ).indexOf(c)}`;
    if (levelOrderSet.has(levelKey)) {
      console.error(
        `  GLOBAL FAIL: duplicate (level, orderIndex) for "${c.slug}"`,
      );
      globalErrors++;
    }
    levelOrderSet.add(levelKey);

    if (c.hints.length === 0) {
      console.error(`  GLOBAL FAIL: "${c.slug}" has no hints`);
      globalErrors++;
    }

    if (c.expectedColumns.length === 0) {
      console.error(`  GLOBAL FAIL: "${c.slug}" has no expectedColumns`);
      globalErrors++;
    }
  }

  // ─── Per-challenge execution ────────────────────────────────────────────
  let passed = 0;
  let failed = 0;
  const failures: { slug: string; title: string; error: string }[] = [];

  for (const challenge of CHALLENGES) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      await client.query("SET LOCAL statement_timeout = 10000");
      const result = await client.query(challenge.solutionSql);
      await client.query("ROLLBACK");

      const rowCount = result.rows.length;
      const actualColumns = result.fields.map((f) => f.name);
      const expectedColumns = challenge.expectedColumns;

      // Check column names
      const columnsMatch =
        actualColumns.length === expectedColumns.length &&
        actualColumns.every(
          (col, i) =>
            col.toLowerCase() === (expectedColumns[i] ?? "").toLowerCase(),
        );

      // Check row count
      const hasRows = rowCount >= 1;
      const underCap = rowCount <= HARD_MAX_ROWS;

      if (!columnsMatch) {
        console.log(
          `  FAIL  [${challenge.level.padEnd(10)}] ${challenge.title}`,
        );
        console.log(
          `        Column mismatch: expected [${expectedColumns.join(", ")}], got [${actualColumns.join(", ")}]`,
        );
        failures.push({
          slug: challenge.slug,
          title: challenge.title,
          error: `Column mismatch: expected [${expectedColumns.join(", ")}], got [${actualColumns.join(", ")}]`,
        });
        failed++;
      } else if (!hasRows) {
        console.log(
          `  FAIL  [${challenge.level.padEnd(10)}] ${challenge.title}`,
        );
        console.log(`        Solution returned 0 rows`);
        failures.push({
          slug: challenge.slug,
          title: challenge.title,
          error: "Solution returned 0 rows",
        });
        failed++;
      } else if (!underCap) {
        console.log(
          `  FAIL  [${challenge.level.padEnd(10)}] ${challenge.title}`,
        );
        console.log(
          `        Solution returned ${rowCount} rows (exceeds cap of ${HARD_MAX_ROWS})`,
        );
        failures.push({
          slug: challenge.slug,
          title: challenge.title,
          error: `Row count ${rowCount} exceeds cap ${HARD_MAX_ROWS}`,
        });
        failed++;
      } else {
        console.log(
          `  PASS  [${challenge.level.padEnd(10)}] ${challenge.title} (${rowCount} rows)`,
        );
        passed++;
      }
    } catch (err) {
      const error = err as Error;
      console.log(`  FAIL  [${challenge.level.padEnd(10)}] ${challenge.title}`);
      console.log(`        ${error.message}`);
      failures.push({
        slug: challenge.slug,
        title: challenge.title,
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
    `Results: ${passed} passed, ${failed} failed out of ${CHALLENGES.length}`,
  );

  if (globalErrors > 0) {
    console.log(`\nGlobal validation errors: ${globalErrors}`);
  }

  if (failed > 0 || globalErrors > 0) {
    if (failures.length > 0) {
      console.log("\nFailures:");
      for (const f of failures) {
        console.log(`  - ${f.title} (${f.slug}): ${f.error}`);
      }
    }
    process.exit(1);
  }

  console.log("\nAll challenge solutions validated successfully!");
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

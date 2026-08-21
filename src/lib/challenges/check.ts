/**
 * Server-side challenge checking flow.
 *
 * Given a challenge id and a user query:
 *   1. Load the challenge (solution_sql, expected_columns, order_matters) from
 *      the lab schema via Prisma (owner connection).
 *   2. Run the user's query against the read-only pool.
 *   3. Run the reference solution against the read-only pool.
 *   4. Compare the two result sets with compareResults().
 *   5. Upsert ChallengeProgress (attempts++, status SOLVED if correct).
 *
 * The user query and the reference solution run in independent read-only
 * transactions so a failure in one does not affect the other.
 */
import { prisma } from "#/lib/db/prisma";
import { readonlyPool } from "#/lib/db/readonly";
import { env } from "#/lib/env";
import { detectMultiStatement, validateInput } from "#/lib/sql/guard";
import { compareResults, type QueryResult } from "./compare";
import type { CheckResult } from "./types";

const CHALLENGE_ROW_CAP = 5000;

export interface CheckInput {
  challengeId: number;
  sql: string;
  language?: "sql" | "prql";
}

export interface CheckOutcome {
  result: CheckResult;
  progress: {
    status: "ATTEMPTED" | "SOLVED";
    attempts: number;
    solvedAt: Date | null;
  };
}

/**
 * Run the user query and the reference solution, then compare.
 *
 * Throws only on infrastructure errors (DB connection, Prisma). User SQL
 * errors are captured in the returned CheckResult.error field.
 */
export async function checkChallenge(input: CheckInput): Promise<CheckOutcome> {
  const { challengeId, sql, language = "sql" } = input;

  // 1. Load challenge metadata from the lab schema.
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      slug: true,
      solutionSql: true,
      orderMatters: true,
      hints: {
        select: { position: true, text: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!challenge) {
    throw new Error(`Challenge ${challengeId} not found.`);
  }

  // Derive expected columns from the reference solution by running it once.
  // We store expectedColumns in the catalog but not in the DB; the check flow
  // infers them from the solution's result fields. This keeps the DB schema
  // simple and avoids a sync bug between catalog and DB.
  const expectedColumns: string[] = [];

  // 2. Run the reference solution.
  let referenceResult: QueryResult;
  try {
    referenceResult = await runReadonlyQuery(challenge.solutionSql);
  } catch (err) {
    // If the reference solution itself fails, that's a catalog bug — surface it.
    const error = err as Error;
    throw new Error(
      `Reference solution for challenge "${challenge.slug}" failed: ${error.message}`,
    );
  }

  // Fill expectedColumns from the reference result fields.
  for (const col of referenceResult.columns) {
    expectedColumns.push(col);
  }

  // 3. Validate and run the user query.
  let userResult: QueryResult | null = null;
  let userError: string | null = null;

  const validation = validateInput(sql, CHALLENGE_ROW_CAP);
  if (!validation.ok) {
    userError = validation.error?.message ?? "Invalid input.";
  } else if (detectMultiStatement(sql)) {
    userError = "Only one statement at a time is allowed.";
  } else {
    try {
      userResult = await runReadonlyQuery(sql);
    } catch (err) {
      const error = err as Error;
      userError = error.message ?? "Unknown database error.";
    }
  }

  // 4. Compare.
  let checkResult: CheckResult;
  if (userError) {
    checkResult = {
      correct: false,
      expectedColumns,
      userColumns: [],
      userRowCount: 0,
      expectedRowCount: referenceResult.rows.length,
      rowCap: CHALLENGE_ROW_CAP,
      orderMatters: challenge.orderMatters,
      firstMismatch: null,
      error: userError,
    };
  } else if (!userResult) {
    checkResult = {
      correct: false,
      expectedColumns,
      userColumns: [],
      userRowCount: 0,
      expectedRowCount: referenceResult.rows.length,
      rowCap: CHALLENGE_ROW_CAP,
      orderMatters: challenge.orderMatters,
      firstMismatch: null,
      error: "No result returned.",
    };
  } else {
    checkResult = compareResults(userResult, referenceResult, {
      expectedColumns,
      orderMatters: challenge.orderMatters,
      rowCap: CHALLENGE_ROW_CAP,
    });
  }

  // 5. Upsert progress.
  const isCorrect = checkResult.correct;
  const progress = await prisma.challengeProgress.upsert({
    where: { challengeId },
    create: {
      challengeId,
      status: isCorrect ? "SOLVED" : "ATTEMPTED",
      attempts: 1,
      lastSql: sql,
      lastLanguage: language,
      solvedAt: isCorrect ? new Date() : null,
    },
    update: {
      status: isCorrect ? "SOLVED" : "ATTEMPTED",
      attempts: { increment: 1 },
      lastSql: sql,
      lastLanguage: language,
      solvedAt: isCorrect ? new Date() : undefined,
    },
    select: { status: true, attempts: true, solvedAt: true },
  });

  return {
    result: checkResult,
    progress: {
      status: progress.status,
      attempts: progress.attempts,
      solvedAt: progress.solvedAt,
    },
  };
}

/**
 * Run a read-only SQL query and return a QueryResult (columns + rows as arrays).
 *
 * Uses the same read-only pool and type parsers as the query console, so the
 * user's query and the reference solution see identical type fidelity.
 */
async function runReadonlyQuery(sql: string): Promise<QueryResult> {
  const client = await readonlyPool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${env.queryTimeoutMs}`);
    await client.query(
      `SET LOCAL idle_in_transaction_session_timeout = ${env.queryTimeoutMs}`,
    );

    const result = await client.query({
      text: sql,
      values: [],
      rowMode: "array",
    });

    const columns = result.fields.map((f) => f.name);
    const rows = result.rows as unknown[][];

    // Enforce the row cap — if the reference solution or user query exceeds it,
    // we still return the data (truncated) so the comparison can report the
    // mismatch. The validator script enforces the cap at catalog authoring time.
    if (rows.length > CHALLENGE_ROW_CAP) {
      return {
        columns,
        rows: rows.slice(0, CHALLENGE_ROW_CAP),
      };
    }

    return { columns, rows };
  } finally {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Connection may be broken; ignore.
    }
    client.release();
  }
}

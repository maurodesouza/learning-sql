/**
 * Safety guard for the query console.
 *
 * Layered defense — Postgres privileges + READ ONLY transaction are the real
 * boundary. These checks provide friendly error messages and early rejection.
 *
 * NOT a keyword blacklist (that breaks legitimate queries like a column named
 * `update_count` and gives false confidence). The mechanism is:
 *   1. Postgres read-only role (primary guarantee)
 *   2. BEGIN TRANSACTION READ ONLY (blocks DML/DDL even if privileges loosen)
 *   3. Single-statement enforcement via extended protocol (values: [])
 *   4. Input limits (max length, non-empty)
 *   5. Row cap (fetch max+1, report truncation)
 */
import type { ErrorKind } from "./types";

export const MAX_SQL_LENGTH = 20_000;
export const HARD_MAX_ROWS = 5000;

export interface GuardResult {
  ok: boolean;
  error?: { message: string; kind: ErrorKind };
}

/** Validate raw input before it reaches the database. */
export function validateInput(sql: string, maxRows?: number): GuardResult {
  if (!sql || sql.trim().length === 0) {
    return {
      ok: false,
      error: { message: "SQL query is empty.", kind: "INPUT_INVALID" },
    };
  }
  if (sql.length > MAX_SQL_LENGTH) {
    return {
      ok: false,
      error: {
        message: `SQL query is too long (${sql.length} chars, max ${MAX_SQL_LENGTH}).`,
        kind: "INPUT_INVALID",
      },
    };
  }
  if (maxRows !== undefined && (maxRows < 1 || maxRows > HARD_MAX_ROWS)) {
    return {
      ok: false,
      error: {
        message: `maxRows must be between 1 and ${HARD_MAX_ROWS}.`,
        kind: "INPUT_INVALID",
      },
    };
  }
  return { ok: true };
}

/**
 * Detect multiple statements outside string literals and comments.
 *
 * The extended protocol (values: []) already rejects multiple statements, but
 * this gives a friendlier error message before hitting Postgres.
 */
export function detectMultiStatement(sql: string): boolean {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    // Comment: -- to end of line
    if (!inSingleQuote && !inDoubleQuote && ch === "-" && sql[i + 1] === "-") {
      i += 2;
      while (i < sql.length && sql[i] !== "\n") i++;
      continue;
    }

    // Comment: /* ... */
    if (!inSingleQuote && !inDoubleQuote && ch === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    // String literal
    if (ch === "'" && !inDoubleQuote) {
      if (inSingleQuote && sql[i + 1] === "'") {
        // Escaped quote
        i += 2;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      i++;
      continue;
    }

    // Quoted identifier
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      i++;
      continue;
    }

    // Semicolon outside literals/comments = statement separator
    if (ch === ";" && !inSingleQuote && !inDoubleQuote) {
      // Check if there's non-whitespace after the semicolon
      let j = i + 1;
      while (j < sql.length && /\s/.test(sql[j]!)) j++;
      if (j < sql.length) {
        return true; // Multiple statements detected
      }
    }

    i++;
  }

  return false;
}

/** Map a PostgreSQL error code to a friendly error kind. */
export function mapErrorKind(code: string | undefined): ErrorKind {
  if (!code) return "UNKNOWN";
  switch (code) {
    case "57014":
      return "TIMEOUT";
    case "42501":
    case "25006":
      return "READ_ONLY_VIOLATION";
    case "42601":
      return "SYNTAX_ERROR";
    case "42P01":
    case "42703":
    case "42883":
      return "SYNTAX_ERROR";
    default:
      return "UNKNOWN";
  }
}

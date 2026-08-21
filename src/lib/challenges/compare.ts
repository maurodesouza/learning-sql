/**
 * Pure result comparison for challenge checking.
 *
 * Two result sets are equal when:
 *   1. They have the same column names (case-insensitive), in the same order.
 *   2. They have the same number of rows.
 *   3. Each row's values match the expected row's values, in column order.
 *   4. When orderMatters is false, rows are compared as sets (sorted by a
 *      stable string key before comparison).
 *
 * Numeric values are compared with a small tolerance (1e-9) to absorb
 * floating-point noise. Dates are compared as ISO strings. Everything else
 * uses strict equality after String() coercion.
 */
import type { CheckResult, MismatchSample } from "./types";

const NUMERIC_TOLERANCE = 1e-9;

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

export interface CompareOptions {
  expectedColumns: string[];
  orderMatters: boolean;
  rowCap: number;
}

/**
 * Compare a user query result against an expected (reference) result.
 *
 * Returns a CheckResult describing the outcome. This function is pure — it
 * does not touch the database — so it can be unit-tested without a DB.
 */
export function compareResults(
  user: QueryResult,
  expected: QueryResult,
  options: CompareOptions,
): CheckResult {
  const { expectedColumns, orderMatters, rowCap } = options;
  const userColumns = user.columns;
  const userRowCount = user.rows.length;
  const expectedRowCount = expected.rows.length;

  // 1. Column-name check (case-insensitive, order-sensitive).
  const columnsMatch =
    userColumns.length === expectedColumns.length &&
    userColumns.every(
      (col, i) => col.toLowerCase() === expectedColumns[i]?.toLowerCase(),
    );

  if (!columnsMatch) {
    return {
      correct: false,
      expectedColumns,
      userColumns,
      userRowCount,
      expectedRowCount,
      rowCap,
      orderMatters,
      firstMismatch: null,
      error: null,
    };
  }

  // 2. Row-count check.
  if (userRowCount !== expectedRowCount) {
    return {
      correct: false,
      expectedColumns,
      userColumns,
      userRowCount,
      expectedRowCount,
      rowCap,
      orderMatters,
      firstMismatch: null,
      error: null,
    };
  }

  // 3. Row-by-row comparison.
  const userRows = orderMatters
    ? user.rows
    : sortRowsByKey(user.rows, userColumns);
  const expectedRows = orderMatters
    ? expected.rows
    : sortRowsByKey(expected.rows, expectedColumns);

  for (let i = 0; i < expectedRows.length; i++) {
    const expectedRow = expectedRows[i] ?? [];
    const actualRow = userRows[i] ?? [];
    if (!rowsEqual(expectedRow, actualRow)) {
      const mismatch: MismatchSample = {
        rowIndex: i,
        expected: expectedRow,
        actual: actualRow,
      };
      return {
        correct: false,
        expectedColumns,
        userColumns,
        userRowCount,
        expectedRowCount,
        rowCap,
        orderMatters,
        firstMismatch: mismatch,
        error: null,
      };
    }
  }

  return {
    correct: true,
    expectedColumns,
    userColumns,
    userRowCount,
    expectedRowCount,
    rowCap,
    orderMatters,
    firstMismatch: null,
    error: null,
  };
}

/**
 * Sort rows by a deterministic string key so set-based comparison is stable.
 * The key is the JSON-stringified row, which handles nested values.
 */
function sortRowsByKey(rows: unknown[][], columns: string[]): unknown[][] {
  return [...rows].sort((a, b) =>
    rowKey(a, columns) < rowKey(b, columns)
      ? -1
      : rowKey(a, columns) > rowKey(b, columns)
        ? 1
        : 0,
  );
}

function rowKey(row: unknown[], columns: string[]): string {
  return JSON.stringify(
    row.map((v, i) => normalizeForKey(v, columns[i] ?? "")),
  );
}

function normalizeForKey(value: unknown, _column: string): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  return value;
}

/**
 * Compare two rows element-by-element with type-aware equality.
 */
function rowsEqual(expected: unknown[], actual: unknown[]): boolean {
  if (expected.length !== actual.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (!valuesEqual(expected[i], actual[i])) return false;
  }
  return true;
}

/**
 * Compare two scalar values with tolerance for numerics and date strings.
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  // Both null/undefined → equal
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;

  // Numeric comparison with tolerance
  const numA = toNumber(a);
  const numB = toNumber(b);
  if (numA !== null && numB !== null) {
    return Math.abs(numA - numB) < NUMERIC_TOLERANCE;
  }

  // Date comparison (Date objects or ISO strings)
  const dateA = toDate(a);
  const dateB = toDate(b);
  if (dateA && dateB) {
    return dateA.getTime() === dateB.getTime();
  }

  // BigInt
  if (typeof a === "bigint" && typeof b === "bigint") {
    return a === b;
  }

  // Fallback: string comparison
  return String(a) === String(b);
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    // Only treat strings as numbers if they look numeric (avoid "123abc").
    return Number(v);
  }
  return null;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    // ISO 8601-ish: 2022-01-15 or 2022-01-15T04:25:23...
    if (/^\d{4}-\d{2}-\d{2}(T| )?/.test(v)) {
      // Date-only strings ("2022-01-15") are parsed as UTC by JS, while
      // datetime strings without timezone ("2022-01-15T00:00:00") are parsed
      // as local time. Normalize both to UTC by appending "Z" if no timezone
      // is present, so comparisons are consistent regardless of the host TZ.
      const normalized =
        v.includes("T") && !v.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(v)
          ? `${v}Z`
          : v;
      const d = new Date(normalized);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

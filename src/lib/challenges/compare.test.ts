/**
 * Unit tests for the pure compareResults function.
 *
 * No database access — these test the comparison logic in isolation.
 */
import { describe, expect, it } from "vitest";
import { compareResults, type QueryResult, valuesEqual } from "./compare";

describe("valuesEqual", () => {
  it("treats null and undefined as equal", () => {
    expect(valuesEqual(null, undefined)).toBe(true);
    expect(valuesEqual(null, null)).toBe(true);
  });

  it("compares numbers with tolerance", () => {
    expect(valuesEqual(1, 1.0000000001)).toBe(true);
    expect(valuesEqual(1, 1.1)).toBe(false);
  });

  it("compares numeric strings as numbers", () => {
    expect(valuesEqual("1.00", 1)).toBe(true);
    expect(valuesEqual("1.50", 1.5)).toBe(true);
  });

  it("compares dates by timestamp (timezone-normalized)", () => {
    expect(valuesEqual(new Date("2022-01-15"), "2022-01-15")).toBe(true);
    expect(valuesEqual("2022-01-15T00:00:00", "2022-01-15")).toBe(true);
    expect(valuesEqual("2022-01-15", "2022-01-16")).toBe(false);
  });

  it("compares strings by String() coercion", () => {
    expect(valuesEqual("hello", "hello")).toBe(true);
    expect(valuesEqual("hello", "world")).toBe(false);
  });
});

describe("compareResults", () => {
  it("returns correct when results match (order-independent)", () => {
    const expected: QueryResult = {
      columns: ["a", "b"],
      rows: [
        [1, "x"],
        [2, "y"],
      ],
    };
    const user: QueryResult = {
      columns: ["a", "b"],
      rows: [
        [2, "y"],
        [1, "x"],
      ],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["a", "b"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
  });

  it("returns correct when order matters and order matches", () => {
    const expected: QueryResult = {
      columns: ["a"],
      rows: [[1], [2]],
    };
    const user: QueryResult = {
      columns: ["a"],
      rows: [[1], [2]],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["a"],
      orderMatters: true,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
  });

  it("returns incorrect when order matters and order differs", () => {
    const expected: QueryResult = {
      columns: ["a"],
      rows: [[1], [2]],
    };
    const user: QueryResult = {
      columns: ["a"],
      rows: [[2], [1]],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["a"],
      orderMatters: true,
      rowCap: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.firstMismatch).not.toBeNull();
  });

  it("detects column mismatch (case-insensitive names)", () => {
    const expected: QueryResult = { columns: ["A", "B"], rows: [[1, 2]] };
    const user: QueryResult = { columns: ["a", "b"], rows: [[1, 2]] };
    const result = compareResults(user, expected, {
      expectedColumns: ["A", "B"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
  });

  it("detects column count mismatch", () => {
    const expected: QueryResult = { columns: ["a", "b"], rows: [[1, 2]] };
    const user: QueryResult = { columns: ["a"], rows: [[1]] };
    const result = compareResults(user, expected, {
      expectedColumns: ["a", "b"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.userColumns).toEqual(["a"]);
    expect(result.expectedColumns).toEqual(["a", "b"]);
  });

  it("detects row count mismatch", () => {
    const expected: QueryResult = { columns: ["a"], rows: [[1], [2]] };
    const user: QueryResult = { columns: ["a"], rows: [[1]] };
    const result = compareResults(user, expected, {
      expectedColumns: ["a"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.userRowCount).toBe(1);
    expect(result.expectedRowCount).toBe(2);
  });

  it("detects value mismatch with firstMismatch sample", () => {
    const expected: QueryResult = {
      columns: ["a", "b"],
      rows: [
        [1, "x"],
        [2, "y"],
      ],
    };
    const user: QueryResult = {
      columns: ["a", "b"],
      rows: [
        [1, "x"],
        [2, "z"],
      ],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["a", "b"],
      orderMatters: true,
      rowCap: 5000,
    });
    expect(result.correct).toBe(false);
    expect(result.firstMismatch).not.toBeNull();
    expect(result.firstMismatch?.rowIndex).toBe(1);
  });

  it("compares numeric values with tolerance", () => {
    const expected: QueryResult = {
      columns: ["total"],
      rows: [[100.0]],
    };
    const user: QueryResult = {
      columns: ["total"],
      rows: [["100.00"]],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["total"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
  });

  it("handles empty result sets", () => {
    const expected: QueryResult = { columns: ["a"], rows: [] };
    const user: QueryResult = { columns: ["a"], rows: [] };
    const result = compareResults(user, expected, {
      expectedColumns: ["a"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
    expect(result.userRowCount).toBe(0);
  });

  it("handles null values in rows", () => {
    const expected: QueryResult = {
      columns: ["a", "b"],
      rows: [[1, null]],
    };
    const user: QueryResult = {
      columns: ["a", "b"],
      rows: [[1, null]],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["a", "b"],
      orderMatters: false,
      rowCap: 5000,
    });
    expect(result.correct).toBe(true);
  });

  it("handles bigint values", () => {
    const expected: QueryResult = {
      columns: ["id"],
      rows: [[1n]],
    };
    const user: QueryResult = {
      columns: ["id"],
      rows: [["1"]],
    };
    const result = compareResults(user, expected, {
      expectedColumns: ["id"],
      orderMatters: false,
      rowCap: 5000,
    });
    // bigint vs string "1" — String(1n) = "1" === String("1") = "1"
    expect(result.correct).toBe(true);
  });
});

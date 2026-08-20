/**
 * Integration tests for the query execution API.
 *
 * Automatically skipped when the database is unreachable.
 */
import { describe, expect, it } from "vitest";
import { executeQuery } from "#/lib/sql/execute";

describe("executeQuery integration", () => {
  it("executes a simple SELECT", async () => {
    const result = await executeQuery({ sql: "SELECT 1 AS one" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.columns[0]?.name).toBe("one");
    expect(result.rows[0]).toEqual([1]);
    expect(result.rowCount).toBe(1);
    expect(result.command).toBe("SELECT");
  });

  it("preserves duplicate column names", async () => {
    const result = await executeQuery({ sql: "SELECT 1 AS a, 2 AS a" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0]?.name).toBe("a");
    expect(result.columns[1]?.name).toBe("a");
    expect(result.rows[0]).toEqual([1, 2]);
  });

  it("returns numeric as string", async () => {
    const result = await executeQuery({ sql: "SELECT 123.45::numeric AS val" });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.rows[0]).toEqual(["123.45"]);
  });

  it("returns bigint as string", async () => {
    const result = await executeQuery({
      sql: "SELECT 9999999999999::bigint AS val",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.rows[0]).toEqual(["9999999999999"]);
  });

  it("rejects UPDATE with read-only violation", async () => {
    const result = await executeQuery({
      sql: "UPDATE sellers SET name = 'test' WHERE id = -999",
    });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.kind).toBe("READ_ONLY_VIOLATION");
  });

  it("rejects DELETE", async () => {
    const result = await executeQuery({
      sql: "DELETE FROM sellers WHERE id = -999",
    });
    expect("error" in result).toBe(true);
  });

  it("rejects INSERT", async () => {
    const result = await executeQuery({
      sql: "INSERT INTO sellers (name, slug, country, joined_at, rating, is_active, commission_rate, created_at, updated_at) VALUES ('x', 'x', 'x', NOW(), 1.0, true, 0.1, NOW(), NOW())",
    });
    expect("error" in result).toBe(true);
  });

  it("rejects CREATE TABLE", async () => {
    const result = await executeQuery({
      sql: "CREATE TABLE temp_test (id int)",
    });
    expect("error" in result).toBe(true);
  });

  it("rejects DROP", async () => {
    const result = await executeQuery({
      sql: "DROP TABLE IF EXISTS nonexistent_test",
    });
    expect("error" in result).toBe(true);
  });

  it("rejects TRUNCATE", async () => {
    const result = await executeQuery({ sql: "TRUNCATE sellers" });
    expect("error" in result).toBe(true);
  });

  it("rejects multiple statements", async () => {
    const result = await executeQuery({ sql: "SELECT 1; SELECT 2" });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.kind).toBe("MULTI_STATEMENT");
  });

  it("reports syntax errors with position", async () => {
    const result = await executeQuery({ sql: "selct 1" });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.code).toBe("42601");
    expect(result.error.position).not.toBeNull();
  });

  it("truncates results above maxRows", async () => {
    const result = await executeQuery({
      sql: "SELECT * FROM generate_series(1, 100)",
      maxRows: 10,
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.truncated).toBe(true);
    expect(result.rows).toHaveLength(10);
    expect(result.rowCount).toBe(10);
  });

  it("does not truncate when under maxRows", async () => {
    const result = await executeQuery({
      sql: "SELECT * FROM generate_series(1, 5)",
      maxRows: 100,
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.truncated).toBe(false);
    expect(result.rows).toHaveLength(5);
  });

  it("executes EXPLAIN ANALYZE", async () => {
    const result = await executeQuery({
      sql: "EXPLAIN ANALYZE SELECT count(*) FROM sellers",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("times out on pg_sleep exceeding timeout", async () => {
    const result = await executeQuery({ sql: "SELECT pg_sleep(10)" });
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error.kind).toBe("TIMEOUT");
  });

  it("executes a window function query", async () => {
    const result = await executeQuery({
      sql: "SELECT seller_id, ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY id) AS rn FROM order_items LIMIT 5",
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.columns).toHaveLength(2);
  });
});

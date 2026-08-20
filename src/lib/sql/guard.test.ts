import { describe, expect, it } from "vitest";
import {
  detectMultiStatement,
  MAX_SQL_LENGTH,
  mapErrorKind,
  validateInput,
} from "#/lib/sql/guard";

describe("validateInput", () => {
  it("rejects empty SQL", () => {
    const result = validateInput("");
    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("INPUT_INVALID");
  });

  it("rejects whitespace-only SQL", () => {
    const result = validateInput("   \n\t  ");
    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("INPUT_INVALID");
  });

  it("rejects SQL exceeding max length", () => {
    const sql = "SELECT 1".repeat(MAX_SQL_LENGTH);
    const result = validateInput(sql);
    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("INPUT_INVALID");
  });

  it("rejects maxRows < 1", () => {
    const result = validateInput("SELECT 1", 0);
    expect(result.ok).toBe(false);
  });

  it("rejects maxRows > hard max", () => {
    const result = validateInput("SELECT 1", 10000);
    expect(result.ok).toBe(false);
  });

  it("accepts valid input", () => {
    const result = validateInput("SELECT 1", 100);
    expect(result.ok).toBe(true);
  });
});

describe("detectMultiStatement", () => {
  it("detects two statements", () => {
    expect(detectMultiStatement("SELECT 1; SELECT 2")).toBe(true);
  });

  it("allows trailing semicolon", () => {
    expect(detectMultiStatement("SELECT 1;")).toBe(false);
  });

  it("allows semicolons in string literals", () => {
    expect(detectMultiStatement("SELECT 'hello; world'")).toBe(false);
  });

  it("allows semicolons in single-line comments", () => {
    expect(detectMultiStatement("SELECT 1 -- this; is a comment\n")).toBe(
      false,
    );
  });

  it("allows semicolons in block comments", () => {
    expect(detectMultiStatement("SELECT 1 /* this; is a comment */")).toBe(
      false,
    );
  });

  it("allows escaped quotes in strings", () => {
    expect(detectMultiStatement("SELECT 'it''s; ok'")).toBe(false);
  });

  it("allows quoted identifiers with semicolons", () => {
    expect(detectMultiStatement('SELECT "col;name" FROM t')).toBe(false);
  });

  it("detects statement after comment", () => {
    expect(detectMultiStatement("SELECT 1 -- comment\n; SELECT 2")).toBe(true);
  });
});

describe("mapErrorKind", () => {
  it("maps timeout", () => {
    expect(mapErrorKind("57014")).toBe("TIMEOUT");
  });

  it("maps permission denied", () => {
    expect(mapErrorKind("42501")).toBe("READ_ONLY_VIOLATION");
  });

  it("maps read-only transaction", () => {
    expect(mapErrorKind("25006")).toBe("READ_ONLY_VIOLATION");
  });

  it("maps syntax error", () => {
    expect(mapErrorKind("42601")).toBe("SYNTAX_ERROR");
  });

  it("maps undefined table", () => {
    expect(mapErrorKind("42P01")).toBe("SYNTAX_ERROR");
  });

  it("maps undefined column", () => {
    expect(mapErrorKind("42703")).toBe("SYNTAX_ERROR");
  });

  it("maps unknown codes", () => {
    expect(mapErrorKind("99999")).toBe("UNKNOWN");
  });

  it("maps undefined code", () => {
    expect(mapErrorKind(undefined)).toBe("UNKNOWN");
  });
});

/** Shared types for the query console — imported by both the API and the UI. */

import type { PrqlCompileErrorDetail } from "#/lib/prql/types";

export type QueryLanguage = "sql" | "prql";

export interface QueryRequest {
  /** The query source. PRQL when `language` is `"prql"`, SQL otherwise. */
  sql: string;
  maxRows?: number;
  /** Defaults to `"sql"`. `"prql"` is compiled to SQL before execution. */
  language?: QueryLanguage;
}

export interface QueryColumn {
  name: string;
  dataTypeId: number;
  dataType: string;
}

export interface QuerySuccess {
  columns: QueryColumn[];
  rows: unknown[][];
  rowCount: number;
  durationMs: number;
  truncated: boolean;
  command: string;
  notices: string[];
  /** The SQL that actually ran. Only set when `language` was `"prql"`. */
  compiledSql?: string;
}

export type ErrorKind =
  | "PRQL_COMPILE_ERROR"
  | "SYNTAX_ERROR"
  | "PERMISSION_DENIED"
  | "TIMEOUT"
  | "READ_ONLY_VIOLATION"
  | "MULTI_STATEMENT"
  | "INPUT_INVALID"
  | "UNKNOWN";

export interface QueryErrorDetail {
  message: string;
  code: string | null;
  position: number | null;
  detail: string | null;
  hint: string | null;
  where: string | null;
  kind: ErrorKind;
  /** Compiler detail — only set when `kind` is `"PRQL_COMPILE_ERROR"`. */
  prql?: PrqlCompileErrorDetail;
}

export interface QueryErrorResponse {
  error: QueryErrorDetail;
}

export type QueryResponse = QuerySuccess | QueryErrorResponse;

/** Schema introspection types (GET /api/schema). */
export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

export interface SchemaForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface SchemaTable {
  name: string;
  kind: "table" | "view" | "materialized_view";
  columns: SchemaColumn[];
  foreignKeys: SchemaForeignKey[];
  rowCount: number;
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface SchemaIntrospection {
  tables: SchemaTable[];
  enums: SchemaEnum[];
}

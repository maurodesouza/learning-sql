/** Shared types for the query console — imported by both the API and the UI. */

export interface QueryRequest {
  sql: string;
  maxRows?: number;
  /** Reserved for a future `language: 'sql' | 'prql'` dimension (PRQL Epic). */
  language?: "sql";
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
}

export type ErrorKind =
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

/** Shared types for PRQL compilation — imported by both the API and the UI. */

export interface PrqlCompileRequest {
  prql: string;
}

export interface PrqlCompileSuccess {
  sql: string;
}

/** 1-based, UI-facing location of a compile failure. */
export interface PrqlErrorLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface PrqlCompileErrorDetail {
  /** Plain-text reason from the compiler. */
  reason: string;
  /** Machine-readable identifier, when the compiler provides one. */
  code: string | null;
  /** Suggestions on how to fix the error. */
  hints: string[];
  /** Annotated code snippet produced by the compiler. */
  display: string | null;
  /** null when the compiler gives no location. */
  location: PrqlErrorLocation | null;
}

export interface PrqlCompileErrorResponse {
  error: PrqlCompileErrorDetail;
}

export type PrqlCompileResponse = PrqlCompileSuccess | PrqlCompileErrorResponse;

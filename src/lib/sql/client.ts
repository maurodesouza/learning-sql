/** Client-side API helpers for the query console. */

import type {
  QueryErrorResponse,
  QueryRequest,
  QueryResponse,
  QuerySuccess,
  SchemaIntrospection,
} from "#/lib/sql/types";

export async function fetchSchema(): Promise<SchemaIntrospection> {
  const res = await fetch("/api/schema", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch schema: ${res.status}`);
  }
  return res.json() as Promise<SchemaIntrospection>;
}

export async function runQuery(req: QueryRequest): Promise<QueryResponse> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<QueryResponse>;
}

export function isQuerySuccess(r: QueryResponse): r is QuerySuccess {
  return !("error" in r);
}

export function isQueryError(r: QueryResponse): r is QueryErrorResponse {
  return "error" in r;
}

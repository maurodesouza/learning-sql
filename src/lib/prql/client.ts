/** Client-side API helpers for PRQL compilation. */

import type {
  PrqlCompileErrorResponse,
  PrqlCompileRequest,
  PrqlCompileResponse,
  PrqlCompileSuccess,
} from "#/lib/prql/types";

export async function compilePrql(prql: string): Promise<PrqlCompileResponse> {
  const body: PrqlCompileRequest = { prql };
  const res = await fetch("/api/prql/compile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<PrqlCompileResponse>;
}

export function isPrqlCompileSuccess(
  r: PrqlCompileResponse,
): r is PrqlCompileSuccess {
  return !("error" in r);
}

export function isPrqlCompileError(
  r: PrqlCompileResponse,
): r is PrqlCompileErrorResponse {
  return "error" in r;
}

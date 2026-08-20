/**
 * POST /api/prql/compile — compile PRQL to PostgreSQL SQL without executing it.
 *
 * Returns { sql } on success, or { error: { reason, code, hints, display,
 * location } } on a compile failure. Never leaks stack traces, file paths or
 * env values. Nothing here touches the database.
 */
import { compilePrql } from "#/lib/prql/compile";
import type { PrqlCompileRequest, PrqlCompileResponse } from "#/lib/prql/types";

// prqlc is a Node.js wasm build; it cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: PrqlCompileRequest;
  try {
    body = (await request.json()) as PrqlCompileRequest;
  } catch {
    return Response.json(
      {
        error: {
          reason: "Invalid JSON body.",
          code: null,
          hints: [],
          display: null,
          location: null,
        },
      },
      { status: 400 },
    );
  }

  const result: PrqlCompileResponse = await compilePrql(body?.prql ?? "");

  const isError = "error" in result;
  return Response.json(result, { status: isError ? 400 : 200 });
}

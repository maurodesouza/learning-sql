/**
 * POST /api/query — read-only SQL execution endpoint.
 *
 * Returns { columns, rows, rowCount, durationMs, truncated, command, notices }
 * on success, or { error: { message, code, position, detail, hint, where, kind } }
 * on failure. Never leaks connection strings, stack traces or env values.
 *
 * POST is not cached by default in Next 16. Runs on the Node.js runtime (pg
 * is not edge-compatible).
 */
import { executeQuery } from "#/lib/sql/execute";
import type { QueryRequest, QueryResponse } from "#/lib/sql/types";

// Always run on the Node.js runtime (pg needs it).
export const runtime = "nodejs";
// Never cache — every request hits the database.
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let body: QueryRequest;
  try {
    body = (await request.json()) as QueryRequest;
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON body.", kind: "INPUT_INVALID" } },
      { status: 400 },
    );
  }

  const result: QueryResponse = await executeQuery(body);

  // 400 for user/SQL errors, 200 for success.
  const isError = "error" in result;
  return Response.json(result, { status: isError ? 400 : 200 });
}

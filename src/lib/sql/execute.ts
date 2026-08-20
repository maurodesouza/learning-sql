/**
 * Query execution logic — shared between the API route and the validation script.
 *
 * Executes read-only SQL through the read-only pg pool with:
 *   - BEGIN TRANSACTION READ ONLY
 *   - SET LOCAL statement_timeout
 *   - Single-statement via extended protocol (values: [])
 *   - Row cap with truncation detection
 */
import { readonlyPool } from "#/lib/db/readonly";
import { env } from "#/lib/env";
import {
  detectMultiStatement,
  HARD_MAX_ROWS,
  mapErrorKind,
  validateInput,
} from "#/lib/sql/guard";
import type {
  QueryColumn,
  QueryErrorDetail,
  QueryErrorResponse,
  QueryRequest,
  QueryResponse,
  QuerySuccess,
} from "#/lib/sql/types";

// Cache of dataTypeId -> readable type name.
let typeNameCache: Map<number, string> | null = null;

async function getTypeName(dataTypeId: number): Promise<string> {
  if (!typeNameCache) {
    typeNameCache = await loadTypeNames();
  }
  return typeNameCache.get(dataTypeId) ?? `unknown(${dataTypeId})`;
}

async function loadTypeNames(): Promise<Map<number, string>> {
  const client = await readonlyPool.connect();
  try {
    const result = await client.query<{ oid: number; typname: string }>(
      `SELECT oid, typname FROM pg_type`,
    );
    const map = new Map<number, string>();
    for (const row of result.rows) {
      map.set(row.oid, row.typname);
    }
    return map;
  } finally {
    client.release();
  }
}

export async function executeQuery(req: QueryRequest): Promise<QueryResponse> {
  const { sql, maxRows: requestedMaxRows } = req;
  const maxRows = Math.min(requestedMaxRows ?? env.queryMaxRows, HARD_MAX_ROWS);

  // Input validation
  const validation = validateInput(sql, requestedMaxRows);
  if (!validation.ok) {
    return errorResponse(validation.error!.message, "INPUT_INVALID");
  }

  // Multi-statement detection (friendly error before hitting PG)
  if (detectMultiStatement(sql)) {
    return errorResponse(
      "Only one statement at a time is allowed.",
      "MULTI_STATEMENT",
    );
  }

  const client = await readonlyPool.connect();
  const startTime = performance.now();

  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${env.queryTimeoutMs}`);
    await client.query(
      `SET LOCAL idle_in_transaction_session_timeout = ${env.queryTimeoutMs}`,
    );

    // Extended protocol: values: [] forces parameterised execution which
    // rejects multiple statements at the protocol level.
    const result = await client.query({
      text: sql,
      values: [],
      rowMode: "array",
    });

    const durationMs = performance.now() - startTime;

    // Build column metadata
    const columns: QueryColumn[] = [];
    for (const field of result.fields) {
      columns.push({
        name: field.name,
        dataTypeId: field.dataTypeID,
        dataType: await getTypeName(field.dataTypeID),
      });
    }

    // Row cap: fetch max + 1 to detect truncation
    let rows = result.rows as unknown[][];
    let truncated = false;
    if (rows.length > maxRows) {
      truncated = true;
      rows = rows.slice(0, maxRows);
    }

    // Capture notices
    const notices: string[] = [];
    // pg doesn't expose notices easily per-query; they come via pool 'notice' events.
    // For EXPLAIN output, the result rows contain the plan.

    const success: QuerySuccess = {
      columns,
      rows,
      rowCount: rows.length,
      durationMs: Math.round(durationMs * 10) / 10,
      truncated,
      command: result.command,
      notices,
    };

    return success;
  } catch (err) {
    const error = err as DatabaseError;
    const kind = mapErrorKind(error.code);
    return errorResponse(
      error.message ?? "Unknown database error",
      kind,
      error.code,
      error.position ? Number(error.position) : null,
      error.detail,
      error.hint,
      error.where,
    );
  } finally {
    // Always ROLLBACK and release — never commit a read-only transaction.
    try {
      await client.query("ROLLBACK");
    } catch {
      // Connection may already be broken; ignore.
    }
    client.release();
  }
}

function errorResponse(
  message: string,
  kind: QueryErrorDetail["kind"],
  code: string | null = null,
  position: number | null = null,
  detail: string | null = null,
  hint: string | null = null,
  where: string | null = null,
): QueryErrorResponse {
  const error: QueryErrorDetail = {
    message,
    code,
    position,
    detail,
    hint,
    where,
    kind,
  };
  return { error };
}

/** Minimal interface for pg DatabaseError fields we use. */
interface DatabaseError {
  message: string;
  code?: string;
  position?: string;
  detail?: string;
  hint?: string;
  where?: string;
}

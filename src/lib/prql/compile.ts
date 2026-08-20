/**
 * PRQL -> PostgreSQL compilation.
 *
 * `prqlc` is a wasm-pack `nodejs` build: it `readFileSync`s its `.wasm` at
 * import time, so it must stay externalised (`serverExternalPackages` in
 * next.config.ts) and server-side. The import is lazy and memoised so the
 * WebAssembly instantiation happens on the first compile rather than on every
 * server boot, and a broken install surfaces as an API error, not a crash.
 *
 * Only PRQL -> SQL exists. `prqlc` has no SQL -> PRQL path.
 */

import "server-only";
import type {
  PrqlCompileErrorDetail,
  PrqlCompileResponse,
} from "#/lib/prql/types";
import { MAX_SQL_LENGTH } from "#/lib/sql/guard";

const TARGET = "sql.postgres";

let modPromise: Promise<typeof import("prqlc")> | null = null;

function loadPrqlc(): Promise<typeof import("prqlc")> {
  if (!modPromise) {
    modPromise = import("prqlc").catch((err) => {
      // Do not memoise a failed load — a later call may succeed.
      modPromise = null;
      throw err;
    });
  }
  return modPromise;
}

export async function compilePrql(prql: string): Promise<PrqlCompileResponse> {
  if (!prql || prql.trim().length === 0) {
    return { error: detail("PRQL query is empty.") };
  }
  if (prql.length > MAX_SQL_LENGTH) {
    return {
      error: detail(
        `PRQL query is too long (${prql.length} chars, max ${MAX_SQL_LENGTH}).`,
      ),
    };
  }

  let prqlc: typeof import("prqlc");
  try {
    prqlc = await loadPrqlc();
  } catch {
    return { error: detail("The PRQL compiler is unavailable.") };
  }

  const options = new prqlc.CompileOptions();
  // The query header may still override this (`prql target:sql.mssql`); that is
  // the compiler's contract, but our default is always Postgres.
  options.target = TARGET;
  options.format = true;
  options.signature_comment = false;

  try {
    const sql = prqlc.compile(prql, options);
    if (typeof sql !== "string") {
      return { error: detail("The PRQL compiler returned no SQL.") };
    }
    return { sql };
  } catch (err) {
    return { error: mapPrqlError(err) };
  }
}

/**
 * Turn a thrown `prqlc` error into a structured, UI-safe detail.
 *
 * The thrown error's `message` is a JSON string shaped as
 * `{ inner: ErrorMessage[] }`, where `location` holds 0-based
 * `{ start: [line, col], end: [line, col] }`. Anything unexpected degrades to
 * a generic error — never a stack trace.
 */
export function mapPrqlError(err: unknown): PrqlCompileErrorDetail {
  const message = (err as { message?: unknown } | null)?.message;
  if (typeof message !== "string") return detail();

  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return detail();
  }

  const inner = (parsed as { inner?: unknown })?.inner;
  const first = Array.isArray(inner) ? inner[0] : undefined;
  if (!first || typeof first !== "object") return detail();

  const raw = first as Record<string, unknown>;
  return {
    reason:
      typeof raw.reason === "string" && raw.reason.length > 0
        ? raw.reason
        : DEFAULT_REASON,
    code: typeof raw.code === "string" ? raw.code : null,
    hints: Array.isArray(raw.hints)
      ? raw.hints.filter((h): h is string => typeof h === "string")
      : [],
    display: typeof raw.display === "string" ? raw.display : null,
    location: toLocation(raw.location),
  };
}

const DEFAULT_REASON = "Failed to compile PRQL.";

function detail(reason: string = DEFAULT_REASON): PrqlCompileErrorDetail {
  return { reason, code: null, hints: [], display: null, location: null };
}

/** Convert the compiler's 0-based `{ start, end }` tuples to 1-based numbers. */
function toLocation(value: unknown): PrqlCompileErrorDetail["location"] {
  if (!value || typeof value !== "object") return null;
  const { start, end } = value as { start?: unknown; end?: unknown };
  if (!isPair(start) || !isPair(end)) return null;
  return {
    startLine: start[0] + 1,
    startColumn: start[1] + 1,
    endLine: end[0] + 1,
    endColumn: end[1] + 1,
  };
}

function isPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

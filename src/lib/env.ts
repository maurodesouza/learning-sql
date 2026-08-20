/**
 * Single source of truth for environment variables.
 *
 * Reads and validates every env var the app needs, failing fast with a readable
 * message. Dependency-free (no zod) — the validation surface is small and a
 * library is not justified yet.
 *
 * Import from here instead of reading `process.env` directly elsewhere.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function int(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(
      `Environment variable ${name} must be an integer, got: ${value}`,
    );
  }
  return parsed;
}

function read(name: string): string | undefined {
  // Next.js only exposes env vars explicitly whitelisted to the browser; on the
  // server everything is available. We read from process.env directly.
  return process.env[name];
}

export const env = {
  /** Owner connection — Prisma migrations + seed. */
  databaseUrl: required("DATABASE_URL", read("DATABASE_URL")),
  /** Read-only connection — query console API. */
  databaseUrlReadonly: required(
    "DATABASE_URL_READONLY",
    read("DATABASE_URL_READONLY"),
  ),

  /** Per-query statement timeout in milliseconds. */
  queryTimeoutMs: int("QUERY_TIMEOUT_MS", read("QUERY_TIMEOUT_MS"), 5000),
  /** Hard row cap for query results. */
  queryMaxRows: int("QUERY_MAX_ROWS", read("QUERY_MAX_ROWS"), 1000),

  /** Seed scale: "small" = ~10x smaller dataset, anything else = full. */
  seedScale: read("SEED_SCALE") === "small" ? "small" : "full",

  postgres: {
    user: read("POSTGRES_USER") ?? "learning",
    password: read("POSTGRES_PASSWORD") ?? "learning",
    db: read("POSTGRES_DB") ?? "learning_sql",
    port: int("POSTGRES_PORT", read("POSTGRES_PORT"), 5432),
  },
} as const;

export type Env = typeof env;

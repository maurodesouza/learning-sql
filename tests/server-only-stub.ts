/**
 * Stub for the `server-only` package (aliased in vitest.config.ts).
 *
 * The real module throws when imported outside a React Server Component build,
 * which would make `src/lib/prql/compile.ts` untestable. Vitest already runs in
 * a Node environment, so the guard has nothing to protect here.
 */
export {};

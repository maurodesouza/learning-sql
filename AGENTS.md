<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project commands

- **Database**: `docker compose up -d` (start Postgres 18), `docker compose down -v` (reset volume)
- **Migrations**: `pnpm db:migrate` (dev), `pnpm db:deploy` (apply), `pnpm db:generate` (client)
- **Seed/reset**: `pnpm db:seed`, `pnpm db:reset`, `pnpm db:truncate`, `pnpm db:refresh`
- **Dev**: `pnpm dev` (Next.js), `pnpm build`, `pnpm start`
- **Quality**: `pnpm lint` (Biome), `pnpm format` (Biome write), `pnpm typecheck` (tsc --noEmit), `pnpm test` (Vitest)
- **Validation**: `pnpm validate:examples` (runs every catalog query against the seeded DB)
- **Prisma 7**: config in `prisma.config.ts` (no `package.json#prisma`); generator `prisma-client` with `output = ../src/generated/prisma`; driver adapter `@prisma/adapter-pg`; generated client is git-ignored and excluded from Biome.
- **Read-only DB access**: the query console uses `pg` directly with the `sql_lab_readonly` role — never Prisma. Prisma is for schema/migrations/seed only.


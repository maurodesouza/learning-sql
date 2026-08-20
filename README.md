# SQL Learning Lab

A self-contained SQL learning lab: one `docker compose up` + one seed command gives a
rich, realistic PostgreSQL marketplace database, and a web console where you type SQL,
run it, and inspect the results in a data grid.

> Work in progress — the full lab (data model, seed, query console UI, learning content)
> is being built out. This README is rewritten in the final work item.

## Prerequisites

- [Docker](https://www.docker.com/) (Docker Desktop or Docker Engine + Compose v2)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10.x (`corepack enable`)

## Quick start

```bash
cp .env.example .env          # local-only credentials, safe defaults
docker compose up -d          # PostgreSQL 18 + read-only role
pnpm install                  # dependencies
pnpm db:migrate               # create the schema (Prisma migrations)
pnpm dev                      # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Biome lint + format check |
| `pnpm format` | Biome format (write) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:migrate` | `prisma migrate dev` — create/apply migrations |
| `pnpm db:deploy` | `prisma migrate deploy` — apply migrations (CI/prod) |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:studio` | Prisma Studio GUI |
| `pnpm db:seed` | Seed the database (placeholder until #4) |
| `pnpm db:reset` | Drop + migrate + seed (placeholder until #4) |
| `pnpm db:truncate` | Empty all data, keep schema (placeholder until #4) |
| `pnpm db:refresh` | Refresh materialized views + ANALYZE (placeholder until #4) |

## Watching SQL in the logs

The Postgres container logs every statement:

```bash
docker compose logs -f db
```

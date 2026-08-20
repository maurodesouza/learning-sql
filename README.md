# SQL Learning Lab

A self-contained SQL learning lab: one `docker compose up` + one seed command gives a
rich, realistic PostgreSQL marketplace database, and a web console where you type SQL,
run it, and inspect the results in a data grid.

## What you get

- **PostgreSQL 18** with a marketplace schema (24 tables, views, materialized views, enums, indexes, triggers)
- **~500k rows** of deterministic, realistic data (sellers, products, customers, orders, events, reviews)
- **Read-only SQL console** in your browser — type any `SELECT`, get results in a sortable grid
- **Schema explorer** — browse tables, columns, primary/foreign keys, and enum types
- **28 example queries** from beginner to advanced, all validated against the dataset
- **Learning guide** with a concept checklist ([docs/learning-guide.md](docs/learning-guide.md))

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
pnpm db:seed                  # seed ~500k rows of marketplace data
pnpm dev                      # http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000), pick an example from the
"Examples" dropdown, and hit **Run** (or Ctrl/Cmd+Enter).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (Next.js 16 + React 19)                     │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │ Schema      │  │ SQL Editor → Results Grid     │  │
│  │ Explorer    │  │ (react-data-grid)             │  │
│  └─────────────┘  └──────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/query (read-only)
                       │ GET /api/schema (introspection)
┌──────────────────────▼──────────────────────────────┐
│  Next.js API Routes (Node.js runtime)                │
│  • BEGIN TRANSACTION READ ONLY                       │
│  • SET LOCAL statement_timeout                        │
│  • Single-statement enforcement                       │
│  • Row cap + truncation detection                     │
└──────────────────────┬──────────────────────────────┘
                       │ pg (node-postgres)
┌──────────────────────▼──────────────────────────────┐
│  PostgreSQL 18 (Docker)                               │
│  • sql_lab_readonly role (SELECT only)                │
│  • 24 tables, 2 views, 1 materialized view            │
│  • 12 enum types, indexes, triggers, FTS              │
└───────────────────────────────────────────────────────┘
```

### Read-only safety

The query console is safe by design — multiple layers prevent data modification:

1. **Postgres role**: `sql_lab_readonly` has `SELECT`/`USAGEAGE` privileges only
2. **Read-only transaction**: Every query runs in `BEGIN TRANSACTION READ ONLY`
3. **Single-statement enforcement**: Extended protocol + multi-statement scanner
4. **Input validation**: Max length, non-empty, maxRows bounds

There is **no keyword blacklist** — those break legitimate queries (e.g., a column named
`update_count`) and give false confidence. The real boundary is Postgres privileges.

### Type fidelity

The API preserves PostgreSQL types that JavaScript would otherwise lose:
- `bigint` → string (JS Number loses precision above 2^53)
- `numeric`/`decimal` → string (preserves decimal precision)
- `date`/`timestamp`/`timestamptz` → ISO string (avoids timezone drift)
- `jsonb` → parsed object
- `text[]` → string array

## Database schema

The marketplace schema covers e-commerce domain modeling with:

- **Catalog**: sellers, suppliers, categories (tree), products, variants, inventory, warehouses
- **Customers**: customers (with self-referencing referrals), addresses, employees (5-level hierarchy)
- **Orders**: orders, order_items, payments (split), shipments, returns, coupons, order_coupons
- **Engagement**: carts, cart_items, page_view_events (funnel), reviews
- **Reference**: exchange_rates (date ranges), daily_sales_snapshots (derived)
- **Advanced objects**: materialized view (`mv_monthly_seller_revenue`), full-text search index, triggers

See [docs/data-model.md](docs/data-model.md) for the full schema diagram and column details.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Biome lint + format check |
| `pnpm format` | Biome format (write) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit + integration tests) |
| `pnpm validate:examples` | Validate all example queries against the DB |
| `pnpm db:migrate` | `prisma migrate dev` — create/apply migrations |
| `pnpm db:deploy` | `prisma migrate deploy` — apply migrations (CI/prod) |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:studio` | Prisma Studio GUI |
| `pnpm db:seed` | Seed the database (deterministic, ~500k rows) |
| `pnpm db:reset` | Drop + migrate + seed (full reset) |
| `pnpm db:truncate` | Empty all data, keep schema |
| `pnpm db:refresh` | Refresh materialized views + ANALYZE |

### Seed scale

The seed supports a `SEED_SCALE` environment variable for faster iteration:

```bash
SEED_SCALE=small pnpm db:seed    # ~10x fewer rows, runs in ~6s
pnpm db:seed                     # full dataset, ~500k rows, runs in ~50s
```

## Watching SQL in the logs

The Postgres container logs every statement:

```bash
docker compose logs -f db
```

## Learning resources

- [Learning Guide](docs/learning-guide.md) — step-by-step guide with a concept checklist
- [Data Model](docs/data-model.md) — full schema reference
- **Examples dropdown** in the console — 28 queries across beginner/intermediate/advanced

## Tech stack

| Layer | Technology |
| --- | --- |
| Database | PostgreSQL 18 (Docker) |
| Schema/Migrations | Prisma 7.9 |
| Seed | @faker-js/faker 10 + pg (bulk inserts) |
| API | Next.js 16 Route Handlers (Node.js runtime) |
| Database driver | pg (node-postgres) |
| UI | React 19, shadcn/ui, react-data-grid |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Testing | Vitest |

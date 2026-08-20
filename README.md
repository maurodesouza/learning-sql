# SQL Learning Lab

A self-contained SQL learning lab: one `docker compose up` + one seed command gives a
rich, realistic PostgreSQL marketplace database, and a web console where you type SQL
**or PRQL**, run it, and inspect the results in a data grid. PRQL is compiled to SQL
on the server, so you see both languages side by side — the fastest way to learn both.

## What you get

- **PostgreSQL 18** with a marketplace schema (24 tables, views, materialized views, enums, indexes, triggers)
- **~500k rows** of deterministic, realistic data (sellers, products, customers, orders, events, reviews)
- **Dual-pane query console** — write PRQL on the left, SQL on the right, run whichever has focus
- **PRQL → SQL compilation** on the server (`prqlc`), with a Transform action to compile without running
- **Schema-aware SQL autocompletion** — table and column names from the live schema
- **Schema explorer** — browse tables, columns, primary/foreign keys, and enum types; click a table to copy its `SELECT` to the clipboard
- **Multi-instance workspace** — dockable/resizable tabs (`flexlayout-react`) host any number of independent Query Console and Schema Explorer panels
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
"Examples" dropdown, and hit **Run** (or Ctrl/Cmd+Enter). The PRQL pane on the left
lets you write PRQL pipelines; **Transform** (Ctrl/Cmd+E) compiles them to SQL.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (Next.js 16 + React 19)                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ AppHeader (logo + title)                         │ │
│  ├─────────────────────────────────────────────────┤ │
│  │ Workspace (flexlayout-react dockable layout)     │ │
│  │  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Schema       │  │ Query Console (N tabs)   │ │ │
│  │  │ Explorer(s)  │  │ PRQL │ SQL → Results Grid │ │ │
│  │  │ copy SELECT  │  │ each tab = own store +   │ │ │
│  │  │ to clipboard │  │ scoped command handlers  │ │ │
│  │  └──────────────┘  └──────────────────────────┘ │ │
│  │  [+ Add Query Console] [+ Add Schema Explorer]   │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/query (read-only, sql | prql)
                       │ POST /api/prql/compile (PRQL → SQL, no DB)
                       │ GET /api/schema (introspection)
┌──────────────────────▼──────────────────────────────┐
│  Next.js API Routes (Node.js runtime)                │
│  • prqlc compiles PRQL → PostgreSQL SQL (server-only)│
│  • BEGIN TRANSACTION READ ONLY                       │
│  • SET LOCAL statement_timeout                        │
│  • Single-statement enforcement (applies to compiled │
│    SQL too — no bypass)                               │
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

1. **Postgres role**: `sql_lab_readonly` has `SELECT`/`USAGE` privileges only
2. **Read-only transaction**: Every query runs in `BEGIN TRANSACTION READ ONLY`
3. **Single-statement enforcement**: Extended protocol + multi-statement scanner
4. **Input validation**: Max length, non-empty, maxRows bounds

PRQL changes none of this: the compiled SQL is untrusted input like any other and
goes through the same guard. A compile failure never reaches the database.

There is **no keyword blacklist** — those break legitimate queries (e.g., a column named
`update_count`) and give false confidence. The real boundary is Postgres privileges.

### Writing PRQL

The console shows two editors side by side: **PRQL** on the left, **SQL** on the right.

- **Run** (button or Ctrl/Cmd+Enter) executes the pane that has focus. Running PRQL
  compiles it, executes the resulting SQL, and back-fills the SQL pane so you always
  see what ran.
- **Transform** (button or Ctrl/Cmd+E, from the PRQL pane) compiles PRQL to SQL and
  writes it into the SQL pane without executing anything.
- PRQL compile errors appear in the results panel with the reason, hints, and the
  1-based line:column of the failure — never as a Postgres error.

Only PRQL → SQL is supported. SQL → PRQL is not implemented by `prqlc` and is a
long-term roadmap item for the PRQL project; it does not appear in the UI.

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
| PRQL compiler | prqlc 0.13 (server-side, externalised) |
| Database driver | pg (node-postgres) |
| Editor | CodeMirror 6 (@uiw/react-codemirror, @codemirror/lang-sql) |
| UI | React 19, shadcn/ui, react-data-grid |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Testing | Vitest |

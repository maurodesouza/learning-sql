# Plan — Challenges feature

> Status: **plan only, nothing implemented**. Written for the agent that will implement it.
> All challenge content and every user-facing string must be written in **English**.

## 1. What we are building

A **Challenges** feature: a curated set of SQL exercises grouped by level
(`beginner`, `mid-level`, `senior`, `expert`), presented in a lateral workspace tab.
The tab is a master/detail: it shows the challenge **list**; clicking a challenge
**replaces the tab content** with that challenge's detail view; a back button returns
to the list.

Answering happens in a **Query Console** instance the user binds to the challenge
(picked from the existing `InstanceRegistry`). "Check answer" sends that console's
current source to the server, which runs it **and** the hidden reference solution
through the same read-only path and compares **column names + rows**.

Everything spoiler-ish is hidden behind explicit reveal actions: **expected result**,
**hints**, **reference solution**.

### Decisions already made (do not re-litigate)

| Topic | Decision |
|---|---|
| Correctness | Run the reference solution server-side; compare column names + row set |
| UI | One lateral tab (like Schema Explorer), list ⇄ detail inside the same tab |
| Storage | Postgres via Prisma — challenges, hints and progress are DB rows |
| Progress | Single-user global (no auth, no session id): one progress row per challenge |
| Reveal | Three levels: expected result → hints → reference solution |
| Language | Challenge content and UI copy in English |
| Console binding | Explicit console picker fed by `InstanceRegistry` |

### Assumptions (flag to the user if any is wrong)

- Single local user, no authentication; progress is global to the database.
- Challenges are **authored in code** (a versioned TS catalog) and **projected into the
  DB by the seed** via upsert-by-slug. The DB is the runtime source of truth; the catalog
  file is the editable source of truth. This keeps content in git and code review.
- The answer may be written in **SQL or PRQL** — the check accepts a `language` and
  reuses `executeQuery`, which already compiles PRQL first.
- Progress rows are user data: `pnpm db:truncate` / `pnpm db:seed` must **not** wipe them
  (`pnpm db:reset` / `prisma migrate reset` still drops everything — that is fine).

---

## 2. Spoiler containment — read this first

`docker/postgres/init/02-roles.sh` sets:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE "$POSTGRES_USER" IN SCHEMA public
  GRANT SELECT ON TABLES TO sql_lab_readonly;
```

So any new table in `public` is **automatically readable from the query console**, and
`GET /api/schema` lists relations straight from `pg_class WHERE nspname = 'public'`
(visible regardless of grants). Putting `challenges` in `public` would mean the user can
`SELECT solution_sql FROM challenges` and would see the tables in the Schema Explorer.

**Therefore: challenge tables live in a dedicated `lab` schema.**

- Prisma datasource gets `schemas = ["public", "lab"]` (multi-schema; verify whether
  Prisma 7 still needs `previewFeatures = ["multiSchema"]` — check
  `node_modules/prisma/dist/docs/` / the Prisma 7 docs before writing the schema).
- The migration must create the schema and lock it down. The init script only runs on a
  fresh volume, so the grants belong **in the migration**, not in `02-roles.sh`:

```sql
CREATE SCHEMA IF NOT EXISTS lab;
REVOKE ALL ON SCHEMA lab FROM sql_lab_readonly;
REVOKE ALL ON ALL TABLES IN SCHEMA lab FROM sql_lab_readonly;
-- no USAGE on lab => the console cannot even name these tables
```

Server-side, challenge data is read with **Prisma (owner connection)**; user queries keep
going through the **read-only `pg` pool**. `AGENTS.md` currently says "Prisma is for
schema/migrations/seed only" — that line must be amended (see §9).

The reveal endpoints obviously return solutions on demand; a determined user can call them
directly. That is acceptable for a local learning lab — the goal is "no accidental spoilers".

---

## 3. Database layer

### 3.1 Prisma models (`prisma/schema.prisma`)

Follow existing conventions: `@map` snake_case, plural table names, explicit FK `map:` names,
`@@index` on FKs.

```prisma
enum ChallengeLevel {
  BEGINNER
  MID_LEVEL
  SENIOR
  EXPERT

  @@schema("lab")
}

enum ChallengeStatus {
  ATTEMPTED
  SOLVED

  @@schema("lab")
}

model Challenge {
  id             Int             @id @default(autoincrement())
  slug           String          @unique
  title          String
  level          ChallengeLevel
  orderIndex     Int             @map("order_index")
  /// Task statement shown to the user (plain text / light markdown, English).
  prompt         String
  /// Optional starter query loaded into the bound console.
  starterSql     String?         @map("starter_sql")
  /// Reference solution — NEVER sent to the client except via the reveal endpoint.
  solutionSql    String          @map("solution_sql")
  /// When true, row order is part of correctness.
  orderMatters   Boolean         @default(false) @map("order_matters")
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  hints          ChallengeHint[]
  progress       ChallengeProgress?

  @@unique([level, orderIndex])
  @@index([level])
  @@map("challenges")
  @@schema("lab")
}

model ChallengeHint {
  id           Int       @id @default(autoincrement())
  challengeId  Int       @map("challenge_id")
  position     Int
  text         String

  challenge    Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade, map: "fk_hint_challenge")

  @@unique([challengeId, position])
  @@index([challengeId])
  @@map("challenge_hints")
  @@schema("lab")
}

/// Single-user global progress: at most one row per challenge.
model ChallengeProgress {
  id                Int             @id @default(autoincrement())
  challengeId       Int             @unique @map("challenge_id")
  status            ChallengeStatus
  attempts          Int             @default(0)
  lastSql           String?         @map("last_sql")
  lastLanguage      String?         @map("last_language")
  solvedAt          DateTime?       @map("solved_at")
  revealedResult    Boolean         @default(false) @map("revealed_result")
  revealedHints     Int             @default(0) @map("revealed_hints")
  revealedSolution  Boolean         @default(false) @map("revealed_solution")
  updatedAt         DateTime        @updatedAt @map("updated_at")

  challenge         Challenge       @relation(fields: [challengeId], references: [id], onDelete: Cascade, map: "fk_progress_challenge")

  @@map("challenge_progress")
  @@schema("lab")
}
```

Existing models need `@@schema("public")` once multi-schema is enabled — check the Prisma
docs for whether it is required for every model/enum (it is, when `schemas` is set). That is
a large mechanical diff across `schema.prisma`; do it in the same migration commit.

### 3.2 Migration

`pnpm db:migrate` with name `challenges_schema`, then hand-edit the generated SQL to append
the REVOKE block from §2. Verify with:

```sql
-- as sql_lab_readonly
SELECT * FROM lab.challenges;  -- must fail: permission denied for schema lab
```

Also confirm `GET /api/schema` still returns only the marketplace tables.

---

## 4. Challenge catalog + seed

### 4.1 Catalog file

`prisma/seed/data/challenges.ts` — one exported array, plain data, English:

```ts
export interface ChallengeSeed {
  slug: string;
  title: string;
  level: "BEGINNER" | "MID_LEVEL" | "SENIOR" | "EXPERT";
  prompt: string;            // must state the exact expected column names
  expectedColumns: string[]; // asserted by the validation script
  starterSql?: string;
  solutionSql: string;
  orderMatters: boolean;
  hints: string[];           // 1–3, ordered from vague to concrete
}

export const CHALLENGES: ChallengeSeed[] = [ /* ... */ ];
```

### 4.2 Authoring rules (they exist because we compare result sets)

1. **Never `SELECT *` in a solution** — alias every column explicitly; column names are compared.
2. The prompt must state the required column names, in order. The user cannot guess them.
3. Round floating/`numeric` aggregates (`ROUND(x, 2)`) so tiny differences don't fail a
   correct answer.
4. If order is part of the exercise, set `orderMatters: true` **and** add a deterministic
   tiebreaker to the `ORDER BY` (otherwise two correct queries can differ legitimately).
5. Avoid `LIMIT n` where row `n` and `n+1` tie — the result becomes ambiguous.
6. Keep result sets well under the 5000-row hard cap (`HARD_MAX_ROWS`); add `LIMIT` when needed.
7. Prefer fixed date literals over `NOW()`/`CURRENT_DATE` in prompts and solutions: the seed is
   deterministic around a fixed `REFERENCE_DATE`, so relative-date exercises drift over time.
   (Both queries run in the same instant, so `NOW()` would still compare equal — it just makes
   the prompt lie as time passes.)

### 4.3 Proposed content (27 challenges)

Adjust freely, but keep the counts roughly balanced and validate every solution.

**Beginner (8)** — SELECT / WHERE / ORDER BY / LIMIT / NULL / DISTINCT / simple JOIN

| slug | Focus |
|---|---|
| `active-sellers-by-rating` | `WHERE` on boolean + numeric, `ORDER BY` |
| `cheapest-published-products` | filtering + `ORDER BY` + `LIMIT` |
| `customers-per-loyalty-tier` | `COUNT(*)` + `GROUP BY` |
| `orders-by-status` | grouping an enum column |
| `products-without-description` | `IS NULL` / `COALESCE` |
| `distinct-shipping-countries` | `DISTINCT` over `addresses` |
| `order-items-with-product-name` | first `INNER JOIN` (order_items → variants → products) |
| `customers-without-orders` | `LEFT JOIN … IS NULL` |

**Mid-level (8)** — aggregation depth, windows, CTEs, jsonb/arrays, dates

| slug | Focus |
|---|---|
| `revenue-per-seller` | multi-join + `SUM` + `HAVING` |
| `top-products-per-category` | CTE + `ROW_NUMBER() OVER (PARTITION BY …)` |
| `monthly-revenue-trend` | `date_trunc` + grouping + ordering |
| `best-rated-products` | `AVG` + `ROUND` + `HAVING COUNT(*) >= n` |
| `days-between-first-two-orders` | `LAG`/`LEAD` + interval arithmetic |
| `category-tree-paths` | recursive CTE with depth + path |
| `coupon-discount-impact` | joins + `CASE` + conditional aggregation |
| `products-by-jsonb-attribute` | `products.attributes` jsonb operators + array columns |

**Senior (6)** — analytics patterns and traps

| slug | Focus |
|---|---|
| `running-total-revenue` | `SUM() OVER (ORDER BY … ROWS UNBOUNDED PRECEDING)` |
| `signup-month-cohort-retention` | layered CTEs + cohort counts |
| `payments-row-multiplication` | the classic fan-out trap; fix with pre-aggregation |
| `orders-in-usd` | range/non-equi join against `exchange_rates` (`valid_from`/`valid_to`) |
| `product-search-ranking` | `tsvector` / `ts_rank` full-text search |
| `seller-revenue-percentile` | `NTILE` / `PERCENT_RANK` over `daily_sales_snapshots` |

**Expert (5)**

| slug | Focus |
|---|---|
| `consecutive-active-days` | gaps-and-islands on `page_view_events` |
| `funnel-conversion-by-device` | `FILTER (WHERE …)` aggregates + ratios |
| `snapshot-vs-live-reconciliation` | compare `daily_sales_snapshots` with live aggregation |
| `rolling-90-day-top-spenders` | window frame `RANGE BETWEEN INTERVAL …` |
| `latest-shipment-per-order` | `LATERAL` join + correlated ordering |

Optional extras if more are wanted: recursive `employees` hierarchy, `crosstab()` pivot
(the `tablefunc` extension is installed), `EXPLAIN`-driven index reasoning
(note: `EXPLAIN` output cannot be compared as a result set — leave such topics to the
examples catalog, not to auto-corrected challenges).

### 4.4 Seed integration

- New file `prisma/seed/challenges.ts` exporting `seedChallenges()`:
  - upsert each challenge **by slug** (never delete/recreate — that would cascade progress away);
  - replace that challenge's hints (delete + insert by `challengeId`);
  - delete challenges whose slug is no longer in the catalog (cascades their progress);
  - use the seed's owner pool (`prisma/seed/db.ts`) or Prisma — either is fine here, volume is tiny.
- Call it from `prisma/seed/index.ts` as a new phase (after the marketplace phases; the
  content does not depend on generated data but the sanity check should run last).
- `prisma/seed/truncate.ts` and `reset.ts`: make sure the `lab` tables are **not** truncated by
  `db:truncate` (it should keep listing only the marketplace tables). Verify explicitly —
  a `TRUNCATE … CASCADE` over public must not reach `lab`.
- Optional convenience script: `pnpm db:seed:challenges` running only `seedChallenges()`,
  so content edits don't require a full reseed.

---

## 5. Server: comparison, check, API

### 5.1 Types — `src/lib/challenges/types.ts`

```ts
export type ChallengeLevel = "BEGINNER" | "MID_LEVEL" | "SENIOR" | "EXPERT";
export type ChallengeStatus = "NOT_STARTED" | "ATTEMPTED" | "SOLVED";

export interface ChallengeSummary {
  slug: string; title: string; level: ChallengeLevel; orderIndex: number;
  status: ChallengeStatus; attempts: number;
}

export interface ChallengeDetail extends ChallengeSummary {
  prompt: string;
  starterSql: string | null;
  orderMatters: boolean;
  hintCount: number;          // texts are NOT included
  revealedResult: boolean; revealedHints: number; revealedSolution: boolean;
}

export type ChallengeMismatch =
  | { kind: "COLUMNS"; expectedColumns: string[]; actualColumns: string[] }
  | { kind: "ROW_COUNT"; expectedRowCount: number; actualRowCount: number }
  | { kind: "ROWS"; firstDifference: { index: number; expected: string[]; actual: string[] };
      missingCount: number; unexpectedCount: number };

export interface ChallengeCheckResponse {
  correct: boolean;
  status: ChallengeStatus;
  attempts: number;
  mismatch?: ChallengeMismatch;
  /** The user query failed to execute — carries the normal query error shape. */
  queryError?: QueryErrorDetail;
  /** Either side hit the row cap: the comparison is inconclusive. */
  inconclusive?: { reason: "TRUNCATED" };
}
```

`ChallengeMismatch` must **never** leak expected row values beyond what the user could get
by revealing — keep `firstDifference.expected` out of the response unless
`revealedResult === true`; otherwise send only counts and column names. Decide this
explicitly and document it in the file header.

### 5.2 Comparison — `src/lib/challenges/compare.ts` (pure, unit-testable)

```ts
export function compareResults(
  actual: QuerySuccess,
  expected: QuerySuccess,
  options: { orderMatters: boolean },
): { correct: true } | { correct: false; mismatch: ChallengeMismatch };
```

Rules:
1. Column names compared **case-insensitively**, in order, same length.
   (Postgres already folds unquoted identifiers to lowercase, so this is mostly a safety net.)
2. Normalize each cell to a canonical string:
   - `null` → a sentinel that cannot collide with the string `"NULL"`;
   - numeric-ish strings (`numeric`/`int8` come back as strings from `readonly.ts`) →
     canonical decimal form so `10.50` == `10.5`;
   - `Date`/timestamp strings → the ISO string already produced by the type parsers;
   - objects (jsonb) → **stable** JSON stringify with sorted keys;
   - booleans → `"true"`/`"false"`.
3. Row count must match.
4. `orderMatters: true` → compare row sequences pairwise, report the first differing index.
   `false` → compare multisets: sort the serialized rows on both sides, then compare;
   report how many expected rows are missing and how many unexpected rows are present.

Keep this file free of `pg`/Prisma imports so it unit-tests without a database.

### 5.3 Check — `src/lib/challenges/check.ts` (server-only)

```ts
export async function checkChallenge(input: {
  slug: string; sql: string; language: QueryLanguage;
}): Promise<ChallengeCheckResponse>;
```

Flow:
1. Load the challenge with Prisma (`prisma` singleton, owner connection). 404 if unknown.
2. Execute the user's query with the existing `executeQuery({ sql, language, maxRows: HARD_MAX_ROWS })`
   — this reuses the guard, the read-only transaction, PRQL compilation, and the timeouts.
   On `error` → return `{ correct: false, queryError }` and still count the attempt.
3. Get the expected result: `executeQuery({ sql: challenge.solutionSql, maxRows: HARD_MAX_ROWS })`.
   Cache it in a module-level `Map<slug, { updatedAt, result }>`, invalidated when
   `challenge.updatedAt` changes, so a submit costs one query in the common case.
   A solution that fails to execute is a **server-side bug** → log loudly, return
   `inconclusive`, never blame the user.
4. If either side is `truncated` → `inconclusive: { reason: "TRUNCATED" }`.
5. `compareResults(...)`.
6. Upsert `ChallengeProgress`: `attempts + 1`, `lastSql`, `lastLanguage`, and on success
   `status = SOLVED`, `solvedAt = now()` (never downgrade `SOLVED` back to `ATTEMPTED`).
7. Return.

### 5.4 API routes (all `runtime = "nodejs"`, `dynamic = "force-dynamic"`)

| Route | Returns |
|---|---|
| `GET /api/challenges` | `ChallengeSummary[]` ordered by level then `orderIndex`. No prompts, no solutions. |
| `GET /api/challenges/[slug]` | `ChallengeDetail`. No solution, no hint texts, no expected rows. |
| `POST /api/challenges/[slug]/check` | body `{ sql, language }` → `ChallengeCheckResponse` |
| `POST /api/challenges/[slug]/reveal` | body `{ target: "result" \| "hint" \| "solution", hintIndex? }` → the expected result (columns + first N rows, N ≈ 50, plus `totalRowCount`), one hint text, or `solutionSql`. Records the reveal on progress. |
| `POST /api/challenges/[slug]/reset` | clears that challenge's progress (optional but cheap) |

Client helpers mirroring `src/lib/sql/client.ts`: `src/lib/challenges/client.ts` with
`fetchChallenges`, `fetchChallenge`, `checkChallenge`, `revealChallenge`, `resetChallenge`.

Note Next 16 route-handler params are async (`{ params }: { params: Promise<{ slug: string }> }`)
— check `node_modules/next/dist/docs/` before writing them.

---

## 6. Client feature — `src/features/challenges/`

Mirrors the Schema Explorer layout and the compound-component style used everywhere.

```
src/features/challenges/
├── index.ts                       # export { Challenges }, useChallengesStore
├── context/challenges-context.tsx
├── stores/challenges-store.ts     # singleton instance, like schemaStore
├── types/challenges-types.ts      # re-export of #/lib/challenges/types + view types
└── components/
    ├── index.ts                   # the `Challenges` namespace object
    ├── provider.tsx  container.tsx  handles.tsx
    ├── loading.tsx   error.tsx      empty.tsx
    ├── content.tsx                 # slot switch: list | detail (see below)
    ├── header/       {container,search,level-filter,progress-summary}.tsx
    ├── list/         {container,level-group,item}.tsx
    ├── detail/
    │   ├── {container,back-button,title,level-badge,status-badge,prompt}.tsx
    │   ├── console-picker.tsx      load-starter-button.tsx  check-button.tsx
    │   ├── feedback.tsx            # correct / mismatch / query error / inconclusive
    │   ├── expected-result.tsx     hints.tsx  solution.tsx   # the three reveals
    │   └── expected-result-table.tsx
    └── handles/
        ├── data/{challenges-data-actions.ts,challenges-data-handle.tsx}
        └── attempt/{challenge-attempt-actions.ts,challenge-attempt-handle.tsx}
```

`content.tsx` follows the `Results.Container` slot pattern already in the codebase:

```tsx
<Challenges.Content list={<ChallengeList />} detail={<ChallengeDetail />} loading={...} />
```

It renders `detail` when `store.selectedSlug !== null`, otherwise `list`.

### 6.1 Store (`ChallengesStore`, exported as a singleton `challengesStore`)

Observable: `challenges`, `search`, `levelFilter`, `selectedSlug`, `detail`,
`boundConsoleId`, `checkResult`, `revealedResult`, `revealedHints: string[]`,
`revealedSolution`.
Computed: `groupedByLevel`, `filteredChallenges`, `solvedCount` / `totalCount` per level,
`isDetailOpen`, `canCheck` (`boundConsoleId !== null`).
Only state + simple setters — no fetching, no decisions (per the
`command-handle-implementation` skill: stores hold state, handles orchestrate).

Singleton (like `schemaStore`) means two Challenges tabs would share selection state.
Acceptable and consistent with Schema Explorer; note it and move on.

### 6.2 Commands

`challenges-data-actions.ts`:

```ts
declare module "#/lib/command/global" {
  interface Actions {
    challenges: {
      data: { fetch: Action; refresh: Action };
      select: Action<string>;   // slug -> open detail
      back: Action;
      filter: { setSearch: Action<string>; setLevel: Action<ChallengeLevel | "all"> };
    };
  }
}
```

`challenge-attempt-actions.ts`:

```ts
declare module "#/lib/command/global" {
  interface Actions {
    challenges: {
      console: { bind: Action<string | null>; loadStarter: Action };
      check: Action;
      reveal: { result: Action; hint: Action; solution: Action };
      progress: { reset: Action<string> };
    };
  }
}
```

Both are global (`Action`, not `ScopedAction`) because the store is a singleton — same shape
as the existing `schema.*` domain. Module augmentation merges the two declarations under one
`challenges` key; keep the split by handle file as the skill prescribes.

Handles must follow the skill exactly: named handlers defined in the component body outside
`useEffect`, `command.handle` called inside `useEffect` receiving handlers **by reference**,
every disposer collected and cleaned up, `biome-ignore lint/correctness/useExhaustiveDependencies`
with a real reason.

Dispatch with transition keys so spinners work through `useTransition`:
`["challenges"]` for the initial fetch (as `schema` does), `["challenges.check"]` for the check.

### 6.3 Reading the query console's source (cross-feature)

The challenge handle must obtain the bound console's current text. Do **not** reach into the
console store. Add a scoped action to the query-console domain that returns it — the actions
proxy already returns the handler's resolved value:

```ts
// query-console-actions.ts
export interface QueryConsoleSource { language: QueryLanguage; source: string }

queryConsole: {
  // …existing…
  getSource: ScopedAction<undefined, QueryConsoleSource>;
}
```

```ts
// query-console-handle.tsx
async function handleGetSource(): Promise<QueryConsoleSource> {
  const language = store.activePane;
  return { language, source: language === "prql" ? store.prql : store.sql };
}
```

The challenge check handler then:

```ts
const consoleId = store.boundConsoleId;
if (!consoleId) return toast.error("Bind a query console first");
const src = await actions.queryConsole.getSource(undefined, { instanceId: consoleId });
```

`loadStarter` uses the existing `actions.queryConsole.editor.sql({ template, activatePanel: true }, { instanceId })`.

Decision: **check does not auto-run the console**. The user can still press Run to see their
own rows. (Optional enhancement, easy later: dispatch `queryConsole.run` alongside the check.)

### 6.4 Console picker plumbing

`InstanceRegistry` already tracks live instances per domain and is a `Subject`, but nothing
consumes it yet. Two small additions:

1. `src/hooks/use-instances.ts` — `useSyncExternalStore` over
   `InstanceRegistry.getInstance().subscribe` / `.getInstances(domain)`.
   The registry caches the array per domain, so the snapshot is referentially stable — required
   by `useSyncExternalStore`. Add a server snapshot returning a module-level frozen empty array.
2. `query-console-handle.tsx` currently registers with `{ instanceId }` and no `meta`.
   Pass `meta: { label: … }` so the picker shows a human name. The tab name lives in flexlayout,
   not in the store; simplest is a label derived from the instance id (`Console 2`). If a nicer
   label is wanted, the workspace can pass the tab name down through `QueryConsoleTab`.

Edge cases the picker must handle: no console open (disable check, show a hint), the bound
console being closed (registry drops it → clear `boundConsoleId` and warn), and auto-binding to
the only console when exactly one exists.

### 6.5 Expected-result rendering

The lateral tab is narrow (weight 25) and `results/grid.tsx` is a full-height `react-data-grid`
wired to the console store. Do **not** try to reuse it. Write a small
`expected-result-table.tsx`: a plain `<table>` in an `overflow-auto` container, monospace cells,
reusing the console's `formatCell` conventions, capped at the ~50 rows the reveal endpoint
returns, with a "showing 50 of N rows" footer.

### 6.6 Reveal UX

Three collapsible sections in the detail view:
- **Expected result** — button "Show expected result"; after clicking, renders the table.
- **Hints** — "Show hint 1", then "Show hint 2"… one at a time, `hintCount` known upfront.
- **Solution** — "Show solution" behind a confirm step (a second click / inline confirmation),
  then the SQL in a read-only code block plus a "Copy to console" button that dispatches
  `queryConsole.editor.sql` on the bound console.

Each reveal is persisted on progress (`revealedResult`, `revealedHints`, `revealedSolution`) so
reopening the challenge restores what was already uncovered, and the list can mark
"solved without hints" vs "solved with help".

---

## 7. Workspace wiring

- `src/features/workspace/components/handles/workspace/workspace-actions.ts`:
  add `addChallenges: Action`.
- `workspace-handle.tsx`: `handleAddChallenges` → `addTab(..., { type: "tab", name: "Challenges", component: "challenges" })`.
  No `instanceId` config needed (singleton store, like `schemaExplorer`).
- `src/features/workspace/components/side-menu/add-challenges-button.tsx` — `Trophy` icon
  from lucide, wired to `actions.workspace.addChallenges()`; export it from `side-menu/index.ts`.
- `src/features/workspace/components/layout/challenges-tab.tsx` — mirrors `schema-explorer-tab.tsx`:
  `<Challenges.Provider><Challenges.Handles><Challenges.Container>{children}</…>`.
- `src/features/workspace/model.ts` — add a `Challenges` tab to the **left tabset**, next to
  `Schema`, so the feature is discoverable on first load (Schema stays `active: true`).
- `src/app/page.tsx` — add a `challenges` branch to `factory`, plus a `ChallengesContent`
  component composing the namespace (same style as `SchemaExplorerContent`), and render the
  new side-menu button.

---

## 8. Tests & validation

- `src/lib/challenges/compare.test.ts` (vitest, no DB): column mismatch, row-count mismatch,
  order-sensitive vs multiset comparison, `numeric` string normalization (`10.50` vs `10.5`),
  `null` vs the literal string `"NULL"`, jsonb key-order independence, duplicate rows in a multiset.
- `tests/challenges.integration.test.ts`: seeded DB required — skip when unreachable, following
  `tests/setup.ts`. Check a known-correct query, a wrong one, a syntactically broken one, and a
  PRQL answer.
- `scripts/validate-challenges.ts` + `pnpm validate:challenges` (model it on
  `scripts/validate-examples.ts`, which reads the catalog and runs each query with the read-only
  connection). Assert per challenge: solution executes; returns ≥ 1 row; is under the row cap;
  its column names equal `expectedColumns`; slugs are unique; `(level, orderIndex)` is unique;
  at least one hint. Non-zero exit on any failure.
- Consider running `validate:challenges` inside `pnpm validate:examples` or a combined
  `pnpm validate` — nice for CI, decide when implementing.
- Gate: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:challenges` all green.

---

## 9. Docs to update

- `AGENTS.md` — the "Read-only DB access" bullet must be amended: the query console still uses
  `pg` + `sql_lab_readonly`, **and** app-owned data (challenges, hints, progress) is read/written
  with Prisma at runtime, in the `lab` schema, which is not visible to the read-only role.
  Note: that block is regenerated by `next dev`; edit the project-commands section carefully
  and commit the result so the tree stays clean.
- `docs/data-model.md` — a short "Challenges (schema `lab`)" section, explicitly marked as
  *not* part of the marketplace practice data.
- `docs/learning-guide.md` — a "Challenges" section explaining the flow (open the tab, bind a
  console, write the query, Check answer) and how levels map to the guide's chapters.
- `README.md` — one line in the feature list.

---

## 10. Implementation order

1. **Schema + migration + grants** — models, multi-schema, REVOKE block, verify the console
   cannot see `lab` and the Schema Explorer is unchanged.
2. **Catalog + seed + validation script** — write all 27 challenges, seed them, get
   `pnpm validate:challenges` green. This is the bulk of the content work; do it before the UI
   so the UI has real data.
3. **Server** — `compare.ts` (+ its unit tests), `check.ts`, the four API routes, `client.ts`.
4. **Feature module** — store, context, provider, handles, list view, then detail view,
   then the three reveals.
5. **Workspace wiring** — action, side-menu button, tab component, `INITIAL_MODEL`, `page.tsx`.
6. **Cross-feature bits** — `queryConsole.getSource`, `use-instances.ts`, instance `meta.label`.
   (Can be pulled earlier if step 4 needs it — it will.)
7. **Docs + full gate run.**

Steps 1–2 and 3 are independently reviewable; 4–6 are one coherent UI change.

## 11. Open risks

- **Prisma multi-schema** may require a preview flag and forces `@@schema` on every existing
  model — a big mechanical diff. If it turns out to be painful in Prisma 7, the fallback is
  keeping the tables in `public` with an explicit `REVOKE` **and** an exclusion in the
  `GET /api/schema` query (`c.relname NOT LIKE 'challenge%'`), since `pg_class` is world-readable.
  Prefer the `lab` schema; use the fallback only if blocked, and say so.
- **Comparison false negatives** are the main UX risk (a correct answer marked wrong because of
  a rounding or ordering detail). Mitigation: strict authoring rules (§4.2), normalization in
  `compare.ts`, and a mismatch message that says *what* differs (columns vs count vs values).
- **Seed drift**: expected results come from running the solution live, so re-seeding never
  produces stale expectations — but a changed seed can make a challenge trivial or empty.
  `validate:challenges` asserting ≥ 1 row catches the worst case.
- **Reveal endpoints are unauthenticated** — solutions are one HTTP call away. Fine for a local
  lab; do not present it as a security boundary.

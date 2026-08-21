-- Challenges feature: dedicated `lab` schema invisible to the read-only role.
--
-- The marketplace data stays in `public`; challenge tables (challenges, hints,
-- progress) live in `lab` so the query console (sql_lab_readonly) cannot read
-- or even name them. See docs/plan.md §2 for the spoiler-containment rationale.
--
-- The REVOKE block lives here (not in docker/postgres/init/02-roles.sh) because
-- the init script only runs on a fresh volume; migrations run on every deploy.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "lab";

-- CreateEnum
CREATE TYPE "lab"."ChallengeLevel" AS ENUM ('BEGINNER', 'MID_LEVEL', 'SENIOR', 'EXPERT');

-- CreateEnum
CREATE TYPE "lab"."ChallengeStatus" AS ENUM ('ATTEMPTED', 'SOLVED');

-- CreateTable
CREATE TABLE "lab"."challenges" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "lab"."ChallengeLevel" NOT NULL,
    "order_index" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "starter_sql" TEXT,
    "solution_sql" TEXT NOT NULL,
    "order_matters" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab"."challenge_hints" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "challenge_hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab"."challenge_progress" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "status" "lab"."ChallengeStatus" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sql" TEXT,
    "last_language" TEXT,
    "solved_at" TIMESTAMP(3),
    "revealed_result" BOOLEAN NOT NULL DEFAULT false,
    "revealed_hints" INTEGER NOT NULL DEFAULT 0,
    "revealed_solution" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenges_slug_key" ON "lab"."challenges"("slug");

-- CreateIndex
CREATE INDEX "challenges_level_idx" ON "lab"."challenges"("level");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_level_order_index_key" ON "lab"."challenges"("level", "order_index");

-- CreateIndex
CREATE INDEX "challenge_hints_challenge_id_idx" ON "lab"."challenge_hints"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_hints_challenge_id_position_key" ON "lab"."challenge_hints"("challenge_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_progress_challenge_id_key" ON "lab"."challenge_progress"("challenge_id");

-- AddForeignKey
ALTER TABLE "lab"."challenge_hints" ADD CONSTRAINT "fk_hint_challenge" FOREIGN KEY ("challenge_id") REFERENCES "lab"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab"."challenge_progress" ADD CONSTRAINT "fk_progress_challenge" FOREIGN KEY ("challenge_id") REFERENCES "lab"."challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Spoiler containment: lock down the lab schema ───────────────────────────
-- The read-only role (sql_lab_readonly) must not be able to read or even name
-- lab tables. Without USAGE on the schema, `SELECT * FROM lab.challenges` fails
-- with "permission denied for schema lab".
--
-- `ALTER DEFAULT PRIVILEGES` in 02-roles.sh only applies to the `public` schema,
-- so future lab tables are not auto-granted. We revoke explicitly here for safety,
-- including default privileges, in case the role somehow gains access later.
REVOKE ALL ON SCHEMA "lab" FROM "sql_lab_readonly";
REVOKE ALL ON ALL TABLES IN SCHEMA "lab" FROM "sql_lab_readonly";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "lab" FROM "sql_lab_readonly";
ALTER DEFAULT PRIVILEGES FOR ROLE "learning" IN SCHEMA "lab"
  REVOKE SELECT ON TABLES FROM "sql_lab_readonly";
ALTER DEFAULT PRIVILEGES FOR ROLE "learning" IN SCHEMA "lab"
  REVOKE SELECT ON SEQUENCES FROM "sql_lab_readonly";

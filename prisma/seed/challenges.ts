/**
 * Seed challenges from the catalog into the `lab` schema.
 *
 * Uses Prisma (owner connection) to read/write challenge data at runtime.
 * Upserts by slug — never deletes/recreates a challenge that still exists in
 * the catalog, so progress rows survive re-seeding.
 *
 * Run via: pnpm db:seed (full) or pnpm db:seed:challenges (challenges only).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "#/generated/prisma/client";
import { CHALLENGES } from "./data/challenges";
import { closePool } from "./db";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Project the catalog into the lab tables.
 *
 * - Upsert each challenge by slug (never delete/recreate — progress cascades).
 * - Replace that challenge's hints (delete + insert by challengeId).
 * - Delete challenges whose slug disappeared from the catalog (progress cascades).
 */
export async function seedChallenges(): Promise<void> {
  console.log("Phase: Challenges");
  const catalogSlugs = new Set(CHALLENGES.map((c) => c.slug));

  // Delete challenges no longer in the catalog (progress cascades — intended).
  const deleted = await prisma.challenge.deleteMany({
    where: { slug: { notIn: [...catalogSlugs] } },
  });
  if (deleted.count > 0) {
    console.log(`  Removed ${deleted.count} obsolete challenge(s).`);
  }

  let upserted = 0;
  for (const seed of CHALLENGES) {
    const orderIndex = CHALLENGES.filter((c) => c.level === seed.level).indexOf(
      seed,
    );

    const challenge = await prisma.challenge.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        title: seed.title,
        level: seed.level,
        orderIndex,
        prompt: seed.prompt,
        starterSql: seed.starterSql ?? null,
        solutionSql: seed.solutionSql,
        orderMatters: seed.orderMatters,
        hints: {
          create: seed.hints.map((text, i) => ({ position: i, text })),
        },
      },
      update: {
        title: seed.title,
        level: seed.level,
        orderIndex,
        prompt: seed.prompt,
        starterSql: seed.starterSql ?? null,
        solutionSql: seed.solutionSql,
        orderMatters: seed.orderMatters,
      },
      select: { id: true },
    });

    // Replace hints (delete + insert) only when the challenge already existed.
    await prisma.challengeHint.deleteMany({
      where: { challengeId: challenge.id },
    });
    await prisma.challengeHint.createMany({
      data: seed.hints.map((text, i) => ({
        challengeId: challenge.id,
        position: i,
        text,
      })),
    });

    upserted++;
  }

  console.log(`  Upserted ${upserted} challenge(s) across 4 levels.`);
  await prisma.$disconnect();
}

// When run directly (pnpm db:seed:challenges), execute and close the seed pool.
const isDirectRun =
  process.argv[1]?.endsWith("challenges.ts") ||
  process.argv[1]?.endsWith("seed/challenges");

if (isDirectRun) {
  seedChallenges()
    .then(async () => {
      await closePool();
      console.log("Challenge seed complete.");
    })
    .catch(async (error) => {
      console.error("Challenge seed failed:", error);
      await prisma.$disconnect();
      await closePool();
      process.exit(1);
    });
}

/**
 * Integration tests for the challenge check flow.
 *
 * Automatically skipped when the database is unreachable.
 * Requires the challenges to be seeded (pnpm db:seed:challenges).
 */
import { describe, expect, it } from "vitest";
import { checkChallenge } from "#/lib/challenges/check";
import { prisma } from "#/lib/db/prisma";

const canConnect = !!process.env.DATABASE_URL;

describe.skipIf(!canConnect)("checkChallenge integration", () => {
  let challengeId: number | null = null;

  it("finds a seeded beginner challenge", async () => {
    const challenge = await prisma.challenge.findFirst({
      where: { slug: "active-sellers-by-rating" },
      select: { id: true },
    });
    expect(challenge).not.toBeNull();
    challengeId = challenge?.id ?? null;
  });

  it("returns correct when the user query matches the reference solution", async () => {
    if (!challengeId) return;
    const outcome = await checkChallenge({
      challengeId,
      sql: "SELECT name AS seller_name, country, rating FROM sellers WHERE is_active = true ORDER BY rating DESC, seller_name ASC;",
    });
    expect(outcome.result.correct).toBe(true);
    expect(outcome.result.error).toBeNull();
    expect(outcome.progress.status).toBe("SOLVED");
    expect(outcome.progress.attempts).toBeGreaterThanOrEqual(1);
  });

  it("returns incorrect when the user query has wrong columns", async () => {
    if (!challengeId) return;
    const outcome = await checkChallenge({
      challengeId,
      sql: "SELECT name, country FROM sellers WHERE is_active = true;",
    });
    expect(outcome.result.correct).toBe(false);
    expect(outcome.result.userColumns).not.toEqual(
      outcome.result.expectedColumns,
    );
  });

  it("returns incorrect when the user query has wrong rows", async () => {
    if (!challengeId) return;
    const outcome = await checkChallenge({
      challengeId,
      sql: "SELECT name AS seller_name, country, rating FROM sellers WHERE is_active = false ORDER BY rating DESC, seller_name ASC;",
    });
    expect(outcome.result.correct).toBe(false);
    // Same columns, different rows (filter is wrong)
    expect(outcome.result.userColumns).toEqual(outcome.result.expectedColumns);
  });

  it("captures SQL errors without throwing", async () => {
    if (!challengeId) return;
    const outcome = await checkChallenge({
      challengeId,
      sql: "SELECT * FROM nonexistent_table;",
    });
    expect(outcome.result.correct).toBe(false);
    expect(outcome.result.error).not.toBeNull();
    expect(outcome.result.error).toContain("nonexistent_table");
  });

  it("rejects multi-statement queries", async () => {
    if (!challengeId) return;
    const outcome = await checkChallenge({
      challengeId,
      sql: "SELECT 1; SELECT 2;",
    });
    expect(outcome.result.correct).toBe(false);
    expect(outcome.result.error).not.toBeNull();
  });

  it("increments attempts on each check", async () => {
    if (!challengeId) return;
    const before = await prisma.challengeProgress.findUnique({
      where: { challengeId },
    });
    const beforeAttempts = before?.attempts ?? 0;

    await checkChallenge({
      challengeId,
      sql: "SELECT name AS seller_name, country, rating FROM sellers WHERE is_active = true ORDER BY rating DESC, seller_name ASC;",
    });

    const after = await prisma.challengeProgress.findUnique({
      where: { challengeId },
    });
    expect(after?.attempts).toBe(beforeAttempts + 1);
  });

  it("throws on non-existent challenge id", async () => {
    await expect(
      checkChallenge({ challengeId: 999999, sql: "SELECT 1;" }),
    ).rejects.toThrow("not found");
  });
});

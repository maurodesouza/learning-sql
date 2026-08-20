/**
 * Shared faker instance — deterministic, English locale.
 *
 * Every generator imports this single instance. The seed is set once in the
 * orchestrator (prisma/seed/index.ts) before any generator runs.
 */
import { faker } from "@faker-js/faker/locale/en";

/** Fixed reference date — all generated dates are relative to this, never Date.now(). */
export const REFERENCE_DATE = new Date("2025-01-15T00:00:00Z");

/** The fixed faker seed — changing it changes the entire dataset. */
export const FAKER_SEED = 42;

export { faker };

/** Scale factor: 1 = full, 0.1 = small (10x fewer rows). */
export function scaleFactor(): number {
  return process.env.SEED_SCALE === "small" ? 0.1 : 1;
}

/** Scale a target row count, at least 1. */
export function scaledCount(target: number): number {
  return Math.max(1, Math.round(target * scaleFactor()));
}

/** Pick a random element from an array (deterministic via faker). */
export function pick<T>(arr: readonly T[]): T {
  return faker.helpers.arrayElement(arr);
}

/** Pick n distinct elements (deterministic via faker). */
export function pickMany<T>(arr: readonly T[], n: number): T[] {
  return faker.helpers.arrayElements(arr, Math.min(n, arr.length));
}

/** Weighted pick — weights must sum to 1. Returns the index chosen. */
export function weightedPick(weights: number[]): number {
  const r = faker.number.float({ min: 0, max: 1, fractionDigits: 6 });
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return i;
  }
  return weights.length - 1;
}

/** A date between two dates (deterministic). */
export function dateBetween(from: Date, to: Date): Date {
  return faker.date.between({ from, to });
}

/** Round a number to 2 decimal places as a string (for Decimal columns). */
export function money(n: number): string {
  return n.toFixed(2);
}

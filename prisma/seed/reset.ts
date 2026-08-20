/** Reset: drop all data, re-run migrations, seed, refresh. */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { closePool } from "./db";

const execAsync = promisify(exec);

async function main(): Promise<void> {
  console.log("Resetting database (drop + migrate + seed + refresh)...");

  // 1. Reset migrations (drops all data, re-applies all migrations)
  console.log("  Running prisma migrate reset...");
  try {
    await execAsync("npx prisma migrate reset --force --skip-seed", {
      cwd: process.cwd(),
      env: process.env,
    });
  } catch (error) {
    console.error("  prisma migrate reset failed:", error);
    process.exit(1);
  }

  // 2. Seed
  console.log("  Seeding...");
  try {
    await execAsync("pnpm db:seed", {
      cwd: process.cwd(),
      env: process.env,
    });
  } catch (error) {
    console.error("  Seed failed:", error);
    process.exit(1);
  }

  console.log("Reset complete.");
  await closePool();
}

main().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});

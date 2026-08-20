/**
 * Seed entrypoint.
 *
 * Wired through prisma.config.ts `migrations.seed`. The real per-domain
 * generators land in #4; this stub keeps the config valid and `pnpm db:seed`
 * runnable so #2 can be verified end-to-end.
 */
async function main(): Promise<void> {
  console.log("Seed placeholder — real generators ship in #4.");
}

main()
  .then(() => {
    console.log("Seed complete.");
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

/** Refresh materialized views + ANALYZE (also called at end of seed). */
import { closePool, exec } from "./db";

async function main(): Promise<void> {
  console.log("Refreshing materialized views and running ANALYZE...");
  await exec(`REFRESH MATERIALIZED VIEW mv_monthly_seller_revenue`);
  await exec(`ANALYZE`);
  console.log("Refresh complete.");
  await closePool();
}

main().catch((error) => {
  console.error("Refresh failed:", error);
  process.exit(1);
});

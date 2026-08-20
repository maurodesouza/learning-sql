/** Truncate all app tables (keeps schema and _prisma_migrations). */
import { closePool, exec } from "./db";

// All app tables in reverse FK dependency order.
const TABLES = [
  "page_view_events",
  "cart_items",
  "carts",
  "returns",
  "order_coupons",
  "shipments",
  "payments",
  "order_items",
  "orders",
  "reviews",
  "daily_sales_snapshots",
  "exchange_rates",
  "inventory",
  "product_suppliers",
  "product_variants",
  "products",
  "coupons",
  "addresses",
  "employees",
  "customers",
  "categories",
  "warehouses",
  "suppliers",
  "sellers",
];

async function main(): Promise<void> {
  console.log("Truncating all app tables...");
  // TRUNCATE with RESTART IDENTITY CASCADE — one statement handles all FKs
  const tableList = TABLES.map((t) => `"${t}"`).join(", ");
  await exec(`TRUNCATE ${tableList} RESTART IDENTITY CASCADE`);
  console.log("Truncate complete.");
  await closePool();
}

main().catch((error) => {
  console.error("Truncate failed:", error);
  process.exit(1);
});

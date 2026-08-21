/**
 * Seed orchestrator — deterministic marketplace data generation.
 *
 * Run via: pnpm db:seed (tsx prisma/seed/index.ts)
 * Determinism: faker.seed(42) + fixed REFERENCE_DATE, no Date.now()/Math.random().
 *
 * Insert order respects FKs. Bulk inserts via pg for performance.
 */

import { seedCarts } from "./carts";
import { fetchIds, seedCatalog, seedCategories } from "./catalog";
import { seedChallenges } from "./challenges";
import { seedAddresses, seedCustomers, seedEmployees } from "./customers";
import { closePool, query } from "./db";
import { seedEvents } from "./events";
import { seedExchangeRates, seedReviews } from "./exchange-rates";
import { FAKER_SEED, faker, REFERENCE_DATE } from "./faker";
import { seedCoupons, seedOrders } from "./orders";
import { seedSellers, seedSuppliers, seedWarehouses } from "./sellers";
import { seedSnapshots } from "./snapshots";

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log(`=== SQL Learning Lab seed ===`);
  console.log(
    `Faker seed: ${FAKER_SEED}, reference date: ${REFERENCE_DATE.toISOString()}`,
  );
  console.log(`Scale: ${process.env.SEED_SCALE ?? "full"}`);
  console.log();

  // Set the fixed seed — everything derives from this.
  faker.seed(FAKER_SEED);

  // ─── Independent entities ──────────────────────────────────────────────
  console.log("Phase 1: Independent entities");
  await seedSellers();
  await seedSuppliers();
  await seedWarehouses();
  await seedExchangeRates();
  await seedCoupons();
  console.log();

  // ─── Catalog ───────────────────────────────────────────────────────────
  console.log("Phase 2: Catalog");
  const sellerIds = await fetchIds("sellers");
  const supplierIds = await fetchIds("suppliers");
  const warehouseIds = await fetchIds("warehouses");
  const couponIds = await fetchIds("coupons");
  await seedCategories();
  const categoryIds = await fetchIds("categories");
  const { productIds, variantIds } = await seedCatalog(
    sellerIds,
    categoryIds,
    supplierIds,
    warehouseIds,
  );
  console.log();

  // ─── People ────────────────────────────────────────────────────────────
  console.log("Phase 3: People");
  const { ids: customerIds } = await seedCustomers();
  await seedAddresses(customerIds);
  await seedEmployees(warehouseIds);
  console.log();

  // ─── Orders ────────────────────────────────────────────────────────────
  console.log("Phase 4: Orders & payments");
  const addressIds = await fetchIds("addresses");
  await seedOrders(
    customerIds,
    variantIds,
    sellerIds,
    warehouseIds,
    addressIds,
    couponIds,
  );
  console.log();

  // ─── Carts, reviews, events ────────────────────────────────────────────
  console.log("Phase 5: Carts, reviews, events");
  const orderIds = await fetchIds("orders");
  await seedCarts(customerIds, variantIds, orderIds);
  await seedReviews(productIds, customerIds);
  await seedEvents(customerIds, productIds);
  console.log();

  // ─── Derived snapshots ─────────────────────────────────────────────────
  console.log("Phase 6: Derived data");
  await seedSnapshots();
  console.log();

  // ─── Refresh materialized views + ANALYZE ──────────────────────────────
  console.log("Phase 7: Refresh & analyze");
  const { exec } = await import("./db");
  await exec(`REFRESH MATERIALIZED VIEW mv_monthly_seller_revenue`);
  await exec(`ANALYZE`);
  console.log();

  // ─── Sanity assertions ─────────────────────────────────────────────────
  console.log("Phase 8: Sanity checks");
  await sanityCheck();

  // ─── Challenges (lab schema, upserted by slug) ─────────────────────────
  console.log();
  await seedChallenges();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();
  console.log(`=== Seed complete in ${elapsed}s ===`);
  await closePool();
}

/** Verify row counts and data integrity. */
async function sanityCheck(): Promise<void> {
  const tables = [
    "sellers",
    "suppliers",
    "warehouses",
    "categories",
    "products",
    "product_variants",
    "product_suppliers",
    "inventory",
    "customers",
    "addresses",
    "employees",
    "coupons",
    "orders",
    "order_items",
    "payments",
    "shipments",
    "returns",
    "order_coupons",
    "reviews",
    "carts",
    "cart_items",
    "page_view_events",
    "exchange_rates",
    "daily_sales_snapshots",
  ];

  let allOk = true;
  for (const table of tables) {
    const rows = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM "${table}"`,
    );
    const count = Number(rows[0]?.count ?? 0);
    if (count === 0) {
      console.error(`  FAIL: ${table} has 0 rows!`);
      allOk = false;
    } else {
      console.log(`  OK: ${table} = ${count} rows`);
    }
  }

  // Check no orphan FKs (spot check)
  const orphanOrders = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE c.id IS NULL`,
  );
  if (Number(orphanOrders[0]?.count) > 0) {
    console.error(`  FAIL: ${orphanOrders[0]?.count} orphan orders!`);
    allOk = false;
  }

  // Check snapshot totals match live aggregation
  const snapshotTotal = await query<{ total: string }>(
    `SELECT COALESCE(SUM(gross_revenue), 0)::text AS total FROM daily_sales_snapshots`,
  );
  const liveTotal = await query<{ total: string }>(
    `SELECT COALESCE(SUM(oi.line_total), 0)::text AS total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status <> 'CANCELLED'`,
  );
  if (snapshotTotal[0]?.total !== liveTotal[0]?.total) {
    console.error(
      `  FAIL: snapshot total (${snapshotTotal[0]?.total}) != live total (${liveTotal[0]?.total})`,
    );
    allOk = false;
  } else {
    console.log(`  OK: snapshot totals match live aggregation`);
  }

  if (!allOk) {
    console.error("Sanity checks FAILED — seed data is inconsistent!");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

/** Daily sales snapshots — derived from orders/order_items via SQL aggregation. */
import { exec, query } from "./db";

/**
 * Populate daily_sales_snapshots by aggregating from orders + order_items.
 * This is NOT random — it's derived so comparing it against a live aggregation
 * matches exactly.
 */
export async function seedSnapshots(): Promise<void> {
  // Clear existing snapshots
  await exec(`DELETE FROM daily_sales_snapshots`);

  // Aggregate from orders + order_items, excluding cancelled orders
  await exec(`
    INSERT INTO daily_sales_snapshots (snapshot_date, seller_id, orders_count, gross_revenue, items_sold, created_at)
    SELECT
      o.placed_at::date AS snapshot_date,
      oi.seller_id,
      COUNT(DISTINCT o.id) AS orders_count,
      COALESCE(SUM(oi.line_total), 0) AS gross_revenue,
      COALESCE(SUM(oi.quantity), 0) AS items_sold,
      NOW()
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status <> 'CANCELLED'
    GROUP BY o.placed_at::date, oi.seller_id
  `);

  const result = await query<{ count: string }>(
    `SELECT count(*)::text AS count FROM daily_sales_snapshots`,
  );
  console.log(
    `  daily_sales_snapshots: ${result[0]?.count ?? 0} rows (derived from orders)`,
  );
}

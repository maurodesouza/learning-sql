/**
 * Example SQL queries for the learning lab.
 *
 * Each example has a title, a difficulty level, the SQL, and an optional
 * description explaining what concept it demonstrates.
 *
 * These are also validated by `pnpm validate:examples` to ensure they all
 * execute successfully against the seeded database.
 */

export type ExampleDifficulty = "beginner" | "intermediate" | "advanced";

export interface ExampleQuery {
  id: string;
  title: string;
  difficulty: ExampleDifficulty;
  description: string;
  sql: string;
}

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    id: "select-all-sellers",
    title: "SELECT all sellers",
    difficulty: "beginner",
    description:
      "The simplest query — retrieve every row from the sellers table.",
    sql: "SELECT id, name, country, rating, is_active FROM sellers ORDER BY rating DESC;",
  },
  {
    id: "filter-active-sellers",
    title: "WHERE: filter active sellers",
    difficulty: "beginner",
    description: "Use WHERE to filter rows matching a condition.",
    sql: "SELECT name, country, rating FROM sellers WHERE is_active = true AND rating >= 4.0 ORDER BY rating DESC;",
  },
  {
    id: "limit-and-offset",
    title: "LIMIT & OFFSET: pagination",
    difficulty: "beginner",
    description: "Page through results with LIMIT and OFFSET.",
    sql: "SELECT id, name, base_price FROM products ORDER BY base_price DESC LIMIT 10 OFFSET 0;",
  },
  {
    id: "inner-join-orders",
    title: "INNER JOIN: orders with customers",
    difficulty: "beginner",
    description: "Combine rows from orders and customers using a join.",
    sql: `SELECT c.first_name, c.last_name, o.id AS order_id, o.status, o.placed_at
FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
ORDER BY o.placed_at DESC
LIMIT 20;`,
  },
  {
    id: "count-by-status",
    title: "GROUP BY: count orders by status",
    difficulty: "beginner",
    description: "Aggregate rows with COUNT and GROUP BY.",
    sql: `SELECT status, COUNT(*) AS order_count
FROM orders
GROUP BY status
ORDER BY order_count DESC;`,
  },
  {
    id: "having-revenue",
    title: "HAVING: top sellers by revenue",
    difficulty: "intermediate",
    description: "Filter groups with HAVING after aggregation.",
    sql: `SELECT s.name, SUM(oi.line_total) AS total_revenue
FROM sellers s
JOIN order_items oi ON oi.seller_id = s.id
JOIN orders o ON o.id = oi.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY s.name
HAVING SUM(oi.line_total) > 10000
ORDER BY total_revenue DESC
LIMIT 10;`,
  },
  {
    id: "left-join-customers",
    title: "LEFT JOIN: customers without orders",
    difficulty: "intermediate",
    description: "Find customers who have never placed an order.",
    sql: `SELECT c.id, c.first_name, c.last_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.id
LIMIT 20;`,
  },
  {
    id: "self-join-referrals",
    title: "Self-join: customer referral chains",
    difficulty: "intermediate",
    description: "Join a table to itself to find referrer-referee pairs.",
    sql: `SELECT c.first_name || ' ' || c.last_name AS customer,
       r.first_name || ' ' || r.last_name AS referred_by
FROM customers c
INNER JOIN customers r ON c.referred_by_id = r.id
ORDER BY c.id
LIMIT 20;`,
  },
  {
    id: "window-row-number",
    title: "Window functions: ROW_NUMBER",
    difficulty: "intermediate",
    description: "Rank rows within partitions using ROW_NUMBER.",
    sql: `SELECT seller_id, id AS product_id, name,
       ROW_NUMBER() OVER (PARTITION BY seller_id ORDER BY base_price DESC) AS rank
FROM products
WHERE is_published = true
ORDER BY seller_id, rank
LIMIT 30;`,
  },
  {
    id: "cte-top-products",
    title: "CTE: top product per category",
    difficulty: "intermediate",
    description:
      "Use a Common Table Expression to find the top product in each category.",
    sql: `WITH ranked AS (
  SELECT p.id, p.name, p.category_id,
         ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY p.base_price DESC) AS rn
  FROM products p
  WHERE p.is_published = true
)
SELECT r.id, r.name, r.category_id
FROM ranked r
WHERE r.rn = 1
ORDER BY r.category_id
LIMIT 20;`,
  },
  {
    id: "recursive-category-tree",
    title: "Recursive CTE: category tree",
    difficulty: "advanced",
    description: "Traverse the category hierarchy with a recursive CTE.",
    sql: `WITH RECURSIVE category_tree AS (
  SELECT id, name, parent_id, 0 AS depth, name::text AS path
  FROM categories
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.name, c.parent_id, ct.depth + 1, ct.path || ' > ' || c.name
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT id, name, depth, path
FROM category_tree
ORDER BY path
LIMIT 50;`,
  },
  {
    id: "recursive-employee-chain",
    title: "Recursive CTE: employee management chain",
    difficulty: "advanced",
    description: "Find the full management chain for each employee.",
    sql: `WITH RECURSIVE org_chain AS (
  SELECT id, name, manager_id, name::text AS chain
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, oc.chain || ' > ' || e.name
  FROM employees e
  INNER JOIN org_chain oc ON e.manager_id = oc.id
)
SELECT id, name, chain
FROM org_chain
ORDER BY chain
LIMIT 30;`,
  },
  {
    id: "jsonb-query",
    title: "JSONB: query customer preferences",
    difficulty: "intermediate",
    description: "Extract and filter on JSONB attributes.",
    sql: `SELECT first_name, last_name,
       preferences->>'shipping_method' AS shipping_method,
       preferences->'categories' AS categories
FROM customers
WHERE preferences @> '{"newsletter": true}'
LIMIT 20;`,
  },
  {
    id: "array-contains",
    title: "Array operations: customer tags",
    difficulty: "intermediate",
    description: "Use array containment to find customers with specific tags.",
    sql: `SELECT first_name, last_name, tags
FROM customers
WHERE tags @> ARRAY['vip']
ORDER BY id
LIMIT 20;`,
  },
  {
    id: "date-trunc-monthly",
    title: "DATE_TRUNC: monthly revenue trend",
    difficulty: "intermediate",
    description: "Aggregate revenue by month using DATE_TRUNC.",
    sql: `SELECT DATE_TRUNC('month', o.placed_at) AS month,
       COUNT(*) AS orders,
       SUM(oi.line_total) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.status <> 'CANCELLED'
GROUP BY DATE_TRUNC('month', o.placed_at)
ORDER BY month DESC
LIMIT 12;`,
  },
  {
    id: "case-expression",
    title: "CASE: classify customers by loyalty",
    difficulty: "beginner",
    description: "Use CASE to create conditional columns.",
    sql: `SELECT first_name, last_name, loyalty_tier,
       CASE
         WHEN loyalty_tier = 'PLATINUM' THEN 'VIP'
         WHEN loyalty_tier = 'GOLD' THEN 'Premium'
         WHEN loyalty_tier = 'SILVER' THEN 'Standard'
         ELSE 'Basic'
       END AS tier_label
FROM customers
ORDER BY id
LIMIT 20;`,
  },
  {
    id: "subquery-exists",
    title: "EXISTS: products with inventory",
    difficulty: "intermediate",
    description: "Use EXISTS to check for related rows.",
    sql: `SELECT p.id, p.name
FROM products p
WHERE EXISTS (
  SELECT 1 FROM product_variants pv
  JOIN inventory i ON i.variant_id = pv.id
  WHERE pv.product_id = p.id AND i.quantity_on_hand > 0
)
ORDER BY p.id
LIMIT 20;`,
  },
  {
    id: "multi-join-funnel",
    title: "Multi-join: full order details",
    difficulty: "intermediate",
    description: "Join 5 tables to get complete order information.",
    sql: `SELECT o.id AS order_id, o.status, o.placed_at,
       c.first_name || ' ' || c.last_name AS customer,
       p.name AS product, pv.sku, oi.quantity, oi.unit_price
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN product_variants pv ON oi.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
ORDER BY o.placed_at DESC
LIMIT 20;`,
  },
  {
    id: "coalesce-nulls",
    title: "COALESCE: handle NULL values",
    difficulty: "beginner",
    description: "Replace NULL values with defaults using COALESCE.",
    sql: `SELECT name, base_price,
       COALESCE(description, 'No description') AS description,
       COALESCE(weight_grams, 0) AS weight_grams
FROM products
ORDER BY id
LIMIT 20;`,
  },
  {
    id: "distinct-cities",
    title: "DISTINCT: unique customer cities",
    difficulty: "beginner",
    description: "Find all unique cities where customers live.",
    sql: `SELECT DISTINCT country, city
FROM customers
WHERE deleted_at IS NULL
ORDER BY country, city;`,
  },
  {
    id: "union-active",
    title: "UNION: active sellers and suppliers",
    difficulty: "intermediate",
    description: "Combine results from two tables with UNION.",
    sql: `SELECT name, country, 'seller' AS entity_type FROM sellers WHERE is_active = true
UNION ALL
SELECT name, country, 'supplier' AS entity_type FROM suppliers
ORDER BY country, name
LIMIT 30;`,
  },
  {
    id: "explain-analyze",
    title: "EXPLAIN ANALYZE: query plan",
    difficulty: "advanced",
    description: "Inspect the query execution plan.",
    sql: "EXPLAIN ANALYZE SELECT * FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'DELIVERED';",
  },
  {
    id: "materialized-view",
    title: "Materialized view: monthly seller revenue",
    difficulty: "advanced",
    description: "Query the pre-computed materialized view.",
    sql: `SELECT seller_id, month, revenue, orders_count
FROM mv_monthly_seller_revenue
ORDER BY revenue DESC
LIMIT 10;`,
  },
  {
    id: "full-text-search",
    title: "Full-text search: search products",
    difficulty: "advanced",
    description: "Use PostgreSQL full-text search to find products.",
    sql: `SELECT name, description,
       ts_rank_cd(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', 'wireless')) AS rank
FROM products
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', 'wireless')
ORDER BY rank DESC
LIMIT 10;`,
  },
  {
    id: "range-join-exchange-rates",
    title: "Range join: orders with exchange rates",
    difficulty: "advanced",
    description: "Join orders to exchange rates using a date range condition.",
    sql: `SELECT o.id, o.placed_at, o.currency, er.rate_to_usd,
       SUM(oi.line_total) AS order_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN exchange_rates er ON o.currency = er.currency
  AND o.placed_at >= er.valid_from
  AND o.placed_at < er.valid_to
WHERE o.currency <> 'USD'
GROUP BY o.id, o.placed_at, o.currency, er.rate_to_usd
ORDER BY o.placed_at DESC
LIMIT 10;`,
  },
  {
    id: "funnel-conversion",
    title: "Funnel analysis: event conversion",
    difficulty: "advanced",
    description: "Calculate conversion rates through the purchase funnel.",
    sql: `SELECT event_type, COUNT(*) AS events,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
FROM page_view_events
GROUP BY event_type
ORDER BY events DESC;`,
  },
  {
    id: "correlated-subquery",
    title: "Correlated subquery: top product per seller",
    difficulty: "advanced",
    description:
      "Use a correlated subquery to find each seller's most expensive product.",
    sql: `SELECT s.name, p.name AS top_product, p.base_price
FROM sellers s
JOIN products p ON p.seller_id = s.id
WHERE p.base_price = (
  SELECT MAX(p2.base_price) FROM products p2 WHERE p2.seller_id = s.id
)
ORDER BY p.base_price DESC
LIMIT 20;`,
  },
  {
    id: "rolling-average",
    title: "Window functions: 7-day rolling revenue",
    difficulty: "advanced",
    description: "Compute a rolling 7-day average revenue.",
    sql: `SELECT snapshot_date,
       gross_revenue,
       AVG(gross_revenue) OVER (ORDER BY snapshot_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_7d_avg
FROM daily_sales_snapshots
WHERE seller_id = (SELECT id FROM sellers ORDER BY id LIMIT 1)
ORDER BY snapshot_date DESC
LIMIT 20;`,
  },
];

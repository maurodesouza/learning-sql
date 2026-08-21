/**
 * Challenge catalog — 27 curated SQL exercises grouped by level.
 *
 * All content is in English. Each challenge has a reference solution that is
 * run server-side and compared against the user's query by column names + rows.
 *
 * Authoring rules (docs/plan.md §4.2):
 * 1. Never `SELECT *` in a solution — alias every column explicitly.
 * 2. The prompt states the required column names, in order.
 * 3. Round floating/numeric aggregates (ROUND(x, 2)) so tiny differences don't fail.
 * 4. `orderMatters: true` requires a deterministic tiebreaker in ORDER BY.
 * 5. Avoid LIMIT n where rows n/n+1 tie.
 * 6. Stay well under HARD_MAX_ROWS (5000); add LIMIT when needed.
 * 7. Prefer fixed date literals over NOW()/CURRENT_DATE.
 */

export interface ChallengeSeed {
  slug: string;
  title: string;
  level: "BEGINNER" | "MID_LEVEL" | "SENIOR" | "EXPERT";
  prompt: string;
  expectedColumns: string[];
  starterSql?: string;
  solutionSql: string;
  orderMatters: boolean;
  hints: string[];
}

export const CHALLENGES: ChallengeSeed[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BEGINNER (8) — SELECT / WHERE / ORDER BY / LIMIT / NULL / DISTINCT / JOIN
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "active-sellers-by-rating",
    title: "Active Sellers by Rating",
    level: "BEGINNER",
    prompt:
      "List all active sellers (is_active = true) sorted by rating from highest to lowest.\n\n" +
      "Return exactly these columns in this order:\n- seller_name\n- country\n- rating",
    expectedColumns: ["seller_name", "country", "rating"],
    starterSql: "SELECT -- from sellers\n",
    solutionSql:
      `SELECT name AS seller_name, country, rating\n` +
      `FROM sellers\n` +
      `WHERE is_active = true\n` +
      `ORDER BY rating DESC, seller_name ASC;`,
    orderMatters: true,
    hints: [
      "Filter with WHERE is_active = true.",
      "Alias the name column as seller_name.",
      "Order by rating DESC — add seller_name ASC as a tiebreaker.",
    ],
  },

  {
    slug: "cheapest-published-products",
    title: "Cheapest Published Products",
    level: "BEGINNER",
    prompt:
      "Find the 5 cheapest published products (is_published = true).\n\n" +
      "Return exactly these columns in this order:\n- product_name\n- base_price",
    expectedColumns: ["product_name", "base_price"],
    starterSql: "SELECT -- from products\n",
    solutionSql:
      `SELECT name AS product_name, base_price\n` +
      `FROM products\n` +
      `WHERE is_published = true\n` +
      `ORDER BY base_price ASC, product_name ASC\n` +
      `LIMIT 5;`,
    orderMatters: true,
    hints: [
      "Filter with WHERE is_published = true.",
      "Order by base_price ASC and use LIMIT 5.",
      "Add product_name ASC as a tiebreaker so the order is deterministic.",
    ],
  },

  {
    slug: "customers-per-loyalty-tier",
    title: "Customers per Loyalty Tier",
    level: "BEGINNER",
    prompt:
      "Count how many customers belong to each loyalty tier.\n\n" +
      "Return exactly these columns in this order:\n- loyalty_tier\n- customer_count",
    expectedColumns: ["loyalty_tier", "customer_count"],
    starterSql: "SELECT -- from customers\n",
    solutionSql:
      `SELECT loyalty_tier, COUNT(*) AS customer_count\n` +
      `FROM customers\n` +
      `GROUP BY loyalty_tier\n` +
      `ORDER BY loyalty_tier ASC;`,
    orderMatters: true,
    hints: [
      "Use GROUP BY loyalty_tier.",
      "COUNT(*) gives the number of customers per group.",
      "Order by loyalty_tier ASC so the rows are always in the same order.",
    ],
  },

  {
    slug: "orders-by-status",
    title: "Orders by Status",
    level: "BEGINNER",
    prompt:
      "Count how many orders exist for each order status.\n\n" +
      "Return exactly these columns in this order:\n- status\n- order_count",
    expectedColumns: ["status", "order_count"],
    starterSql: "SELECT -- from orders\n",
    solutionSql:
      `SELECT status, COUNT(*) AS order_count\n` +
      `FROM orders\n` +
      `GROUP BY status\n` +
      `ORDER BY status ASC;`,
    orderMatters: true,
    hints: [
      "GROUP BY status and COUNT(*).",
      "The status column is an enum — group by it directly.",
      "Order by status ASC for deterministic output.",
    ],
  },

  {
    slug: "products-without-description",
    title: "Products Without a Description",
    level: "BEGINNER",
    prompt:
      "List products that have no description (description IS NULL).\n\n" +
      "Return exactly these columns in this order:\n- product_name\n- base_price",
    expectedColumns: ["product_name", "base_price"],
    starterSql: "SELECT -- from products\n",
    solutionSql:
      `SELECT name AS product_name, base_price\n` +
      `FROM products\n` +
      `WHERE description IS NULL\n` +
      `ORDER BY product_name ASC;`,
    orderMatters: true,
    hints: [
      "Use IS NULL to test for missing values, not = NULL.",
      "Alias name as product_name.",
      "Order by product_name ASC for deterministic output.",
    ],
  },

  {
    slug: "distinct-shipping-countries",
    title: "Distinct Shipping Countries",
    level: "BEGINNER",
    prompt:
      "List all distinct countries that appear in the addresses table.\n\n" +
      "Return exactly one column:\n- country",
    expectedColumns: ["country"],
    starterSql: "SELECT -- from addresses\n",
    solutionSql:
      `SELECT DISTINCT country\n` +
      `FROM addresses\n` +
      `ORDER BY country ASC;`,
    orderMatters: true,
    hints: [
      "Use SELECT DISTINCT to remove duplicates.",
      "Order by country ASC so the output is deterministic.",
    ],
  },

  {
    slug: "order-items-with-product-name",
    title: "Order Items with Product Name",
    level: "BEGINNER",
    prompt:
      "For each order item, show the order id, quantity and the product name.\n\n" +
      "Join order_items → product_variants → products.\n\n" +
      "Return exactly these columns in this order:\n- order_id\n- quantity\n- product_name\n\n" +
      "Limit to the first 10 rows ordered by order_id, then by order item id.",
    expectedColumns: ["order_id", "quantity", "product_name"],
    starterSql: "SELECT -- from order_items\n",
    solutionSql:
      `SELECT oi.order_id, oi.quantity, p.name AS product_name\n` +
      `FROM order_items oi\n` +
      `JOIN product_variants pv ON oi.variant_id = pv.id\n` +
      `JOIN products p ON pv.product_id = p.id\n` +
      `ORDER BY oi.order_id ASC, oi.id ASC\n` +
      `LIMIT 10;`,
    orderMatters: true,
    hints: [
      "You need two JOINs: order_items → product_variants, then product_variants → products.",
      "The product name lives in the products table, not in order_items.",
      "Order by order_id ASC, then by the order item's own id for a deterministic tiebreaker.",
    ],
  },

  {
    slug: "products-never-ordered",
    title: "Products Never Ordered",
    level: "BEGINNER",
    prompt:
      "Find products that have never been ordered (no matching order_items).\n\n" +
      "Use a LEFT JOIN from products through product_variants to order_items,\n" +
      "then filter where the order item id IS NULL.\n\n" +
      "Return exactly these columns in this order:\n- product_name\n- base_price\n\n" +
      "Order by product_name ASC.",
    expectedColumns: ["product_name", "base_price"],
    starterSql: "SELECT -- from products\n",
    solutionSql:
      `SELECT p.name AS product_name, p.base_price\n` +
      `FROM products p\n` +
      `LEFT JOIN product_variants pv ON pv.product_id = p.id\n` +
      `LEFT JOIN order_items oi ON oi.variant_id = pv.id\n` +
      `WHERE oi.id IS NULL\n` +
      `ORDER BY product_name ASC;`,
    orderMatters: true,
    hints: [
      "LEFT JOIN products → product_variants → order_items.",
      "Filter with WHERE oi.id IS NULL to find products with no order items.",
      "Alias name as product_name and order by it ASC.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MID-LEVEL (8) — aggregation depth, windows, CTEs, jsonb/arrays, dates
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "revenue-per-seller",
    title: "Revenue per Seller",
    level: "MID_LEVEL",
    prompt:
      "Calculate the total revenue per seller from non-cancelled orders.\n\n" +
      "Use the line_total column on order_items (it equals quantity * unit_price - discount_amount).\n" +
      "Only include sellers whose total revenue is at least 10000.\n\n" +
      "Return exactly these columns in this order:\n- seller_name\n- total_revenue",
    expectedColumns: ["seller_name", "total_revenue"],
    starterSql: "SELECT -- from sellers, order_items, orders\n",
    solutionSql:
      `SELECT s.name AS seller_name, ROUND(SUM(oi.line_total), 2) AS total_revenue\n` +
      `FROM sellers s\n` +
      `JOIN order_items oi ON oi.seller_id = s.id\n` +
      `JOIN orders o ON o.id = oi.order_id\n` +
      `WHERE o.status <> 'CANCELLED'\n` +
      `GROUP BY s.id, s.name\n` +
      `HAVING SUM(oi.line_total) >= 10000\n` +
      `ORDER BY total_revenue DESC, seller_name ASC;`,
    orderMatters: true,
    hints: [
      "Join sellers → order_items (on seller_id) → orders (on order_id).",
      "Filter out CANCELLED orders with WHERE o.status <> 'CANCELLED'.",
      "Use HAVING SUM(oi.line_total) >= 10000 after GROUP BY, and ROUND(..., 2) on the result.",
    ],
  },

  {
    slug: "top-products-per-category",
    title: "Top Product per Category",
    level: "MID_LEVEL",
    prompt:
      "For each top-level category (parent_id IS NULL), find the product with the highest base_price.\n\n" +
      "Return exactly these columns in this order:\n- category_name\n- product_name\n- base_price\n\n" +
      "Order by category_name ASC.",
    expectedColumns: ["category_name", "product_name", "base_price"],
    starterSql: "WITH ranked AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH ranked AS (\n` +
      `  SELECT c.name AS category_name, p.name AS product_name, p.base_price,\n` +
      `         ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY p.base_price DESC, p.name ASC) AS rn\n` +
      `  FROM categories c\n` +
      `  JOIN products p ON p.category_id = c.id\n` +
      `  WHERE c.parent_id IS NULL\n` +
      `)\n` +
      `SELECT category_name, product_name, base_price\n` +
      `FROM ranked\n` +
      `WHERE rn = 1\n` +
      `ORDER BY category_name ASC;`,
    orderMatters: true,
    hints: [
      "Use ROW_NUMBER() OVER (PARTITION BY category ORDER BY base_price DESC) to rank products.",
      "Filter the CTE with WHERE rn = 1 to keep only the top product per category.",
      "Add p.name ASC as a tiebreaker in the ORDER BY inside the window function.",
    ],
  },

  {
    slug: "monthly-revenue-trend",
    title: "Monthly Revenue Trend",
    level: "MID_LEVEL",
    prompt:
      "Show the total revenue per month from non-cancelled orders.\n\n" +
      "Truncate the placed_at timestamp to month with date_trunc.\n\n" +
      "Return exactly these columns in this order:\n- month\n- total_revenue\n\n" +
      "Order by month ASC.",
    expectedColumns: ["month", "total_revenue"],
    starterSql: "SELECT -- from orders, order_items\n",
    solutionSql:
      `SELECT date_trunc('month', o.placed_at) AS month,\n` +
      `       ROUND(SUM(oi.line_total), 2) AS total_revenue\n` +
      `FROM orders o\n` +
      `JOIN order_items oi ON oi.order_id = o.id\n` +
      `WHERE o.status <> 'CANCELLED'\n` +
      `GROUP BY date_trunc('month', o.placed_at)\n` +
      `ORDER BY month ASC;`,
    orderMatters: true,
    hints: [
      "Use date_trunc('month', o.placed_at) to bucket orders by month.",
      "Join orders → order_items and sum line_total.",
      "Filter out CANCELLED orders and GROUP BY the truncated month.",
    ],
  },

  {
    slug: "best-rated-products",
    title: "Best Rated Products",
    level: "MID_LEVEL",
    prompt:
      "Find products with an average rating of at least 4.0 from at least 5 reviews.\n\n" +
      "Return exactly these columns in this order:\n- product_name\n- avg_rating\n- review_count\n\n" +
      "Order by avg_rating DESC, then product_name ASC.",
    expectedColumns: ["product_name", "avg_rating", "review_count"],
    starterSql: "SELECT -- from products, reviews\n",
    solutionSql:
      `SELECT p.name AS product_name,\n` +
      `       ROUND(AVG(r.rating), 2) AS avg_rating,\n` +
      `       COUNT(*) AS review_count\n` +
      `FROM products p\n` +
      `JOIN reviews r ON r.product_id = p.id\n` +
      `GROUP BY p.id, p.name\n` +
      `HAVING COUNT(*) >= 5 AND AVG(r.rating) >= 4.0\n` +
      `ORDER BY avg_rating DESC, product_name ASC;`,
    orderMatters: true,
    hints: [
      "Join products → reviews and GROUP BY the product.",
      "Use HAVING COUNT(*) >= 5 AND AVG(rating) >= 4.0 to filter groups.",
      "Round the average to 2 decimal places with ROUND(AVG(r.rating), 2).",
    ],
  },

  {
    slug: "days-between-first-two-orders",
    title: "Days Between First Two Orders",
    level: "MID_LEVEL",
    prompt:
      "For each customer who has placed at least 2 orders, compute the number of days\n" +
      "between their first and second order.\n\n" +
      "Return exactly these columns in this order:\n- customer_name\n- days_between\n\n" +
      "Order by days_between ASC, then customer_name ASC. Limit to 10 rows.",
    expectedColumns: ["customer_name", "days_between"],
    starterSql: "WITH ordered AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH ordered AS (\n` +
      `  SELECT c.id, (c.first_name || ' ' || c.last_name) AS customer_name,\n` +
      `         o.placed_at,\n` +
      `         ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY o.placed_at ASC) AS rn\n` +
      `  FROM customers c\n` +
      `  JOIN orders o ON o.customer_id = c.id\n` +
      `),\n` +
      `first_two AS (\n` +
      `  SELECT id, customer_name,\n` +
      `         MIN(CASE WHEN rn = 1 THEN placed_at END) AS first_order,\n` +
      `         MIN(CASE WHEN rn = 2 THEN placed_at END) AS second_order\n` +
      `  FROM ordered\n` +
      `  WHERE rn <= 2\n` +
      `  GROUP BY id, customer_name\n` +
      `  HAVING COUNT(*) = 2\n` +
      `)\n` +
      `SELECT customer_name,\n` +
      `       (second_order::date - first_order::date) AS days_between\n` +
      `FROM first_two\n` +
      `ORDER BY days_between ASC, customer_name ASC\n` +
      `LIMIT 10;`,
    orderMatters: true,
    hints: [
      "Use ROW_NUMBER() OVER (PARTITION BY customer ORDER BY placed_at) to rank each customer's orders.",
      "Filter to rn <= 2 and pivot the first and second dates into one row per customer.",
      "Subtract dates with (second::date - first::date) to get an integer day count.",
    ],
  },

  {
    slug: "category-tree-paths",
    title: "Category Tree Paths",
    level: "MID_LEVEL",
    prompt:
      "Build the full path from the root category down to each category in the tree.\n\n" +
      "Use a recursive CTE. The path is the category names joined with ' > '.\n\n" +
      "Return exactly these columns in this order:\n- category_name\n- depth\n- path\n\n" +
      "Order by path ASC. Limit to 20 rows.",
    expectedColumns: ["category_name", "depth", "path"],
    starterSql: "WITH RECURSIVE tree AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH RECURSIVE tree AS (\n` +
      `  SELECT id, name, parent_id, 1 AS depth, name::text AS path\n` +
      `  FROM categories\n` +
      `  WHERE parent_id IS NULL\n` +
      `  UNION ALL\n` +
      `  SELECT c.id, c.name, c.parent_id, t.depth + 1,\n` +
      `         (t.path || ' > ' || c.name)::text\n` +
      `  FROM categories c\n` +
      `  JOIN tree t ON c.parent_id = t.id\n` +
      `)\n` +
      `SELECT name AS category_name, depth, path\n` +
      `FROM tree\n` +
      `ORDER BY path ASC\n` +
      `LIMIT 20;`,
    orderMatters: true,
    hints: [
      "Start the recursive CTE with the root categories (parent_id IS NULL) at depth 1.",
      "In the recursive part, join categories to the CTE on parent_id = tree.id and increment depth.",
      "Build the path by concatenating the parent path with ' > ' and the current name.",
    ],
  },

  {
    slug: "coupon-discount-impact",
    title: "Coupon Discount Impact",
    level: "MID_LEVEL",
    prompt:
      "For each coupon, show how many orders used it and the total discount applied.\n\n" +
      "Return exactly these columns in this order:\n- code\n- orders_count\n- total_discount\n\n" +
      "Order by total_discount DESC, then code ASC.",
    expectedColumns: ["code", "orders_count", "total_discount"],
    starterSql: "SELECT -- from coupons, order_coupons\n",
    solutionSql:
      `SELECT c.code,\n` +
      `       COUNT(oc.order_id) AS orders_count,\n` +
      `       ROUND(SUM(oc.discount_applied), 2) AS total_discount\n` +
      `FROM coupons c\n` +
      `JOIN order_coupons oc ON oc.coupon_id = c.id\n` +
      `GROUP BY c.id, c.code\n` +
      `ORDER BY total_discount DESC, code ASC;`,
    orderMatters: true,
    hints: [
      "Join coupons → order_coupons and GROUP BY the coupon.",
      "COUNT(oc.order_id) gives the number of orders that used the coupon.",
      "SUM(oc.discount_applied) gives the total discount; round it to 2 decimals.",
    ],
  },

  {
    slug: "products-by-jsonb-attribute",
    title: "Products by Color",
    level: "MID_LEVEL",
    prompt:
      "Count how many products have each value in the 'color' attribute (stored in the jsonb\n" +
      "attributes column).\n\n" +
      "Return exactly these columns in this order:\n- color\n- product_count\n\n" +
      "Order by product_count DESC, then color ASC.",
    expectedColumns: ["color", "product_count"],
    starterSql: "SELECT -- from products, attributes->>'color'\n",
    solutionSql:
      `SELECT attributes->>'color' AS color,\n` +
      `       COUNT(*) AS product_count\n` +
      `FROM products\n` +
      `WHERE attributes ? 'color'\n` +
      `GROUP BY attributes->>'color'\n` +
      `ORDER BY product_count DESC, color ASC;`,
    orderMatters: true,
    hints: [
      "Extract the color with attributes->>'color' (returns text).",
      "Use attributes ? 'color' to filter only products that have a color attribute.",
      "GROUP BY the extracted color and COUNT(*).",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SENIOR (6) — analytics patterns and traps
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "running-total-revenue",
    title: "Running Total Revenue",
    level: "SENIOR",
    prompt:
      "Compute the cumulative running total of revenue over time, ordered by the order date.\n" +
      "Only include non-cancelled orders.\n\n" +
      "Use a window function with SUM() OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING).\n\n" +
      "Return exactly these columns in this order:\n- placed_at\n- order_id\n- running_total\n\n" +
      "Order by placed_at ASC, order_id ASC. Limit to 20 rows.",
    expectedColumns: ["placed_at", "order_id", "running_total"],
    starterSql: "SELECT -- from orders, order_items\n",
    solutionSql:
      `WITH order_revenue AS (\n` +
      `  SELECT o.id AS order_id, o.placed_at,\n` +
      `         SUM(oi.line_total) AS order_revenue\n` +
      `  FROM orders o\n` +
      `  JOIN order_items oi ON oi.order_id = o.id\n` +
      `  WHERE o.status <> 'CANCELLED'\n` +
      `  GROUP BY o.id, o.placed_at\n` +
      `)\n` +
      `SELECT placed_at, order_id,\n` +
      `       ROUND(SUM(order_revenue) OVER (ORDER BY placed_at ASC, order_id ASC\n` +
      `             ROWS UNBOUNDED PRECEDING), 2) AS running_total\n` +
      `FROM order_revenue\n` +
      `ORDER BY placed_at ASC, order_id ASC\n` +
      `LIMIT 20;`,
    orderMatters: true,
    hints: [
      "First compute the revenue per order in a CTE (SUM of line_total grouped by order).",
      "Then use SUM(order_revenue) OVER (ORDER BY placed_at, order_id ROWS UNBOUNDED PRECEDING).",
      "The window ORDER BY must match the outer ORDER BY for a deterministic running total.",
    ],
  },

  {
    slug: "signup-month-cohort-retention",
    title: "Orders per Signup Month",
    level: "SENIOR",
    prompt:
      "Group customers by the month they signed up (created_at) and count how many orders\n" +
      "were placed by customers in each signup cohort.\n\n" +
      "Return exactly these columns in this order:\n- signup_month\n- customer_count\n- order_count\n\n" +
      "Order by signup_month ASC.",
    expectedColumns: ["signup_month", "customer_count", "order_count"],
    starterSql: "WITH cohorts AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH cohorts AS (\n` +
      `  SELECT id, date_trunc('month', created_at) AS signup_month\n` +
      `  FROM customers\n` +
      `),\n` +
      `cohort_orders AS (\n` +
      `  SELECT c.signup_month, COUNT(DISTINCT c.id) AS customer_count,\n` +
      `         COUNT(o.id) AS order_count\n` +
      `  FROM cohorts c\n` +
      `  LEFT JOIN orders o ON o.customer_id = c.id\n` +
      `  GROUP BY c.signup_month\n` +
      `)\n` +
      `SELECT signup_month, customer_count, order_count\n` +
      `FROM cohort_orders\n` +
      `ORDER BY signup_month ASC;`,
    orderMatters: true,
    hints: [
      "Build a CTE that truncates each customer's created_at to month.",
      "LEFT JOIN to orders so cohorts with zero orders still appear.",
      "COUNT(DISTINCT customer id) for the cohort size, COUNT(order id) for order volume.",
    ],
  },

  {
    slug: "payments-row-multiplication",
    title: "Revenue per Order (Avoid the Trap)",
    level: "SENIOR",
    prompt:
      "Calculate the total revenue per seller from non-cancelled orders.\n\n" +
      "WARNING: orders can have multiple payment rows. If you join payments naively,\n" +
      "each order item gets multiplied by the number of payments. Pre-aggregate or\n" +
      "avoid the payments table entirely — line_total on order_items already has the answer.\n\n" +
      "Return exactly these columns in this order:\n- seller_name\n- total_revenue\n\n" +
      "Order by total_revenue DESC, seller_name ASC.",
    expectedColumns: ["seller_name", "total_revenue"],
    starterSql: "SELECT -- from sellers, order_items, orders\n",
    solutionSql:
      `SELECT s.name AS seller_name, ROUND(SUM(oi.line_total), 2) AS total_revenue\n` +
      `FROM sellers s\n` +
      `JOIN order_items oi ON oi.seller_id = s.id\n` +
      `JOIN orders o ON o.id = oi.order_id\n` +
      `WHERE o.status <> 'CANCELLED'\n` +
      `GROUP BY s.id, s.name\n` +
      `ORDER BY total_revenue DESC, seller_name ASC;`,
    orderMatters: true,
    hints: [
      "The payments table is a trap — joining it multiplies order items by the number of payments.",
      "You don't need payments at all: line_total on order_items is the revenue per line.",
      "Join sellers → order_items → orders, filter non-cancelled, and SUM line_total per seller.",
    ],
  },

  {
    slug: "orders-in-usd",
    title: "Orders in USD",
    level: "SENIOR",
    prompt:
      "Convert each non-cancelled order's revenue to USD using the exchange_rates table.\n\n" +
      "Join orders to exchange_rates on currency and on placed_at falling within\n" +
      "[valid_from, valid_to]. This is a range/non-equi join.\n\n" +
      "Return exactly these columns in this order:\n- order_id\n- currency\n- original_revenue\n- usd_revenue\n\n" +
      "Order by order_id ASC. Limit to 20 rows.",
    expectedColumns: [
      "order_id",
      "currency",
      "original_revenue",
      "usd_revenue",
    ],
    starterSql: "WITH order_rev AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH order_rev AS (\n` +
      `  SELECT o.id AS order_id, o.currency, o.placed_at::date AS order_date,\n` +
      `         SUM(oi.line_total) AS original_revenue\n` +
      `  FROM orders o\n` +
      `  JOIN order_items oi ON oi.order_id = o.id\n` +
      `  WHERE o.status <> 'CANCELLED'\n` +
      `  GROUP BY o.id, o.currency, o.placed_at\n` +
      `)\n` +
      `SELECT orv.order_id, orv.currency,\n` +
      `       ROUND(orv.original_revenue, 2) AS original_revenue,\n` +
      `       ROUND(orv.original_revenue * er.rate_to_usd, 2) AS usd_revenue\n` +
      `FROM order_rev orv\n` +
      `JOIN exchange_rates er\n` +
      `  ON er.currency = orv.currency\n` +
      `  AND orv.order_date >= er.valid_from\n` +
      `  AND orv.order_date <= er.valid_to\n` +
      `ORDER BY orv.order_id ASC\n` +
      `LIMIT 20;`,
    orderMatters: true,
    hints: [
      "First compute the revenue per order in a CTE (SUM of line_total grouped by order).",
      "Join to exchange_rates on currency AND on the order date falling within [valid_from, valid_to].",
      "This is a range join: order_date >= valid_from AND order_date <= valid_to.",
    ],
  },

  {
    slug: "product-search-ranking",
    title: "Product Search Ranking",
    level: "SENIOR",
    prompt:
      "Search for products whose name or description contains the word 'cotton' using\n" +
      "Postgres full-text search. Rank results by relevance (ts_rank).\n\n" +
      "The products table has a generated tsvector column called search_tsv.\n\n" +
      "Return exactly these columns in this order:\n- product_name\n- rank\n\n" +
      "Order by rank DESC, product_name ASC. Limit to 10 rows.",
    expectedColumns: ["product_name", "rank"],
    starterSql: "SELECT -- from products, search_tsv\n",
    solutionSql:
      `SELECT name AS product_name,\n` +
      `       ts_rank(search_tsv, plainto_tsquery('english', 'cotton')) AS rank\n` +
      `FROM products\n` +
      `WHERE search_tsv @@ plainto_tsquery('english', 'cotton')\n` +
      `ORDER BY rank DESC, product_name ASC\n` +
      `LIMIT 10;`,
    orderMatters: true,
    hints: [
      "Use plainto_tsquery('english', 'cotton') to build a search query from plain text.",
      "Filter with WHERE search_tsv @@ plainto_tsquery(...).",
      "Rank with ts_rank(search_tsv, plainto_tsquery(...)) and order by it DESC.",
    ],
  },

  {
    slug: "seller-revenue-percentile",
    title: "Seller Revenue Percentile",
    level: "SENIOR",
    prompt:
      "Using the daily_sales_snapshots table, compute each seller's total gross revenue\n" +
      "and its percentile rank across all sellers.\n\n" +
      "Return exactly these columns in this order:\n- seller_name\n- total_revenue\n- percentile_rank\n\n" +
      "Order by total_revenue DESC, seller_name ASC.",
    expectedColumns: ["seller_name", "total_revenue", "percentile_rank"],
    starterSql: "SELECT -- from sellers, daily_sales_snapshots\n",
    solutionSql:
      `WITH seller_rev AS (\n` +
      `  SELECT s.id, s.name AS seller_name,\n` +
      `         ROUND(SUM(d.gross_revenue), 2) AS total_revenue\n` +
      `  FROM sellers s\n` +
      `  JOIN daily_sales_snapshots d ON d.seller_id = s.id\n` +
      `  GROUP BY s.id, s.name\n` +
      `)\n` +
      `SELECT seller_name, total_revenue,\n` +
      `       ROUND(PERCENT_RANK() OVER (ORDER BY total_revenue ASC)::numeric, 4) AS percentile_rank\n` +
      `FROM seller_rev\n` +
      `ORDER BY total_revenue DESC, seller_name ASC;`,
    orderMatters: true,
    hints: [
      "First aggregate daily_sales_snapshots per seller in a CTE.",
      "Use PERCENT_RANK() OVER (ORDER BY total_revenue ASC) on the aggregated values.",
      "PERCENT_RANK returns 0..1, where 1 means the highest revenue — round to 4 decimals.",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERT (5)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "consecutive-active-days",
    title: "Consecutive Active Days",
    level: "EXPERT",
    prompt:
      "For each customer in page_view_events, find the longest streak of consecutive days\n" +
      "with at least one event. Use a gaps-and-islands approach.\n\n" +
      "Return exactly these columns in this order:\n- customer_id\n- longest_streak\n\n" +
      "Order by longest_streak DESC, customer_id ASC. Limit to 10 rows.",
    expectedColumns: ["customer_id", "longest_streak"],
    starterSql: "WITH daily AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH daily AS (\n` +
      `  SELECT DISTINCT customer_id, occurred_at::date AS event_date\n` +
      `  FROM page_view_events\n` +
      `  WHERE customer_id IS NOT NULL\n` +
      `),\n` +
      `grouped AS (\n` +
      `  SELECT customer_id, event_date,\n` +
      `         event_date - (ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY event_date))::int AS grp\n` +
      `  FROM daily\n` +
      `),\n` +
      `streaks AS (\n` +
      `  SELECT customer_id, grp, MIN(event_date) AS streak_start, MAX(event_date) AS streak_end,\n` +
      `         (MAX(event_date) - MIN(event_date) + 1) AS streak_len\n` +
      `  FROM grouped\n` +
      `  GROUP BY customer_id, grp\n` +
      `)\n` +
      `SELECT customer_id, MAX(streak_len) AS longest_streak\n` +
      `FROM streaks\n` +
      `GROUP BY customer_id\n` +
      `ORDER BY longest_streak DESC, customer_id ASC\n` +
      `LIMIT 10;`,
    orderMatters: true,
    hints: [
      "Get the distinct set of (customer_id, event_date) pairs first.",
      "The classic trick: subtract ROW_NUMBER() (as days) from the event_date. Consecutive days get the same group value.",
      "Group by customer_id and the computed group, then the streak length is max(date) - min(date) + 1.",
    ],
  },

  {
    slug: "funnel-conversion-by-device",
    title: "Funnel Conversion by Device",
    level: "EXPERT",
    prompt:
      "Using page_view_events, compute the funnel counts per device:\n" +
      "PAGE_VIEW → PRODUCT_VIEW → ADD_TO_CART → CHECKOUT_START → PURCHASE.\n\n" +
      "Count distinct sessions for each stage per device. Then compute the conversion rate\n" +
      "from PAGE_VIEW to PURCHASE as a decimal (0..1).\n\n" +
      "Return exactly these columns in this order:\n- device\n- page_views\n- purchases\n- conversion_rate\n\n" +
      "Order by conversion_rate DESC, device ASC.",
    expectedColumns: ["device", "page_views", "purchases", "conversion_rate"],
    starterSql: "SELECT -- from page_view_events\n",
    solutionSql:
      `SELECT device,\n` +
      `       COUNT(DISTINCT CASE WHEN event_type = 'PAGE_VIEW' THEN session_id END) AS page_views,\n` +
      `       COUNT(DISTINCT CASE WHEN event_type = 'PURCHASE' THEN session_id END) AS purchases,\n` +
      `       ROUND(\n` +
      `         COUNT(DISTINCT CASE WHEN event_type = 'PURCHASE' THEN session_id END)::numeric /\n` +
      `         NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'PAGE_VIEW' THEN session_id END), 0),\n` +
      `         4\n` +
      `       ) AS conversion_rate\n` +
      `FROM page_view_events\n` +
      `GROUP BY device\n` +
      `ORDER BY conversion_rate DESC, device ASC;`,
    orderMatters: true,
    hints: [
      "Use COUNT(DISTINCT CASE WHEN event_type = '...' THEN session_id END) for each funnel stage.",
      "The conversion rate is purchases / page_views — cast to numeric to avoid integer division.",
      "Use NULLIF(..., 0) to avoid division by zero, and ROUND(..., 4) for a clean decimal.",
    ],
  },

  {
    slug: "snapshot-vs-live-reconciliation",
    title: "Snapshot vs Live Reconciliation",
    level: "EXPERT",
    prompt:
      "Compare the daily_sales_snapshots table against a live aggregation of order_items.\n\n" +
      "For each (snapshot_date, seller_id), show:\n" +
      "- the snapshot gross_revenue\n" +
      "- the live gross revenue (SUM of line_total for non-cancelled orders placed on that date)\n\n" +
      "Return exactly these columns in this order:\n- snapshot_date\n- seller_id\n- snapshot_revenue\n- live_revenue\n\n" +
      "Order by snapshot_date ASC, seller_id ASC. Limit to 20 rows.",
    expectedColumns: [
      "snapshot_date",
      "seller_id",
      "snapshot_revenue",
      "live_revenue",
    ],
    starterSql: "WITH live AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH live AS (\n` +
      `  SELECT o.placed_at::date AS order_date, oi.seller_id,\n` +
      `         SUM(oi.line_total) AS live_revenue\n` +
      `  FROM orders o\n` +
      `  JOIN order_items oi ON oi.order_id = o.id\n` +
      `  WHERE o.status <> 'CANCELLED'\n` +
      `  GROUP BY o.placed_at::date, oi.seller_id\n` +
      `)\n` +
      `SELECT d.snapshot_date, d.seller_id,\n` +
      `       ROUND(d.gross_revenue, 2) AS snapshot_revenue,\n` +
      `       ROUND(COALESCE(l.live_revenue, 0), 2) AS live_revenue\n` +
      `FROM daily_sales_snapshots d\n` +
      `LEFT JOIN live l\n` +
      `  ON l.order_date = d.snapshot_date AND l.seller_id = d.seller_id\n` +
      `ORDER BY d.snapshot_date ASC, d.seller_id ASC\n` +
      `LIMIT 20;`,
    orderMatters: true,
    hints: [
      "Build a CTE that aggregates order_items by (placed_at::date, seller_id) for non-cancelled orders.",
      "LEFT JOIN the snapshots to the live aggregation on date and seller_id.",
      "Use COALESCE(l.live_revenue, 0) in case a snapshot has no matching live data.",
    ],
  },

  {
    slug: "rolling-90-day-top-spenders",
    title: "Rolling 90-Day Top Spenders",
    level: "EXPERT",
    prompt:
      "For each customer, compute their total spending over a rolling 90-day window\n" +
      "ending at each order date. Then find the top 10 customer-window combinations by spend.\n\n" +
      "Use a window frame with RANGE BETWEEN INTERVAL '90 days' PRECEDING AND CURRENT ROW.\n\n" +
      "Return exactly these columns in this order:\n- customer_id\n- window_end\n- rolling_spend\n\n" +
      "Order by rolling_spend DESC, customer_id ASC, window_end ASC. Limit to 10 rows.",
    expectedColumns: ["customer_id", "window_end", "rolling_spend"],
    starterSql: "WITH order_spend AS (\n  SELECT -- ...\n)\n",
    solutionSql:
      `WITH order_spend AS (\n` +
      `  SELECT o.customer_id, o.placed_at,\n` +
      `         SUM(oi.line_total) AS order_total\n` +
      `  FROM orders o\n` +
      `  JOIN order_items oi ON oi.order_id = o.id\n` +
      `  WHERE o.status <> 'CANCELLED'\n` +
      `  GROUP BY o.id, o.customer_id, o.placed_at\n` +
      `)\n` +
      `SELECT customer_id,\n` +
      `       placed_at AS window_end,\n` +
      `       ROUND(SUM(order_total) OVER (\n` +
      `         PARTITION BY customer_id\n` +
      `         ORDER BY placed_at\n` +
      `         RANGE BETWEEN INTERVAL '90 days' PRECEDING AND CURRENT ROW\n` +
      `       ), 2) AS rolling_spend\n` +
      `FROM order_spend\n` +
      `ORDER BY rolling_spend DESC, customer_id ASC, window_end ASC\n` +
      `LIMIT 10;`,
    orderMatters: true,
    hints: [
      "First compute the spend per order in a CTE (SUM of line_total grouped by order).",
      "Use SUM(order_total) OVER (PARTITION BY customer_id ORDER BY placed_at RANGE BETWEEN INTERVAL '90 days' PRECEDING AND CURRENT ROW).",
      "RANGE with an interval works because placed_at is a timestamp — it slides a 90-day window per customer.",
    ],
  },

  {
    slug: "latest-shipment-per-order",
    title: "Latest Shipment per Order",
    level: "EXPERT",
    prompt:
      "For each seller, find the most recent shipment information including the order id,\n" +
      "shipped_at date and tracking code.\n\n" +
      "Use a LATERAL join to efficiently pick the latest shipment per seller.\n\n" +
      "Return exactly these columns in this order:\n- seller_name\n- order_id\n- shipped_at\n- tracking_code\n\n" +
      "Order by seller_name ASC, shipped_at DESC.",
    expectedColumns: ["seller_name", "order_id", "shipped_at", "tracking_code"],
    starterSql: "SELECT -- from sellers, LATERAL ...\n",
    solutionSql:
      `SELECT s.name AS seller_name, sh.order_id, sh.shipped_at, sh.tracking_code\n` +
      `FROM sellers s\n` +
      `CROSS JOIN LATERAL (\n` +
      `  SELECT sh.order_id, sh.shipped_at, sh.tracking_code\n` +
      `  FROM shipments sh\n` +
      `  JOIN orders o ON o.id = sh.order_id\n` +
      `  JOIN order_items oi ON oi.order_id = o.id\n` +
      `  WHERE oi.seller_id = s.id\n` +
      `  ORDER BY sh.shipped_at DESC\n` +
      `  LIMIT 1\n` +
      `) sh\n` +
      `ORDER BY s.name ASC, sh.shipped_at DESC;`,
    orderMatters: true,
    hints: [
      "Use CROSS JOIN LATERAL with a subquery that picks the latest shipment for each seller.",
      "Inside the LATERAL, join shipments → orders → order_items to filter by seller_id.",
      "ORDER BY shipped_at DESC LIMIT 1 inside the LATERAL gives the most recent shipment.",
    ],
  },
];

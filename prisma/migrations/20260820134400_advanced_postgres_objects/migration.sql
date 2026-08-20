-- Advanced Postgres objects that Prisma cannot model.
-- Created as a hand-written migration (prisma migrate dev --create-only, then edited).
-- These objects survive `pnpm db:reset` because reset replays all migrations.

-- ─── Generated column: order_items.line_total ────────────────────────────────
-- quantity * unit_price - discount_amount, stored for indexability.
ALTER TABLE "order_items"
  ADD COLUMN "line_total" numeric(14, 2) GENERATED ALWAYS AS
    ("quantity" * "unit_price" - "discount_amount") STORED;

-- ─── Generated tsvector column on products + GIN index ──────────────────────
-- Full-text search over name + description. Uses the 'english' config;
-- unaccent() is not immutable so it can't be in a generated column — use
-- unaccent() in queries instead, or wrap with a custom immutable wrapper.
ALTER TABLE "products"
  ADD COLUMN "search_tsv" tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", ''))
  ) STORED;

CREATE INDEX "idx_products_search_tsv" ON "products" USING gin ("search_tsv");

-- ─── GIN indexes on jsonb / array columns ───────────────────────────────────
CREATE INDEX "idx_products_attributes_gin" ON "products" USING gin ("attributes");
CREATE INDEX "idx_customers_tags_gin" ON "customers" USING gin ("tags");

-- ─── pg_trgm GIN index for similarity search ────────────────────────────────
CREATE INDEX "idx_products_name_trgm" ON "products" USING gin ("name" gin_trgm_ops);
CREATE INDEX "idx_customers_email_trgm" ON "customers" USING gin ("email" gin_trgm_ops);

-- ─── Partial index: non-cancelled orders by placed_at ───────────────────────
-- Makes EXPLAIN lessons meaningful (seq scan vs index scan).
CREATE INDEX "idx_orders_placed_at_active"
  ON "orders" ("placed_at")
  WHERE "status" <> 'CANCELLED';

-- ─── CHECK constraints not expressible in Prisma ────────────────────────────
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_discount_check" CHECK ("discount_amount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_installments_check" CHECK ("installments" >= 1);
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_cost_check" CHECK ("shipping_cost" >= 0);
ALTER TABLE "returns" ADD CONSTRAINT "returns_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "returns" ADD CONSTRAINT "returns_refund_check" CHECK ("refund_amount" >= 0);
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_value_check" CHECK ("value" > 0);
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_validity_check" CHECK ("valid_to" > "valid_from");
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_validity_check" CHECK ("valid_to" >= "valid_from");
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_rate_check" CHECK ("rate_to_usd" > 0);
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_on_hand_check" CHECK ("quantity_on_hand" >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_reserved_check" CHECK ("quantity_reserved" >= 0);
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_rating_check" CHECK ("rating" >= 0 AND "rating" <= 5);
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_commission_check" CHECK ("commission_rate" >= 0 AND "commission_rate" <= 1);
ALTER TABLE "employees" ADD CONSTRAINT "employees_salary_check" CHECK ("salary" >= 0);

-- ─── View: v_order_totals ───────────────────────────────────────────────────
-- Order-level revenue, item count, discount, payment status.
CREATE OR REPLACE VIEW "v_order_totals" AS
SELECT
  o."id" AS order_id,
  o."customer_id",
  o."placed_at",
  o."status",
  o."currency",
  COUNT(oi."id") AS item_count,
  COALESCE(SUM(oi."line_total"), 0) AS gross_revenue,
  COALESCE(SUM(oi."discount_amount"), 0) AS total_discount,
  COALESCE(SUM(oi."quantity"), 0) AS total_units
FROM "orders" o
LEFT JOIN "order_items" oi ON oi."order_id" = o."id"
GROUP BY o."id", o."customer_id", o."placed_at", o."status", o."currency";

-- ─── View: v_product_performance ────────────────────────────────────────────
-- Product revenue, units sold, avg rating, review count.
CREATE OR REPLACE VIEW "v_product_performance" AS
SELECT
  p."id" AS product_id,
  p."name" AS product_name,
  p."seller_id",
  COALESCE(SUM(oi."quantity"), 0) AS units_sold,
  COALESCE(SUM(oi."line_total"), 0) AS total_revenue,
  COALESCE(AVG(r."rating"), 0) AS avg_rating,
  COUNT(r."id") AS review_count
FROM "products" p
LEFT JOIN "product_variants" pv ON pv."product_id" = p."id"
LEFT JOIN "order_items" oi ON oi."variant_id" = pv."id"
LEFT JOIN "reviews" r ON r."product_id" = p."id"
GROUP BY p."id", p."name", p."seller_id";

-- ─── Materialized view: mv_monthly_seller_revenue ───────────────────────────
-- Month, seller, revenue, orders, avg order value.
CREATE MATERIALIZED VIEW "mv_monthly_seller_revenue" AS
SELECT
  date_trunc('month', o."placed_at") AS month,
  oi."seller_id",
  COUNT(DISTINCT o."id") AS orders_count,
  COALESCE(SUM(oi."line_total"), 0) AS revenue,
  COALESCE(AVG(oi."line_total"), 0) AS avg_order_value
FROM "orders" o
JOIN "order_items" oi ON oi."order_id" = o."id"
WHERE o."status" <> 'CANCELLED'
GROUP BY date_trunc('month', o."placed_at"), oi."seller_id"
WITH DATA;

-- Unique index so the materialized view can be concurrently refreshed.
CREATE UNIQUE INDEX "idx_mv_monthly_seller_revenue_month_seller"
  ON "mv_monthly_seller_revenue" ("month", "seller_id");

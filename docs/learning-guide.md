# SQL Learning Lab — Learning Guide

This guide walks you through the SQL concepts you can practice in the SQL Learning Lab, ordered from beginner to advanced. Each section references example queries available in the console's "Examples" dropdown.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Beginner: SELECT, WHERE, LIMIT](#beginner)
3. [Beginner: JOINs](#beginner-joins)
4. [Beginner: Aggregation (GROUP BY, COUNT, SUM)](#beginner-aggregation)
5. [Intermediate: HAVING, LEFT JOIN, Self-Join](#intermediate)
6. [Intermediate: Window Functions](#intermediate-window)
7. [Intermediate: CTEs (Common Table Expressions)](#intermediate-cte)
8. [Intermediate: JSONB and Arrays](#intermediate-jsonb)
9. [Intermediate: Date/Time Functions](#intermediate-date)
10. [Advanced: Recursive CTEs](#advanced-recursive)
11. [Advanced: Full-Text Search](#advanced-fts)
12. [Advanced: Range Joins](#advanced-range)
13. [Advanced: EXPLAIN and Query Plans](#advanced-explain)
14. [Advanced: Materialized Views](#advanced-mv)
15. [Writing PRQL](#writing-prql)
16. [Concept Checklist](#checklist)

---

## Getting Started

Open the query console at [http://localhost:3000](http://localhost:3000). The left sidebar shows the database schema — click any table to see its columns, primary keys (🔑), and foreign keys (🔗). Click the arrow next to a table to quickly run `SELECT * FROM <table> LIMIT 10`.

**Key rules:**
- All queries run in a **read-only transaction** — you cannot modify data.
- Only **one statement** at a time is allowed.
- Results are capped at 1,000 rows by default (configurable).
- Press **Ctrl/Cmd+Enter** to run the query in the pane that has focus (SQL or PRQL).
- Press **Ctrl/Cmd+E** in the PRQL pane to compile PRQL to SQL without running it.

---

## Beginner

### SELECT, WHERE, LIMIT

Start with the basics: retrieve rows, filter them, and limit results.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `SELECT *` | "SELECT all sellers" | Basic retrieval |
| `WHERE` | "WHERE: filter active sellers" | Filtering with conditions |
| `LIMIT` / `OFFSET` | "LIMIT & OFFSET: pagination" | Controlling result size |
| `COALESCE` | "COALESCE: handle NULL values" | Replacing NULLs with defaults |
| `CASE` | "CASE: classify customers by loyalty" | Conditional logic |
| `DISTINCT` | "DISTINCT: unique customer cities" | Removing duplicates |

**Try this:** Find all products priced under $50 that are published:
```sql
SELECT name, base_price FROM products
WHERE base_price < 50 AND is_published = true
ORDER BY base_price
LIMIT 20;
```

### Beginner: JOINs

JOINs combine rows from multiple tables based on a related column.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `INNER JOIN` | "INNER JOIN: orders with customers" | Matching rows from two tables |
| Multi-join | "Multi-join: full order details" | Joining 5 tables together |

**Try this:** Find the top 5 most ordered products:
```sql
SELECT p.name, SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN product_variants pv ON oi.variant_id = pv.id
JOIN products p ON pv.product_id = p.id
GROUP BY p.name
ORDER BY total_sold DESC
LIMIT 5;
```

### Beginner: Aggregation

Aggregate rows with functions like `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `GROUP BY` | "GROUP BY: count orders by status" | Grouping and counting |
| `COUNT` | Same as above | Counting rows per group |

**Try this:** Find the average order value per currency:
```sql
SELECT currency, AVG(total) AS avg_order_value
FROM (
  SELECT o.id, o.currency, SUM(oi.line_total) AS total
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  WHERE o.status <> 'CANCELLED'
  GROUP BY o.id, o.currency
) sub
GROUP BY currency
ORDER BY avg_order_value DESC;
```

---

## Intermediate

### HAVING, LEFT JOIN, Self-Join

| Concept | Example | What you learn |
|---------|---------|----------------|
| `HAVING` | "HAVING: top sellers by revenue" | Filtering after aggregation |
| `LEFT JOIN` | "LEFT JOIN: customers without orders" | Finding unmatched rows |
| Self-join | "Self-join: customer referral chains" | Joining a table to itself |
| `EXISTS` | "EXISTS: products with inventory" | Checking for related rows |
| `UNION` | "UNION: active sellers and suppliers" | Combining result sets |

### Intermediate: Window Functions

Window functions perform calculations across rows related to the current row, without collapsing them like `GROUP BY`.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `ROW_NUMBER()` | "Window functions: ROW_NUMBER" | Ranking within partitions |
| Rolling average | "Window functions: 7-day rolling revenue" | Moving aggregates |

**Try this:** Find the 2nd highest priced product per seller:
```sql
SELECT seller_id, name, base_price,
       RANK() OVER (PARTITION BY seller_id ORDER BY base_price DESC) AS price_rank
FROM products
WHERE is_published = true
QUALIFY price_rank = 2
LIMIT 10;
```

### Intermediate: CTEs

CTEs (Common Table Expressions) let you name a subquery for readability and reuse.

| Concept | Example | What you learn |
|---------|---------|----------------|
| CTE | "CTE: top product per category" | Named subqueries with `WITH` |

### Intermediate: JSONB and Arrays

PostgreSQL has rich support for JSON and array columns.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `JSONB` | "JSONB: query customer preferences" | `->`, `->>`, `@>` operators |
| Arrays | "Array operations: customer tags" | `@>`, `&&`, array literals |

### Intermediate: Date/Time Functions

| Concept | Example | What you learn |
|---------|---------|----------------|
| `DATE_TRUNC` | "DATE_TRUNC: monthly revenue trend" | Truncating to month/week/day |

---

## Advanced

### Advanced: Recursive CTEs

Recursive CTEs traverse hierarchical data (trees, graphs).

| Concept | Example | What you learn |
|---------|---------|----------------|
| Category tree | "Recursive CTE: category tree" | Traversing a parent-child tree |
| Employee chain | "Recursive CTE: employee management chain" | Building a path string |

### Advanced: Full-Text Search

PostgreSQL's full-text search uses `tsvector`, `tsquery`, and `ts_rank`.

| Concept | Example | What you learn |
|---------|---------|----------------|
| `to_tsvector` | "Full-text search: search products" | Text search with ranking |

### Advanced: Range Joins

Join tables where the match condition is a range, not equality.

| Concept | Example | What you learn |
|---------|---------|----------------|
| Date range | "Range join: orders with exchange rates" | `>=` and `<` join conditions |

### Advanced: EXPLAIN and Query Plans

| Concept | Example | What you learn |
|---------|---------|----------------|
| `EXPLAIN ANALYZE` | "EXPLAIN ANALYZE: query plan" | Reading query execution plans |

### Advanced: Materialized Views

| Concept | Example | What you learn |
|---------|---------|----------------|
| MV query | "Materialized view: monthly seller revenue" | Querying pre-computed aggregations |

---

## Writing PRQL

The console has two editors side by side: **PRQL** on the left, **SQL** on the right.
PRQL is a pipelined language that compiles to SQL — writing the same query both ways is
one of the fastest ways to understand what SQL is actually doing.

### Try it

1. The PRQL pane starts with `from sellers | take 10`. Click into it and press
   **Ctrl/Cmd+Enter** to run it. The SQL pane fills with the compiled `SELECT … LIMIT 10`
   and the results appear below.
2. Press **Ctrl/Cmd+E** (or the **Transform** button) to compile the PRQL into the SQL
   pane *without* running it — handy for seeing what a pipeline produces.
3. Write a filter:

```prql
from sellers
filter rating > 4.5 && is_active
select { name, country, rating }
sort {-rating}
take 10
```

Press Transform and read the SQL it produced. Then run it from either pane.

### What to know

- **Run** executes whichever pane has focus. The focused pane is outlined.
- Running PRQL back-fills the SQL pane with the compiled query, so you always see what
  actually ran.
- PRQL compile errors show the reason, hints, and the `line:column` of the failure —
  they never reach Postgres.
- Only **PRQL → SQL** exists. There is no SQL → PRQL conversion (the PRQL project lists
  it as a long-term goal with no implementation yet).

### Learning more

- [The PRQL Book](https://prql-lang.org/book/) — the official language tutorial and reference
- [PRQL Playground](https://prql-lang.org/playground/) — try PRQL in the browser

---

## Checklist

Use this checklist to track your progress. Each item links to an example in the console.

### Beginner
- [ ] `SELECT` with specific columns
- [ ] `WHERE` with `AND`/`OR`/`NOT`
- [ ] `ORDER BY` ASC/DESC
- [ ] `LIMIT` and `OFFSET`
- [ ] `INNER JOIN` two tables
- [ ] `GROUP BY` with `COUNT`/`SUM`/`AVG`
- [ ] `CASE` expression
- [ ] `COALESCE` for NULLs
- [ ] `DISTINCT`

### Intermediate
- [ ] `HAVING` (filter after GROUP BY)
- [ ] `LEFT JOIN` (find unmatched rows)
- [ ] Self-join (table to itself)
- [ ] `EXISTS` / `NOT EXISTS`
- [ ] `UNION` / `UNION ALL`
- [ ] Window functions: `ROW_NUMBER()`, `RANK()`
- [ ] CTE with `WITH`
- [ ] JSONB operators: `->`, `->>`, `@>`
- [ ] Array operators: `@>`, `&&`
- [ ] `DATE_TRUNC` for time series

### Advanced
- [ ] Recursive CTE (`WITH RECURSIVE`)
- [ ] Full-text search (`to_tsvector`, `plainto_tsquery`)
- [ ] Range join (non-equi join on date ranges)
- [ ] `EXPLAIN ANALYZE` to read query plans
- [ ] Query a materialized view
- [ ] Correlated subquery
- [ ] Rolling average with window functions
- [ ] Funnel analysis with conversion rates

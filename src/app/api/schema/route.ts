/**
 * GET /api/schema — introspected schema for the UI's schema explorer.
 *
 * Returns tables, views, materialized views with columns, primary keys, foreign
 * keys, enum types, and approximate row counts. Uses the read-only pool.
 *
 * Opts out of prerendering/caching (hits the database at request time).
 */
import { readonlyPool } from "#/lib/db/readonly";
import type {
  SchemaColumn,
  SchemaEnum,
  SchemaForeignKey,
  SchemaIntrospection,
  SchemaTable,
} from "#/lib/sql/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const client = await readonlyPool.connect();
  try {
    // Tables + views + materialized views
    const tablesResult = await client.query<{
      table_name: string;
      table_type: string;
    }>(`
      SELECT
        c.relname AS table_name,
        CASE
          WHEN c.relkind = 'r' THEN 'table'
          WHEN c.relkind = 'v' THEN 'view'
          WHEN c.relkind = 'm' THEN 'materialized_view'
        END AS table_type
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'v', 'm')
        AND c.relname != '_prisma_migrations'
      ORDER BY c.relname
    `);

    const tables: SchemaTable[] = [];

    for (const { table_name, table_type } of tablesResult.rows) {
      // Columns
      const colsResult = await client.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
        [table_name],
      );

      // Primary keys
      const pkResult = await client.query<{ column_name: string }>(
        `
        SELECT a.attname AS column_name
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
      `,
        [`public.${table_name}`],
      );
      const pkCols = new Set(pkResult.rows.map((r) => r.column_name));

      // Foreign keys
      const fkResult = await client.query<{
        column_name: string;
        references_table: string;
        references_column: string;
      }>(
        `
        SELECT
          a.attname AS column_name,
          c.relname AS references_table,
          af.attname AS references_column
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.confrelid
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
        JOIN pg_attribute af ON af.attrelid = con.confrelid AND af.attnum = con.confkey[1]
        WHERE con.contype = 'f' AND con.conrelid = $1::regclass
      `,
        [`public.${table_name}`],
      );

      const columns: SchemaColumn[] = colsResult.rows.map((col) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === "YES",
        defaultValue: col.column_default,
        isPrimaryKey: pkCols.has(col.column_name),
      }));

      const foreignKeys: SchemaForeignKey[] = fkResult.rows.map((fk) => ({
        column: fk.column_name,
        referencesTable: fk.references_table,
        referencesColumn: fk.references_column,
      }));

      // Approximate row count
      const countResult = await client.query<{ count: string }>(
        `
        SELECT reltuples::bigint::text AS count FROM pg_class WHERE relname = $1
      `,
        [table_name],
      );
      const rowCount = Number(countResult.rows[0]?.count ?? 0);

      tables.push({
        name: table_name,
        kind: table_type as SchemaTable["kind"],
        columns,
        foreignKeys,
        rowCount,
      });
    }

    // Enums
    const enumsResult = await client.query<{
      typname: string;
      enumlabel: string;
    }>(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `);

    const enumMap = new Map<string, string[]>();
    for (const row of enumsResult.rows) {
      const values = enumMap.get(row.typname) ?? [];
      values.push(row.enumlabel);
      enumMap.set(row.typname, values);
    }

    const enums: SchemaEnum[] = Array.from(enumMap.entries())
      .map(([name, values]) => ({ name, values }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const schema: SchemaIntrospection = { tables, enums };
    return Response.json(schema);
  } finally {
    client.release();
  }
}

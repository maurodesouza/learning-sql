"use client";

import { observer } from "mobx-react-lite";
import { Fragment, type ReactNode } from "react";
import type { SchemaTable } from "#/lib/sql/types";
import { useSchemaStore } from "../context/schema-explorer-context";

export interface TableListProps {
  render: (table: SchemaTable) => ReactNode;
  empty?: ReactNode;
}

export const TableList = observer(function TableList({
  render,
  empty,
}: TableListProps) {
  const store = useSchemaStore();
  const tables = store.filteredTables;

  if (tables.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <div className="p-2">
      {tables.map((table) => (
        <Fragment key={table.name}>{render(table)}</Fragment>
      ))}
    </div>
  );
});

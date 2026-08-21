"use client";

import { observer } from "mobx-react-lite";
import { Fragment, type ReactNode } from "react";
import type { SchemaColumn } from "#/lib/sql/types";
import { useTableItem } from "../context";
import { Provider as ColumnProvider } from "./provider";

export interface ListProps {
  render: (column: SchemaColumn) => ReactNode;
  empty?: ReactNode;
}

export const List = observer(function List({ render, empty }: ListProps) {
  const table = useTableItem();
  const columns = table.columns;

  if (columns.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <>
      {columns.map((col) => (
        <Fragment key={col.name}>
          <ColumnProvider column={col}>{render(col)}</ColumnProvider>
        </Fragment>
      ))}
    </>
  );
});

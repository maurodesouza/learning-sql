import { createContext, useContext } from "react";
import type { SchemaColumn } from "#/lib/sql/types";

export const ColumnContext = createContext<SchemaColumn | null>(null);

export function useColumn(): SchemaColumn {
  const column = useContext(ColumnContext);
  if (!column) {
    throw new Error("useColumn must be used within Column.Provider");
  }
  return column;
}

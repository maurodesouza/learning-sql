import { createContext, useContext } from "react";
import type { SchemaTable } from "#/lib/sql/types";

export const TableItemContext = createContext<SchemaTable | null>(null);

export function useTableItem(): SchemaTable {
  const table = useContext(TableItemContext);
  if (!table) {
    throw new Error("useTableItem must be used within TableItem.Provider");
  }
  return table;
}

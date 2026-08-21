"use client";

import type { SchemaTable } from "#/lib/sql/types";
import { TableItemContext } from "./context";

export interface ProviderProps {
  table: SchemaTable;
  children: React.ReactNode;
}

export function Provider({ table, children }: ProviderProps) {
  return (
    <TableItemContext.Provider value={table}>
      {children}
    </TableItemContext.Provider>
  );
}

"use client";

import type { SchemaColumn } from "#/lib/sql/types";
import { ColumnContext } from "./context";

export interface ProviderProps {
  column: SchemaColumn;
  children: React.ReactNode;
}

export function Provider({ column, children }: ProviderProps) {
  return (
    <ColumnContext.Provider value={column}>{children}</ColumnContext.Provider>
  );
}

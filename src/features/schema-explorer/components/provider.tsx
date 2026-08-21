"use client";

import { SchemaExplorerContext } from "../context/schema-explorer-context";
import { schemaStore } from "../stores/schema-store";

export interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <SchemaExplorerContext.Provider value={schemaStore}>
      {children}
    </SchemaExplorerContext.Provider>
  );
}

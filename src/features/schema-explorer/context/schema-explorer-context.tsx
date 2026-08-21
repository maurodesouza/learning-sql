"use client";

import { createContext, useContext } from "react";
import type { SchemaStore } from "../stores/schema-store";

export const SchemaExplorerContext = createContext<SchemaStore | null>(null);

export function useSchemaStore(): SchemaStore {
  const store = useContext(SchemaExplorerContext);
  if (!store) {
    throw new Error(
      "useSchemaStore must be used within SchemaExplorer.Provider",
    );
  }
  return store;
}

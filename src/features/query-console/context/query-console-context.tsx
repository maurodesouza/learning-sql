"use client";

import { createContext, useContext } from "react";
import type { QueryConsoleStore } from "../stores/query-console-store";

export const QueryConsoleContext = createContext<QueryConsoleStore | null>(
  null,
);

export function useQueryConsoleStore(): QueryConsoleStore {
  const store = useContext(QueryConsoleContext);
  if (!store) {
    throw new Error(
      "useQueryConsoleStore must be used within a QueryConsoleHandle",
    );
  }
  return store;
}

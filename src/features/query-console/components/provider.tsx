"use client";

import { useMemo } from "react";
import { QueryConsoleContext } from "../context/query-console-context";
import { QueryConsoleStore } from "../stores/query-console-store";

export interface ProviderProps {
  instanceId: string;
  children: React.ReactNode;
}

export function Provider({ instanceId, children }: ProviderProps) {
  const store = useMemo(() => new QueryConsoleStore(instanceId), [instanceId]);

  return (
    <QueryConsoleContext.Provider value={store}>
      {children}
    </QueryConsoleContext.Provider>
  );
}

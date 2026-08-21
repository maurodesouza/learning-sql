"use client";

import { useMemo } from "react";
import { WorkspaceContext } from "../context/workspace-context";
import { WorkspaceStore } from "../stores/workspace-store";

export interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  const store = useMemo(() => new WorkspaceStore(), []);

  return (
    <WorkspaceContext.Provider value={store}>
      {children}
    </WorkspaceContext.Provider>
  );
}

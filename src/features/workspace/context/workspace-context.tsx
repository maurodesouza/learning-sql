"use client";

import { createContext, useContext } from "react";
import type { WorkspaceStore } from "../stores/workspace-store";

export const WorkspaceContext = createContext<WorkspaceStore | null>(null);

export function useWorkspaceStore(): WorkspaceStore {
  const store = useContext(WorkspaceContext);
  if (!store) {
    throw new Error("useWorkspaceStore must be used within Workspace.Provider");
  }
  return store;
}

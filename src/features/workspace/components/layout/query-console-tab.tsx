"use client";

import { QueryConsole } from "#/features/query-console";

export interface QueryConsoleTabProps {
  instanceId: string;
  children: React.ReactNode;
}

export function QueryConsoleTab({
  instanceId,
  children,
}: QueryConsoleTabProps) {
  return (
    <QueryConsole.Provider instanceId={instanceId}>
      <QueryConsole.Handles />
      {children}
    </QueryConsole.Provider>
  );
}

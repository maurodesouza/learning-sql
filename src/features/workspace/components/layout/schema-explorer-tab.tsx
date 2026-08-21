"use client";

import { SchemaExplorer } from "#/features/schema-explorer";

export interface SchemaExplorerTabProps {
  children: React.ReactNode;
}

export function SchemaExplorerTab({ children }: SchemaExplorerTabProps) {
  return (
    <SchemaExplorer.Provider>
      <SchemaExplorer.Handles />
      <SchemaExplorer.Container>{children}</SchemaExplorer.Container>
    </SchemaExplorer.Provider>
  );
}

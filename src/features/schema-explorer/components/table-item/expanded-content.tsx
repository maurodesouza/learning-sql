"use client";

import { observer } from "mobx-react-lite";
import { useSchemaStore } from "../../context/schema-explorer-context";
import { useTableItem } from "./context";

export interface ExpandedContentProps {
  children: React.ReactNode;
}

export const ExpandedContent = observer(function ExpandedContent({
  children,
}: ExpandedContentProps) {
  const store = useSchemaStore();
  const table = useTableItem();

  if (!store.expandedTables.has(table.name)) return null;

  return <div className="ml-5 border-l pl-2">{children}</div>;
});

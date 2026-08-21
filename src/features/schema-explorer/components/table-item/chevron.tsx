"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useSchemaStore } from "../../context/schema-explorer-context";
import { useTableItem } from "./context";

export const Chevron = observer(function Chevron() {
  const store = useSchemaStore();
  const table = useTableItem();
  const expanded = store.expandedTables.has(table.name);

  return expanded ? (
    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  ) : (
    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
  );
});

"use client";

import { ChevronRight } from "lucide-react";
import { actions } from "#/lib/command";
import { useTableItem } from "./context";

export function CopyButton() {
  const table = useTableItem();

  return (
    <button
      type="button"
      onClick={() => actions.schema.table.copySelect(table.name)}
      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
      title={`Copy SELECT * FROM ${table.name} LIMIT 10`}
    >
      <ChevronRight className="h-3 w-3" />
    </button>
  );
}

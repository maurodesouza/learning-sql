"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { actions } from "#/lib/command";
import { useSchemaStore } from "../../context/schema-explorer-context";

export const ToggleButton = observer(function ToggleButton() {
  const store = useSchemaStore();
  const expanded = store.enumsExpanded;
  const count = store.enums.length;

  return (
    <button
      type="button"
      onClick={() => actions.schema.enums.toggle()}
      className="flex w-full items-center gap-1.5 p-2 text-sm hover:bg-accent"
    >
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5" />
      )}
      <span className="font-medium text-xs">Enum Types ({count})</span>
    </button>
  );
});

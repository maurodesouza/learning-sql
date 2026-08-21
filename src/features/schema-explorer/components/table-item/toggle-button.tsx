"use client";

import { actions } from "#/lib/command";
import { useTableItem } from "./context";

export interface ToggleButtonProps {
  children: React.ReactNode;
}

export function ToggleButton({ children }: ToggleButtonProps) {
  const table = useTableItem();

  return (
    <button
      type="button"
      onClick={() => actions.schema.table.toggle(table.name)}
      className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-sm hover:bg-accent"
    >
      {children}
    </button>
  );
}

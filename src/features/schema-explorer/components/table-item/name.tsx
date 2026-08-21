"use client";

import { useTableItem } from "./context";

export function Name() {
  const table = useTableItem();
  return <span className="truncate font-mono text-xs">{table.name}</span>;
}

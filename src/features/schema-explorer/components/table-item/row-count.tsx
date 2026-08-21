"use client";

import { Badge } from "#/components/atoms/badge";
import { useTableItem } from "./context";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function RowCount() {
  const table = useTableItem();
  return (
    <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
      {table.rowCount > 0 ? formatCount(table.rowCount) : "0"}
    </Badge>
  );
}

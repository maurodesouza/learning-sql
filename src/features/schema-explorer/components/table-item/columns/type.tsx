"use client";

import { useColumn } from "./context";

export function Type() {
  const column = useColumn();
  return (
    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
      {column.type}
    </span>
  );
}

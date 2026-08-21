"use client";

import { cn } from "#/lib/utils";
import { useColumn } from "./context";

export function Name() {
  const column = useColumn();
  return (
    <span
      className={cn(
        "font-mono",
        column.nullable ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {column.name}
    </span>
  );
}

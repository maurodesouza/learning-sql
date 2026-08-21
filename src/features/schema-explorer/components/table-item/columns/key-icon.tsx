"use client";

import { Key, Link2 } from "lucide-react";
import { useTableItem } from "../context";
import { useColumn } from "./context";

export function KeyIcon() {
  const table = useTableItem();
  const column = useColumn();

  if (column.isPrimaryKey) {
    return <Key className="h-3 w-3 shrink-0 text-amber-500" />;
  }
  if (table.foreignKeys.some((fk) => fk.column === column.name)) {
    return <Link2 className="h-3 w-3 shrink-0 text-blue-500" />;
  }
  return <span className="w-3 shrink-0" />;
}

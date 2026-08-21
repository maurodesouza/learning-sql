"use client";

import { observer } from "mobx-react-lite";
import { Badge } from "#/components/atoms/badge";
import { useQueryConsoleStore } from "../../context/query-console-context";

export const Header = observer(function Header() {
  const store = useQueryConsoleStore();
  const result = store.result;

  if (!result || "error" in result) return null;

  return (
    <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs text-muted-foreground">
      <span>{result.rowCount} rows</span>
      {result.truncated && (
        <Badge variant="outline" className="text-[10px]">
          Truncated
        </Badge>
      )}
      <span className="ml-auto font-mono">{result.durationMs}ms</span>
    </div>
  );
});

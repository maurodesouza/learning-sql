"use client";

import { observer } from "mobx-react-lite";
import { Badge } from "#/components/atoms/badge";
import type { QuerySuccess } from "#/lib/sql/types";

interface ResultsGridHeaderProps {
  result: QuerySuccess;
}

export const ResultsGridHeader = observer(function ResultsGridHeader({
  result,
}: ResultsGridHeaderProps) {
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

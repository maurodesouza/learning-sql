"use client";

import { useMemo } from "react";
import { type Column, DataGrid } from "react-data-grid";
import { Badge } from "#/components/ui/badge";
import type { QuerySuccess } from "#/lib/sql/types";

interface ResultsGridProps {
  result: QuerySuccess;
}

function formatCell(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface Row {
  _id: string;
  [key: string]: string;
}

export function ResultsGrid({ result }: ResultsGridProps) {
  const columns = useMemo(
    () =>
      result.columns.map(
        (col): Column<Row> => ({
          key: col.name,
          name: col.name,
          resizable: true,
          sortable: true,
          width: 160,
          minWidth: 80,
          renderHeaderCell: () => (
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-xs font-medium">{col.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {col.dataType}
              </span>
            </div>
          ),
        }),
      ),
    [result.columns],
  );

  const rows = useMemo(
    () =>
      result.rows.map((row, i): Row => {
        const obj: Record<string, string> = { _id: String(i) };
        for (let j = 0; j < result.columns.length; j++) {
          const col = result.columns[j];
          if (col) {
            obj[col.name] = formatCell(row[j]);
          }
        }
        return obj as Row;
      }),
    [result.rows, result.columns],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs text-muted-foreground">
        <span>{result.rowCount} rows</span>
        {result.truncated && (
          <Badge variant="outline" className="text-[10px]">
            Truncated
          </Badge>
        )}
        <span className="ml-auto font-mono">{result.durationMs}ms</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {rows.length > 0 ? (
          <DataGrid
            columns={columns}
            rows={rows}
            className="rdg-light h-full fill-grid"
            rowKeyGetter={(row: Row) => row._id}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No rows returned
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "#/lib/utils";

export interface ExpectedResultTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  maxRows?: number;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ExpectedResultTable({
  columns,
  rows,
  maxRows = 50,
}: ExpectedResultTableProps) {
  const displayed = rows.slice(0, maxRows);
  const truncated = rows.length > maxRows;

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-2 py-1 text-left font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayed.map((row, i) => (
            <tr
              key={JSON.stringify(row)}
              className={cn("border-t", i % 2 === 1 && "bg-muted/20")}
            >
              {columns.map((col) => (
                <td key={col} className="px-2 py-1 font-mono">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {truncated && (
        <div className="border-t px-2 py-1 text-xs text-muted-foreground">
          Showing {maxRows} of {rows.length} rows.
        </div>
      )}
    </div>
  );
}

"use client";

import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { type Column, DataGrid } from "react-data-grid";
import type { QuerySuccess } from "#/lib/sql/types";
import { useQueryConsoleStore } from "../../context/query-console-context";
import { ResultsGridHeader } from "../molecules/results-grid-header";

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

export const ResultsGrid = observer(function ResultsGrid() {
  const store = useQueryConsoleStore();
  const result = store.result;

  const successResult: QuerySuccess | null =
    result && !("error" in result) ? result : null;

  const columns = useMemo(
    () =>
      successResult
        ? successResult.columns.map(
            (col): Column<Row> => ({
              key: col.name,
              name: col.name,
              resizable: true,
              sortable: true,
              width: 160,
              minWidth: 80,
              renderHeaderCell: () => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-medium">
                    {col.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {col.dataType}
                  </span>
                </div>
              ),
            }),
          )
        : [],
    [successResult],
  );

  const rows = useMemo(
    () =>
      successResult
        ? successResult.rows.map((row, i): Row => {
            const obj: Record<string, string> = { _id: String(i) };
            for (let j = 0; j < successResult.columns.length; j++) {
              const col = successResult.columns[j];
              if (col) {
                obj[col.name] = formatCell(row[j]);
              }
            }
            return obj as Row;
          })
        : [],
    [successResult],
  );

  if (!successResult) return null;

  return (
    <div className="flex h-full flex-col">
      <ResultsGridHeader result={successResult} />
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
});

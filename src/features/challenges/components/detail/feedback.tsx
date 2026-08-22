"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { valuesEqual } from "#/lib/challenges/compare";
import type { CheckResult } from "#/lib/challenges/types";
import { cn } from "#/lib/utils";

function formatMismatchCell(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export const Feedback = observer(function Feedback() {
  const store = useChallengesStore();
  const result = store.checkResult;
  if (!result) return null;

  if (result.correct) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Correct! Your query matches the expected result.</span>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex flex-col gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Query Error</span>
        </div>
        <pre className="whitespace-pre-wrap pl-6 text-xs">{result.error}</pre>
      </div>
    );
  }

  // Mismatch feedback.
  const colMismatch =
    result.expectedColumns.length !== result.userColumns.length ||
    result.expectedColumns.some(
      (c, i) => c.toLowerCase() !== result.userColumns[i]?.toLowerCase(),
    );

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700">
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Not quite right</span>
      </div>
      {colMismatch && (
        <div className="pl-6 text-xs">
          <p>
            Expected columns:{" "}
            <code className="font-mono">
              {result.expectedColumns.join(", ")}
            </code>
          </p>
          <p>
            Your columns:{" "}
            <code
              className={cn(
                "font-mono",
                result.userColumns.length === 0 && "text-muted-foreground",
              )}
            >
              {result.userColumns.length > 0
                ? result.userColumns.join(", ")
                : "(none)"}
            </code>
          </p>
        </div>
      )}
      {!colMismatch && result.userRowCount !== result.expectedRowCount && (
        <div className="pl-6 text-xs">
          <p>Column names match but row count differs.</p>
          <p>
            Expected {result.expectedRowCount} rows, got {result.userRowCount}.
          </p>
        </div>
      )}
      {!colMismatch && result.userRowCount === result.expectedRowCount && (
        <div className="pl-6 text-xs">
          <p>Columns and row count match, but some values differ.</p>
          {result.firstMismatch && (
            <>
              <p>
                First difference at row {result.firstMismatch.rowIndex + 1}
                {!result.orderMatters && " (after sorting)"}.<br />
                The row that differs is shown below.
              </p>
              <MismatchRowTable result={result} />
            </>
          )}
        </div>
      )}
    </div>
  );
});

function MismatchRowTable({ result }: { result: CheckResult }) {
  const mismatch = result.firstMismatch;
  if (!mismatch) return null;
  const columns = result.expectedColumns;

  return (
    <div className="mt-2 overflow-auto rounded-md border border-amber-500/20">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-20 px-2 py-1 text-left font-medium text-muted-foreground">
              row
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1 text-left font-mono font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t bg-green-500/5">
            <td className="px-2 py-1 font-medium text-green-700">expected</td>
            {columns.map((col, i) => {
              const value = mismatch.expected[i];
              const actual = mismatch.actual[i];
              const differs = !valuesEqual(value, actual);
              return (
                <td
                  key={col}
                  className={cn(
                    "px-2 py-1 font-mono",
                    differs && "bg-green-500/15 font-semibold text-green-800",
                  )}
                >
                  {formatMismatchCell(value)}
                </td>
              );
            })}
          </tr>
          <tr className="border-t bg-red-500/5">
            <td className="px-2 py-1 font-medium text-red-700">yours</td>
            {columns.map((col, i) => {
              const value = mismatch.actual[i];
              const expected = mismatch.expected[i];
              const differs = !valuesEqual(value, expected);
              return (
                <td
                  key={col}
                  className={cn(
                    "px-2 py-1 font-mono",
                    differs && "bg-red-500/15 font-semibold text-red-800",
                  )}
                >
                  {formatMismatchCell(value)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

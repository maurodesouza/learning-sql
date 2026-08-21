"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { cn } from "#/lib/utils";

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

  // Mismatch feedback — don't leak expected row values.
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
            <p>First difference at row {result.firstMismatch.rowIndex + 1}.</p>
          )}
        </div>
      )}
    </div>
  );
});

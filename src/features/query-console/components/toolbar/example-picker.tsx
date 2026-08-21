"use client";

import { BookOpen, ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { actions } from "#/lib/command";
import {
  EXAMPLE_QUERIES,
  type ExampleDifficulty,
  type ExampleQuery,
} from "#/lib/sql/examples";
import { cn } from "#/lib/utils";
import { useQueryConsoleStore } from "../../context/query-console-context";

const DIFFICULTY_COLORS: Record<ExampleDifficulty, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  advanced:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export const ExamplePicker = observer(function ExamplePicker() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
      >
        <BookOpen className="h-4 w-4" />
        Examples
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-96 w-80 overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {EXAMPLE_QUERIES.map((query: ExampleQuery) => (
              <button
                key={query.id}
                type="button"
                onClick={() => {
                  actions.queryConsole.editor.sql(
                    { template: query.sql, activatePanel: true },
                    { instanceId },
                  );
                  setOpen(false);
                }}
                className="flex w-full flex-col gap-1 rounded p-2 text-left text-sm hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{query.title}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      DIFFICULTY_COLORS[query.difficulty],
                    )}
                  >
                    {query.difficulty}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {query.description}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

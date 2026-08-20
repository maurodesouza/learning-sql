"use client";

import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Toaster } from "sonner";
import { AppHeader } from "#/components/organisms/app-header";
import { SchemaExplorer } from "#/components/organisms/schema-explorer";
import { useQueryConsoleStore } from "../../context/query-console-context";
import { EditorToolbar } from "../molecules/editor-toolbar";
import { EditorSplit } from "../organisms/editor-split";
import { ErrorDisplay } from "../organisms/error-display";
import { ResultsGrid } from "../organisms/results-grid";

export const QueryConsoleTemplate = observer(function QueryConsoleTemplate() {
  const store = useQueryConsoleStore();

  return (
    <div className="flex h-screen flex-col">
      <Toaster richColors position="bottom-right" />
      <AppHeader />

      {/* Main layout: sidebar + editor + results */}
      <div className="flex flex-1 overflow-hidden">
        {/* Schema sidebar */}
        <aside className="w-64 shrink-0 border-r">
          <SchemaExplorer />
        </aside>

        {/* Editor + Results */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <EditorToolbar />

          {/* Dual-pane editors */}
          <div className="h-72 shrink-0 overflow-hidden border-b">
            <EditorSplit />
          </div>

          {/* Results panel */}
          <div className="flex-1 overflow-hidden">
            {store.loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : store.hasResult ? (
              store.isSuccess ? (
                <ResultsGrid />
              ) : (
                <ErrorDisplay />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Run a query to see results
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
});

"use client";

import { Loader2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTransition } from "#/hooks/use-transition";
import { useQueryConsoleStore } from "../../context/query-console-context";
import { EditorToolbar } from "../molecules/editor-toolbar";
import { EditorSplit } from "../organisms/editor-split";
import { ErrorDisplay } from "../organisms/error-display";
import { ResultsGrid } from "../organisms/results-grid";

/**
 * Chrome-less Query Console panel: editor toolbar + dual-pane editors +
 * results. Designed to be mounted inside a flexlayout tab (or any sized
 * parent) and fill it entirely. No global chrome (AppHeader/Toaster/sidebar)
 * — those live at the page/workspace level.
 */
export const QueryConsolePanel = observer(function QueryConsolePanel() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;
  const loading = useTransition(["queryConsole.run", instanceId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditorToolbar />

      {/* Dual-pane editors */}
      <div className="h-72 shrink-0 overflow-hidden border-b">
        <EditorSplit />
      </div>

      {/* Results panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
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
    </div>
  );
});

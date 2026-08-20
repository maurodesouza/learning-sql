"use client";

/**
 * Dual-pane editor: PRQL on the left, SQL on the right.
 *
 * Composes two CodeEditor organisms and PaneHeader molecules. Reads activePane
 * from the store and dispatches via actions. No prop drilling.
 */
import { ArrowRight, Loader2, Wand2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";
import type { QueryLanguage } from "#/lib/sql/types";
import { useQueryConsoleStore } from "../../context/query-console-context";
import { PaneHeader } from "../molecules/pane-header";
import { CodeEditor } from "./code-editor";

export const EditorSplit = observer(function EditorSplit() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <Pane
        language="prql"
        active={store.activePane === "prql"}
        header={
          <PaneHeader
            label="PRQL"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  actions.queryConsole.transform(undefined, { instanceId })
                }
                disabled={
                  store.transforming || store.loading || !store.prql.trim()
                }
                className="h-6 gap-1 px-2 text-xs"
              >
                {store.transforming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Transform
                <ArrowRight className="h-3 w-3" />
              </Button>
            }
            shortcut="Ctrl/Cmd+E"
          />
        }
      >
        <CodeEditor language="prql" placeholder="from sellers | take 10" />
      </Pane>

      <div className="w-px shrink-0 bg-border" />

      <Pane
        language="sql"
        active={store.activePane === "sql"}
        header={<PaneHeader label="SQL" shortcut="Ctrl/Cmd+Enter" />}
      >
        <CodeEditor
          language="sql"
          placeholder="SELECT * FROM sellers LIMIT 10;"
        />
      </Pane>
    </div>
  );
});

function Pane({
  active,
  header,
  children,
}: {
  language: QueryLanguage;
  active: boolean;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-1 flex-col overflow-hidden border-2 ${
        active ? "border-primary" : "border-transparent"
      }`}
    >
      {header}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

"use client";

/**
 * Dual-pane editor: PRQL on the left, SQL on the right.
 *
 * Owns the two `CodeEditor` instances, the per-pane headers, the Transform
 * button, and focus tracking. It does NOT own the data flow — `QueryConsole`
 * passes the source text, the schema, and the handlers in, and receives the
 * active pane back through `onActivePaneChange` so Run can target the right one.
 *
 * There is deliberately no SQL -> PRQL control anywhere here. `prqlc` has no
 * such path and it is only a long-term roadmap item; offering a disabled
 * affordance would imply otherwise.
 */
import { ArrowRight, Loader2, Wand2 } from "lucide-react";
import { useCallback } from "react";
import { Button } from "#/components/atoms/button";
import { CodeEditor } from "#/components/code-editor";
import type { QueryLanguage, SchemaIntrospection } from "#/lib/sql/types";

interface EditorSplitProps {
  prql: string;
  sql: string;
  onPrqlChange: (value: string) => void;
  onSqlChange: (value: string) => void;
  onRun: () => void;
  onTransform: () => void;
  onActivePaneChange: (pane: QueryLanguage) => void;
  activePane: QueryLanguage;
  schema: SchemaIntrospection | null;
  loading: boolean;
  transforming: boolean;
}

export function EditorSplit({
  prql,
  sql,
  onPrqlChange,
  onSqlChange,
  onRun,
  onTransform,
  onActivePaneChange,
  activePane,
  schema,
  loading,
  transforming,
}: EditorSplitProps) {
  const focusPrql = useCallback(
    () => onActivePaneChange("prql"),
    [onActivePaneChange],
  );
  const focusSql = useCallback(
    () => onActivePaneChange("sql"),
    [onActivePaneChange],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <Pane
        language="prql"
        active={activePane === "prql"}
        header={
          <PaneHeader
            label="PRQL"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={onTransform}
                disabled={transforming || loading || !prql.trim()}
                className="h-6 gap-1 px-2 text-xs"
              >
                {transforming ? (
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
        <CodeEditor
          language="prql"
          value={prql}
          onChange={onPrqlChange}
          onRun={onRun}
          onTransform={onTransform}
          onFocus={focusPrql}
          disabled={loading}
          placeholder="from sellers | take 10"
        />
      </Pane>

      <div className="w-px shrink-0 bg-border" />

      <Pane
        language="sql"
        active={activePane === "sql"}
        header={<PaneHeader label="SQL" shortcut="Ctrl/Cmd+Enter" />}
      >
        <CodeEditor
          language="sql"
          value={sql}
          onChange={onSqlChange}
          onRun={onRun}
          onFocus={focusSql}
          schema={schema}
          disabled={loading}
          placeholder="SELECT * FROM sellers LIMIT 10;"
        />
      </Pane>
    </div>
  );
}

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

function PaneHeader({
  label,
  action,
  shortcut,
}: {
  label: string;
  action?: React.ReactNode;
  shortcut: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-muted/40 px-3 py-1">
      <span className="text-xs font-semibold tracking-wide">{label}</span>
      {action}
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
        {shortcut}
      </span>
    </div>
  );
}

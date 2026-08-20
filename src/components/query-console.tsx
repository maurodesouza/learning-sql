"use client";

import { Database, Download, Loader2, Play, RotateCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { EditorSplit } from "#/components/editor-split";
import { ErrorDisplay } from "#/components/error-display";
import { ExamplePicker } from "#/components/example-picker";
import { ResultsGrid } from "#/components/results-grid";
import { SchemaExplorer } from "#/components/schema-explorer";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
  compilePrql,
  isPrqlCompileError,
  isPrqlCompileSuccess,
} from "#/lib/prql/client";
import {
  fetchSchema,
  isQueryError,
  isQuerySuccess,
  runQuery,
} from "#/lib/sql/client";
import type { ExampleQuery } from "#/lib/sql/examples";
import type {
  QueryLanguage,
  QueryResponse,
  SchemaIntrospection,
} from "#/lib/sql/types";

const DEFAULT_SQL = "SELECT * FROM sellers LIMIT 10;";
const DEFAULT_PRQL = "from sellers | take 10";

interface HistoryEntry {
  language: QueryLanguage;
  source: string;
}

export function QueryConsole() {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [prql, setPrql] = useState(DEFAULT_PRQL);
  const [activePane, setActivePane] = useState<QueryLanguage>("sql");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [schema, setSchema] = useState<SchemaIntrospection | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  // Written on every run, never read yet — kept so a future history UI is not
  // misled about which language a past query was.
  const [, setHistory] = useState<HistoryEntry[]>([]);

  // The Run button sits outside the editors, so clicking it blurs the active
  // editor before the click handler fires. Keep the last focused pane in a ref
  // so Run still targets it.
  const activePaneRef = useRef<QueryLanguage>(activePane);
  useEffect(() => {
    activePaneRef.current = activePane;
  }, [activePane]);

  // Load schema on mount
  useEffect(() => {
    let cancelled = false;
    setSchemaLoading(true);
    fetchSchema()
      .then((s) => {
        if (!cancelled) {
          setSchema(s);
          setSchemaLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setSchemaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRun = useCallback(async () => {
    const pane = activePaneRef.current;
    const source = pane === "prql" ? prql : sql;
    if (!source.trim() || loading) return;

    setLoading(true);
    try {
      const res = await runQuery(
        pane === "prql" ? { language: "prql", sql: prql } : { sql },
      );
      setResult(res);
      setHistory((h) => [{ language: pane, source }, ...h].slice(0, 20));
      if (isQuerySuccess(res)) {
        // Back-fill the SQL pane with whatever actually ran.
        if (pane === "prql" && res.compiledSql) setSql(res.compiledSql);
        toast.success(`${res.rowCount} rows in ${res.durationMs}ms`);
      } else if (isQueryError(res)) {
        toast.error(res.error.message);
      }
    } catch (_err) {
      toast.error("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }, [prql, sql, loading]);

  const handleTransform = useCallback(async () => {
    if (!prql.trim() || transforming || loading) return;
    setTransforming(true);
    try {
      const res = await compilePrql(prql);
      if (isPrqlCompileSuccess(res)) {
        setSql(res.sql);
        setActivePane("sql");
        toast.success("Compiled PRQL to SQL");
      } else if (isPrqlCompileError(res)) {
        // Surface the compile error in the results panel without clobbering
        // the SQL pane.
        setResult({
          error: {
            message: res.error.reason,
            code: null,
            position: null,
            detail: null,
            hint: null,
            where: null,
            kind: "PRQL_COMPILE_ERROR",
            prql: res.error,
          },
        });
        toast.error(res.error.reason);
      }
    } catch (_err) {
      toast.error("Network error — is the server running?");
    } finally {
      setTransforming(false);
    }
  }, [prql, transforming, loading]);

  const handleTableClick = useCallback((tableName: string) => {
    setSql(`SELECT * FROM ${tableName} LIMIT 10;`);
    setActivePane("sql");
  }, []);

  const handleExampleSelect = useCallback((query: ExampleQuery) => {
    setSql(query.sql);
    setActivePane("sql");
  }, []);

  const handleDownload = useCallback(() => {
    if (!result || !isQuerySuccess(result)) return;
    const headers = result.columns.map((c) => c.name).join(",");
    const rows = result.rows.map((row) =>
      row
        .map((cell) => {
          const s =
            cell === null
              ? ""
              : typeof cell === "object"
                ? JSON.stringify(cell)
                : String(cell);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const runLabel = activePane === "prql" ? "Run PRQL" : "Run SQL";
  const runDisabled =
    loading || (activePane === "prql" ? !prql.trim() : !sql.trim());

  return (
    <div className="flex h-screen flex-col">
      <Toaster richColors position="bottom-right" />
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <Database className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">SQL Learning Lab</h1>
        <Separator orientation="vertical" className="h-6" />
        <ExamplePicker onSelect={handleExampleSelect} />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSchemaLoading(true);
              fetchSchema()
                .then((s) => {
                  setSchema(s);
                  setSchemaLoading(false);
                  toast.success("Schema refreshed");
                })
                .catch(() => {
                  setSchemaLoading(false);
                  toast.error("Failed to refresh schema");
                });
            }}
          >
            <RotateCw className="h-4 w-4" />
            Refresh Schema
          </Button>
        </div>
      </header>

      {/* Main layout: sidebar + editor + results */}
      <div className="flex flex-1 overflow-hidden">
        {/* Schema sidebar */}
        <aside className="w-64 shrink-0 border-r">
          <SchemaExplorer
            schema={schema}
            loading={schemaLoading}
            onTableClick={handleTableClick}
          />
        </aside>

        {/* Editor + Results */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <Button onClick={handleRun} disabled={runDisabled} size="sm">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {runLabel}
            </Button>
            <span className="text-xs text-muted-foreground">
              Ctrl/Cmd+Enter
            </span>
            {result && isQuerySuccess(result) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="ml-auto"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            )}
          </div>

          {/* Dual-pane editors */}
          <div className="h-72 shrink-0 overflow-hidden border-b">
            <EditorSplit
              prql={prql}
              sql={sql}
              onPrqlChange={setPrql}
              onSqlChange={setSql}
              onRun={handleRun}
              onTransform={handleTransform}
              onActivePaneChange={setActivePane}
              activePane={activePane}
              schema={schema}
              loading={loading}
              transforming={transforming}
            />
          </div>

          {/* Results panel */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : result ? (
              isQuerySuccess(result) ? (
                <ResultsGrid result={result} />
              ) : (
                <ErrorDisplay error={result.error} />
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
}

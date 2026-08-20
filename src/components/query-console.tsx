"use client";

import { Database, Download, Loader2, Play, RotateCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { ErrorDisplay } from "#/components/error-display";
import { ExamplePicker } from "#/components/example-picker";
import { ResultsGrid } from "#/components/results-grid";
import { SchemaExplorer } from "#/components/schema-explorer";
import { SqlEditor } from "#/components/sql-editor";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
  fetchSchema,
  isQueryError,
  isQuerySuccess,
  runQuery,
} from "#/lib/sql/client";
import type { ExampleQuery } from "#/lib/sql/examples";
import type { QueryResponse, SchemaIntrospection } from "#/lib/sql/types";

export function QueryConsole() {
  const [sql, setSql] = useState("SELECT * FROM sellers LIMIT 10;");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<SchemaIntrospection | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [_history, setHistory] = useState<string[]>([]);

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
    if (!sql.trim() || loading) return;
    setLoading(true);
    try {
      const res = await runQuery({ sql });
      setResult(res);
      setHistory((h) => [sql, ...h.filter((q) => q !== sql)].slice(0, 20));
      if (isQuerySuccess(res)) {
        toast.success(`${res.rowCount} rows in ${res.durationMs}ms`);
      } else if (isQueryError(res)) {
        toast.error(res.error.message);
      }
    } catch (_err) {
      toast.error("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }, [sql, loading]);

  const handleTableClick = useCallback((tableName: string) => {
    const query = `SELECT * FROM ${tableName} LIMIT 10;`;
    setSql(query);
  }, []);

  const handleExampleSelect = useCallback((query: ExampleQuery) => {
    setSql(query.sql);
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
            <Button
              onClick={handleRun}
              disabled={loading || !sql.trim()}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run
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

          {/* SQL editor */}
          <div className="h-48 shrink-0 border-b">
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={handleRun}
              disabled={loading}
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

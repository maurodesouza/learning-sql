"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { command } from "#/lib/command";
import {
  compilePrql,
  isPrqlCompileError,
  isPrqlCompileSuccess,
} from "#/lib/prql/client";
import { isQueryError, isQuerySuccess, runQuery } from "#/lib/sql/client";
import type { ExampleQuery } from "#/lib/sql/examples";
import type { QueryLanguage } from "#/lib/sql/types";
import { QueryConsoleContext } from "../../../context/query-console-context";
import { QueryConsoleStore } from "../../../stores/query-console-store";

interface QueryConsoleHandleProps {
  instanceId: string;
  children: React.ReactNode;
}

export function QueryConsoleHandle({
  instanceId,
  children,
}: QueryConsoleHandleProps) {
  const store = useMemo(() => new QueryConsoleStore(instanceId), [instanceId]);

  async function handleRun() {
    const pane = store.activePane;
    const source = pane === "prql" ? store.prql : store.sql;
    if (!source.trim() || store.loading) return;

    store.setLoading(true);
    try {
      const res = await runQuery(
        pane === "prql"
          ? { language: "prql", sql: store.prql }
          : { sql: store.sql },
      );
      store.setResult(res);
      store.addHistory({ language: pane, source });
      if (isQuerySuccess(res)) {
        if (pane === "prql" && res.compiledSql) store.setSql(res.compiledSql);
        toast.success(`${res.rowCount} rows in ${res.durationMs}ms`);
      } else if (isQueryError(res)) {
        toast.error(res.error.message);
      }
    } catch (_err) {
      toast.error("Network error — is the server running?");
    } finally {
      store.setLoading(false);
    }
  }

  async function handleTransform() {
    if (!store.prql.trim() || store.transforming || store.loading) return;
    store.setTransforming(true);
    try {
      const res = await compilePrql(store.prql);
      if (isPrqlCompileSuccess(res)) {
        store.setSql(res.sql);
        store.setActivePane("sql");
        toast.success("Compiled PRQL to SQL");
      } else if (isPrqlCompileError(res)) {
        store.setResult({
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
      store.setTransforming(false);
    }
  }

  async function handleSetSql(payload: string) {
    store.setSql(payload);
  }

  async function handleSetPrql(payload: string) {
    store.setPrql(payload);
  }

  async function handleSetActivePane(payload: QueryLanguage) {
    store.setActivePane(payload);
  }

  async function handleSelectTable(payload: string) {
    store.setSql(`SELECT * FROM ${payload} LIMIT 10;`);
    store.setActivePane("sql");
  }

  async function handleSelectExample(payload: ExampleQuery) {
    store.setSql(payload.sql);
    store.setActivePane("sql");
  }

  async function handleDownload() {
    const result = store.result;
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
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the memoized store and only need to register once per instance
  useEffect(() => {
    const config = { instanceId };
    const disposes = [
      command.handle("queryConsole.run", handleRun, config),
      command.handle("queryConsole.transform", handleTransform, config),
      command.handle("queryConsole.setSql", handleSetSql, config),
      command.handle("queryConsole.setPrql", handleSetPrql, config),
      command.handle("queryConsole.setActivePane", handleSetActivePane, config),
      command.handle("queryConsole.selectTable", handleSelectTable, config),
      command.handle("queryConsole.selectExample", handleSelectExample, config),
      command.handle("queryConsole.download", handleDownload, config),
    ];

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, [instanceId]);

  return (
    <QueryConsoleContext.Provider value={store}>
      {children}
    </QueryConsoleContext.Provider>
  );
}

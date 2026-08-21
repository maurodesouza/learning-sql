"use client";

import type { QueryLanguage } from "#/lib/sql/types";
import { useQueryConsoleStore } from "../../context/query-console-context";

export interface PaneProps {
  language: QueryLanguage;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function Pane({ language, header, children }: PaneProps) {
  const store = useQueryConsoleStore();
  const active = store.activePane === language;

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

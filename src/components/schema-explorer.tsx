"use client";

import {
  Box,
  ChevronDown,
  ChevronRight,
  Key,
  Link2,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { ScrollArea } from "#/components/ui/scroll-area";
import type { SchemaIntrospection, SchemaTable } from "#/lib/sql/types";
import { cn } from "#/lib/utils";

interface SchemaExplorerProps {
  schema: SchemaIntrospection | null;
  loading: boolean;
  onTableClick: (tableName: string) => void;
}

export function SchemaExplorer({
  schema,
  loading,
  onTableClick,
}: SchemaExplorerProps) {
  const [search, setSearch] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const filteredTables = useMemo(() => {
    if (!schema) return [];
    if (!search) return schema.tables;
    const q = search.toLowerCase();
    return schema.tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [schema, search]);

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Loading schema...
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Failed to load schema
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-3">
        <input
          type="text"
          placeholder="Search tables or columns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredTables.map((table) => (
            <SchemaTableItem
              key={table.name}
              table={table}
              expanded={expandedTables.has(table.name)}
              onToggle={() => toggleTable(table.name)}
              onTableClick={onTableClick}
            />
          ))}
          {filteredTables.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No tables found
            </div>
          )}
        </div>
      </ScrollArea>
      {schema.enums.length > 0 && <EnumList enums={schema.enums} />}
    </div>
  );
}

function SchemaTableItem({
  table,
  expanded,
  onToggle,
  onTableClick,
}: {
  table: SchemaTable;
  expanded: boolean;
  onToggle: () => void;
  onTableClick: (name: string) => void;
}) {
  const icon =
    table.kind === "table" ? Table2 : table.kind === "view" ? View : Box;

  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-sm hover:bg-accent"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          {(() => {
            const Icon = icon;
            return (
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            );
          })()}
          <span className="truncate font-mono text-xs">{table.name}</span>
          <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
            {table.rowCount > 0 ? formatCount(table.rowCount) : "0"}
          </Badge>
        </button>
        <button
          type="button"
          onClick={() => onTableClick(table.name)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title={`SELECT * FROM ${table.name} LIMIT 10`}
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {expanded && (
        <div className="ml-5 border-l pl-2">
          {table.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-1.5 py-0.5 text-xs"
            >
              {col.isPrimaryKey ? (
                <Key className="h-3 w-3 shrink-0 text-amber-500" />
              ) : table.foreignKeys.some((fk) => fk.column === col.name) ? (
                <Link2 className="h-3 w-3 shrink-0 text-blue-500" />
              ) : (
                <span className="w-3 shrink-0" />
              )}
              <span
                className={cn(
                  "font-mono",
                  col.nullable ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {col.name}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {col.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EnumList({ enums }: { enums: { name: string; values: string[] }[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 p-2 text-sm hover:bg-accent"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span className="font-medium text-xs">Enum Types ({enums.length})</span>
      </button>
      {expanded && (
        <ScrollArea className="max-h-48">
          <div className="ml-5 border-l pl-2 pb-2">
            {enums.map((e) => (
              <div key={e.name} className="mb-1">
                <div className="font-mono text-xs font-medium">{e.name}</div>
                <div className="ml-2 text-[10px] text-muted-foreground">
                  {e.values.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function View(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

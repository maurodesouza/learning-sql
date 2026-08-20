"use client";

import {
  AlertCircle,
  AlertTriangle,
  Clock,
  FileWarning,
  Lock,
} from "lucide-react";
import type { QueryErrorDetail } from "#/lib/sql/types";

const KIND_CONFIG: Record<
  string,
  { icon: typeof AlertCircle; label: string; color: string }
> = {
  SYNTAX_ERROR: {
    icon: FileWarning,
    label: "Syntax Error",
    color: "text-amber-500",
  },
  READ_ONLY_VIOLATION: {
    icon: Lock,
    label: "Read-Only Violation",
    color: "text-red-500",
  },
  TIMEOUT: { icon: Clock, label: "Query Timeout", color: "text-orange-500" },
  MULTI_STATEMENT: {
    icon: AlertTriangle,
    label: "Multiple Statements",
    color: "text-orange-500",
  },
  INPUT_INVALID: {
    icon: AlertTriangle,
    label: "Invalid Input",
    color: "text-orange-500",
  },
  UNKNOWN: { icon: AlertCircle, label: "Error", color: "text-red-500" },
};

export function ErrorDisplay({ error }: { error: QueryErrorDetail }) {
  const config = KIND_CONFIG[error.kind] ?? KIND_CONFIG.UNKNOWN;
  const Icon = config.icon;

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <h3 className="font-semibold text-sm">{config.label}</h3>
        {error.code && (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {error.code}
          </code>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="rounded-md bg-muted/50 p-3">
          <p className="font-mono text-xs">{error.message}</p>
          {error.position && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              at position: {error.position}
            </p>
          )}
        </div>
        {error.detail && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Detail:{" "}
            </span>
            <span className="font-mono text-xs">{error.detail}</span>
          </div>
        )}
        {error.hint && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Hint:{" "}
            </span>
            <span className="font-mono text-xs">{error.hint}</span>
          </div>
        )}
        {error.where && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Where:{" "}
            </span>
            <span className="font-mono text-xs">{error.where}</span>
          </div>
        )}
      </div>
    </div>
  );
}

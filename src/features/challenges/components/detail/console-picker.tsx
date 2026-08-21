"use client";

import { Monitor } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { useInstances } from "#/hooks/use-instances";
import { actions } from "#/lib/command";

export const ConsolePicker = observer(function ConsolePicker() {
  const store = useChallengesStore();
  const consoles = useInstances("queryConsole");

  if (consoles.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
        <Monitor className="h-4 w-4" />
        Open a Query Console tab to bind it.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
      <select
        value={store.boundConsoleId ?? ""}
        onChange={(e) =>
          actions.challenges.console.bind(e.target.value || null)
        }
        className="h-8 flex-1 rounded-md border bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Not bound</option>
        {consoles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label ?? c.id}
          </option>
        ))}
      </select>
    </div>
  );
});

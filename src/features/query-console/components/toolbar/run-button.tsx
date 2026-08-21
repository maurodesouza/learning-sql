"use client";

import { Loader2, Play } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";
import { useQueryConsoleStore } from "../../context/query-console-context";

export const RunButton = observer(function RunButton() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;
  const loading = useTransition(["queryConsole.run", instanceId]);

  return (
    <Button
      onClick={() =>
        actions.queryConsole.run(undefined, {
          instanceId,
          transition: ["queryConsole.run", instanceId],
        })
      }
      disabled={store.runDisabled || loading}
      size="sm"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {store.runLabel}
    </Button>
  );
});

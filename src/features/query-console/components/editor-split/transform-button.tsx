"use client";

import { ArrowRight, Loader2, Wand2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";
import { useQueryConsoleStore } from "../../context/query-console-context";

export const TransformButton = observer(function TransformButton() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;
  const transforming = useTransition(["queryConsole.transform", instanceId]);
  const running = useTransition(["queryConsole.run", instanceId]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        actions.queryConsole.transform(undefined, {
          instanceId,
          transition: ["queryConsole.transform", instanceId],
        })
      }
      disabled={transforming || running || !store.prql.trim()}
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
  );
});

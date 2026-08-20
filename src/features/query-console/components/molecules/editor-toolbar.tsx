"use client";

import { Download, Loader2, Play } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";
import { useQueryConsoleStore } from "../../context/query-console-context";

export const EditorToolbar = observer(function EditorToolbar() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;

  return (
    <div className="flex items-center gap-2 border-b px-3 py-1.5">
      <Button
        onClick={() => actions.queryConsole.run(undefined, { instanceId })}
        disabled={store.runDisabled}
        size="sm"
      >
        {store.loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {store.runLabel}
      </Button>
      <span className="text-xs text-muted-foreground">Ctrl/Cmd+Enter</span>
      {store.canDownload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            actions.queryConsole.download(undefined, { instanceId })
          }
          className="ml-auto"
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
      )}
    </div>
  );
});

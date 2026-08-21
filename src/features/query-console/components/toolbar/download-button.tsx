"use client";

import { Download } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";
import { useQueryConsoleStore } from "../../context/query-console-context";

export const DownloadButton = observer(function DownloadButton() {
  const store = useQueryConsoleStore();
  const { instanceId } = store;

  if (!store.canDownload) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => actions.queryConsole.download(undefined, { instanceId })}
      className="ml-auto"
    >
      <Download className="h-4 w-4" />
      CSV
    </Button>
  );
});

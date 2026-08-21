"use client";

import { Plus } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function AddQueryConsoleButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => actions.workspace.addQueryConsole()}
      title="Add Query Console"
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
}

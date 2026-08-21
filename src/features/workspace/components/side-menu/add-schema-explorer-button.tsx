"use client";

import { Table2 } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function AddSchemaExplorerButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => actions.workspace.addSchemaExplorer()}
      title="Add Schema Explorer"
    >
      <Table2 className="h-4 w-4" />
    </Button>
  );
}

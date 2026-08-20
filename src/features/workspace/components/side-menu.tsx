"use client";

import { Plus, Table2 } from "lucide-react";
import { Button } from "#/components/atoms/button";

interface SideMenuProps {
  onAddQueryConsole: () => void;
  onAddSchemaExplorer: () => void;
}

export function SideMenu({
  onAddQueryConsole,
  onAddSchemaExplorer,
}: SideMenuProps) {
  return (
    <aside className="flex h-full w-12 flex-col items-center justify-center gap-4 border-r bg-background py-4">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onAddQueryConsole}
        title="Add Query Console"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onAddSchemaExplorer}
        title="Add Schema Explorer"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </aside>
  );
}

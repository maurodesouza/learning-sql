"use client";

import { Database, RotateCw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { Separator } from "#/components/atoms/separator";
import { ExamplePicker } from "#/features/query-console/components/organisms/example-picker";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";

export const AppHeader = observer(function AppHeader() {
  const schemaLoading = useTransition(["schema"]);

  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <Database className="h-5 w-5 text-primary" />
      <h1 className="text-lg font-semibold">SQL Learning Lab</h1>
      <Separator orientation="vertical" className="h-6" />
      <ExamplePicker />
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            actions.schema.refresh(undefined, { transition: ["schema"] })
          }
          disabled={schemaLoading}
        >
          <RotateCw className="h-4 w-4" />
          Refresh Schema
        </Button>
      </div>
    </header>
  );
});

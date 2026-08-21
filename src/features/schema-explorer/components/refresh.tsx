"use client";

import { RotateCw } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";

export function Refresh() {
  const schemaLoading = useTransition(["schema"]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() =>
        actions.schema.data.refresh(undefined, { transition: ["schema"] })
      }
      disabled={schemaLoading}
      title="Refresh schema"
    >
      <RotateCw className="h-4 w-4" />
    </Button>
  );
}

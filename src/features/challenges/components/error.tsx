"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function ErrorState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm text-muted-foreground">
        Failed to load challenges.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => actions.challenges.data.refresh()}
      >
        Retry
      </Button>
    </div>
  );
}

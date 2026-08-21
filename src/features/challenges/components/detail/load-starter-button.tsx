"use client";

import { FileDown } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function LoadStarterButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => actions.challenges.console.loadStarter()}
    >
      <FileDown className="h-4 w-4" />
      Load Starter
    </Button>
  );
}

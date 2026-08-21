"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function BackButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => actions.challenges.back()}
      className="shrink-0"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}

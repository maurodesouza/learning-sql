"use client";

import { Trophy } from "lucide-react";
import { Button } from "#/components/atoms/button";
import { actions } from "#/lib/command";

export function AddChallengesButton() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => actions.workspace.addChallenges()}
      title="Add Challenges"
    >
      <Trophy className="h-4 w-4" />
    </Button>
  );
}

"use client";

import { Play } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { useTransition } from "#/hooks/use-transition";
import { actions } from "#/lib/command";

export const CheckButton = observer(function CheckButton() {
  const store = useChallengesStore();
  const isChecking = useTransition(["challenges.check"]);

  return (
    <Button
      size="sm"
      disabled={!store.canCheck || isChecking}
      onClick={() =>
        actions.challenges.check(undefined, {
          transition: ["challenges.check"],
        })
      }
    >
      <Play className="h-4 w-4" />
      {isChecking ? "Checking..." : "Check Answer"}
    </Button>
  );
});

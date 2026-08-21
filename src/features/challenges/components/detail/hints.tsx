"use client";

import { Lightbulb } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { actions } from "#/lib/command";

export const Hints = observer(function Hints() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;

  const displayed = store.revealedHints;
  const knownCount = challenge.hints.length;

  // Can we reveal more? The backend knows the total; we infer from what we've seen.
  const canRevealMore =
    displayed.length === 0 || displayed.length >= knownCount;

  return (
    <div className="flex flex-col gap-2">
      {displayed.map((hint) => (
        <div
          key={hint.id}
          className="flex gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
        >
          <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{hint.text}</span>
        </div>
      ))}
      {(canRevealMore || displayed.length === 0) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => actions.challenges.reveal.hint()}
          className="w-fit"
        >
          <Lightbulb className="h-4 w-4" />
          {displayed.length === 0 ? "Show Hint" : "Show Next Hint"}
        </Button>
      )}
    </div>
  );
});

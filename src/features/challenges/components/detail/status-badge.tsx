"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { cn } from "#/lib/utils";

export const StatusBadge = observer(function StatusBadge() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;
  const status = challenge.progress?.status;

  if (status === "SOLVED") {
    return (
      <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-700">
        Solved
      </span>
    );
  }
  if (status === "ATTEMPTED") {
    return (
      <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-700">
        Attempted
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground",
      )}
    >
      New
    </span>
  );
});

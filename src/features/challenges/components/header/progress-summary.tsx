"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";

export const ProgressSummary = observer(function ProgressSummary() {
  const store = useChallengesStore();
  return (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
      {store.solvedCount}/{store.totalCount} solved
    </span>
  );
});

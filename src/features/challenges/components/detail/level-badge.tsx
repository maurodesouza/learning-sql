"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import type { ChallengeLevel } from "#/lib/challenges/types";
import { cn } from "#/lib/utils";

const LEVEL_STYLES: Record<ChallengeLevel, string> = {
  BEGINNER: "bg-green-500/10 text-green-700 border-green-500/20",
  MID_LEVEL: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  SENIOR: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  EXPERT: "bg-purple-500/10 text-purple-700 border-purple-500/20",
};

const LEVEL_LABELS: Record<ChallengeLevel, string> = {
  BEGINNER: "Beginner",
  MID_LEVEL: "Mid-Level",
  SENIOR: "Senior",
  EXPERT: "Expert",
};

export const LevelBadge = observer(function LevelBadge() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium",
        LEVEL_STYLES[challenge.level],
      )}
    >
      {LEVEL_LABELS[challenge.level]}
    </span>
  );
});

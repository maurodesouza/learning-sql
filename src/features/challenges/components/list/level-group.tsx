"use client";

import type { ChallengeLevel } from "#/lib/challenges/types";

export interface LevelGroupProps {
  level: ChallengeLevel;
  solved: number;
  total: number;
  children: React.ReactNode;
}

const LEVEL_LABELS: Record<ChallengeLevel, string> = {
  BEGINNER: "Beginner",
  MID_LEVEL: "Mid-Level",
  SENIOR: "Senior",
  EXPERT: "Expert",
};

export function LevelGroup({
  level,
  solved,
  total,
  children,
}: LevelGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {LEVEL_LABELS[level]}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {solved}/{total}
        </span>
      </div>
      {children}
    </div>
  );
}

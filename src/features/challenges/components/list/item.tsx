"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { ChallengeDTO } from "#/lib/challenges/types";
import { actions } from "#/lib/command";
import { cn } from "#/lib/utils";

export interface ChallengeItemProps {
  challenge: ChallengeDTO;
}

export function ChallengeItem({ challenge }: ChallengeItemProps) {
  const status = challenge.progress?.status;
  const isSolved = status === "SOLVED";
  const isAttempted = status === "ATTEMPTED";

  return (
    <button
      type="button"
      onClick={() => actions.challenges.select(challenge.slug)}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
        isSolved && "border-green-500/30 bg-green-500/5",
      )}
    >
      {isSolved ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      ) : isAttempted ? (
        <Loader2 className="h-4 w-4 shrink-0 text-amber-500" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 truncate">{challenge.title}</span>
      {challenge.progress && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {challenge.progress.attempts}x
        </span>
      )}
    </button>
  );
}

/**
 * Projection helpers — convert Prisma lab rows into client-safe DTOs.
 *
 * The solution_sql column is NEVER included in a ChallengeDTO. It is only
 * returned by the reveal endpoint when the user explicitly requests it.
 */
import type {
  Challenge,
  ChallengeHint,
  ChallengeProgress,
} from "#/generated/prisma/client";
import type {
  ChallengeDTO,
  ChallengeHintDTO,
  ChallengeProgressDTO,
} from "./types";

export function toChallengeDTO(
  challenge: Challenge & {
    hints: ChallengeHint[];
    progress: ChallengeProgress | null;
  },
  revealedHintsCount: number,
): ChallengeDTO {
  return {
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    level: challenge.level,
    orderIndex: challenge.orderIndex,
    prompt: challenge.prompt,
    starterSql: challenge.starterSql,
    orderMatters: challenge.orderMatters,
    hints: challenge.hints.slice(0, revealedHintsCount).map(toHintDTO),
    progress: challenge.progress ? toProgressDTO(challenge.progress) : null,
  };
}

function toHintDTO(hint: ChallengeHint): ChallengeHintDTO {
  return {
    id: hint.id,
    position: hint.position,
    text: hint.text,
  };
}

function toProgressDTO(progress: ChallengeProgress): ChallengeProgressDTO {
  return {
    status: progress.status,
    attempts: progress.attempts,
    solvedAt: progress.solvedAt?.toISOString() ?? null,
    revealedResult: progress.revealedResult,
    revealedHints: progress.revealedHints,
    revealedSolution: progress.revealedSolution,
  };
}

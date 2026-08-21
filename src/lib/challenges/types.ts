/**
 * Shared types for the Challenges server/client boundary.
 */

export type ChallengeLevel = "BEGINNER" | "MID_LEVEL" | "SENIOR" | "EXPERT";
export type ChallengeStatus = "ATTEMPTED" | "SOLVED";

/** Challenge as sent to the client (solution_sql and hints excluded). */
export interface ChallengeDTO {
  id: number;
  slug: string;
  title: string;
  level: ChallengeLevel;
  orderIndex: number;
  prompt: string;
  starterSql: string | null;
  orderMatters: boolean;
  hints: ChallengeHintDTO[];
  progress: ChallengeProgressDTO | null;
}

export interface ChallengeHintDTO {
  id: number;
  position: number;
  text: string;
}

export interface ChallengeProgressDTO {
  status: ChallengeStatus;
  attempts: number;
  solvedAt: string | null;
  revealedResult: boolean;
  revealedHints: number;
  revealedSolution: boolean;
}

/** Result of checking a user query against a challenge. */
export interface CheckResult {
  correct: boolean;
  expectedColumns: string[];
  userColumns: string[];
  userRowCount: number;
  expectedRowCount: number;
  rowCap: number;
  orderMatters: boolean;
  firstMismatch: MismatchSample | null;
  error: string | null;
}

export interface MismatchSample {
  rowIndex: number;
  expected: unknown[];
  actual: unknown[];
}

/** Response for the reveal endpoint. */
export interface RevealResult {
  solutionSql: string;
  resultRows: Record<string, unknown>[];
  resultColumns: string[];
}

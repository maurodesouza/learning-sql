/**
 * Typed client for the Challenges REST API.
 *
 * All methods return parsed JSON or throw on non-2xx responses. Use this from
 * client components, stores, or server actions — never call fetch() directly.
 */
import type { ChallengeDTO, CheckResult } from "#/lib/challenges/types";

export interface CheckResponse {
  result: CheckResult;
  progress: {
    status: "ATTEMPTED" | "SOLVED";
    attempts: number;
    solvedAt: string | null;
  };
}

export interface RevealHintsResponse {
  reveal: "hints";
  revealedHints: { id: number; position: number; text: string }[];
  totalHints: number;
  revealedCount: number;
}

export interface RevealResultResponse {
  reveal: "result";
  resultColumns: string[];
  resultRows: Record<string, unknown>[];
}

export interface RevealSolutionResponse {
  reveal: "solution";
  solutionSql: string;
  resultColumns: string[];
  resultRows: Record<string, unknown>[];
}

export type RevealResponse =
  | RevealHintsResponse
  | RevealResultResponse
  | RevealSolutionResponse;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ??
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/** List all challenges (solution_sql excluded). */
export function listChallenges(): Promise<{ challenges: ChallengeDTO[] }> {
  return fetchJson("/api/challenges");
}

/** Fetch a single challenge by slug (solution_sql excluded). */
export function getChallenge(slug: string): Promise<ChallengeDTO> {
  return fetchJson(`/api/challenges/${encodeURIComponent(slug)}`);
}

/** Check a user query against a challenge. */
export function checkChallenge(
  slug: string,
  sql: string,
  language?: "sql" | "prql",
): Promise<CheckResponse> {
  return fetchJson(`/api/challenges/${encodeURIComponent(slug)}/check`, {
    method: "POST",
    body: JSON.stringify({ sql, language }),
  });
}

/** Reveal the solution, reference result, or hints for a challenge. */
export function revealChallenge(
  slug: string,
  reveal: "solution" | "result" | "hints",
  count?: number,
): Promise<RevealResponse> {
  return fetchJson(`/api/challenges/${encodeURIComponent(slug)}/reveal`, {
    method: "POST",
    body: JSON.stringify({ reveal, count }),
  });
}

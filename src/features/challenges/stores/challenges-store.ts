import { action, computed, observable } from "mobx";
import type {
  ChallengeDTO,
  ChallengeLevel,
  CheckResult,
} from "#/lib/challenges/types";

export type LevelFilter = ChallengeLevel | "all";

export interface RevealedResultData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export class ChallengesStore {
  @observable accessor challenges: ChallengeDTO[] = [];
  @observable accessor search = "";
  @observable accessor levelFilter: LevelFilter = "all";
  @observable accessor selectedSlug: string | null = null;
  @observable accessor boundConsoleId: string | null = null;
  @observable accessor checkResult: CheckResult | null = null;
  @observable accessor revealedResult: RevealedResultData | null = null;
  @observable accessor revealedHints: {
    id: number;
    position: number;
    text: string;
  }[] = [];
  @observable accessor revealedSolution: {
    solutionSql: string;
    resultRows: Record<string, unknown>[];
    resultColumns: string[];
  } | null = null;
  @observable accessor solutionConfirming = false;

  @computed
  get groupedByLevel(): Record<ChallengeLevel, ChallengeDTO[]> {
    const groups: Record<ChallengeLevel, ChallengeDTO[]> = {
      BEGINNER: [],
      MID_LEVEL: [],
      SENIOR: [],
      EXPERT: [],
    };
    for (const c of this.challenges) {
      groups[c.level].push(c);
    }
    return groups;
  }

  @computed
  get filteredChallenges(): ChallengeDTO[] {
    let list = this.challenges;
    if (this.levelFilter !== "all") {
      list = list.filter((c) => c.level === this.levelFilter);
    }
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
      );
    }
    return list;
  }

  @computed
  get selectedChallenge(): ChallengeDTO | null {
    if (!this.selectedSlug) return null;
    return this.challenges.find((c) => c.slug === this.selectedSlug) ?? null;
  }

  @computed
  get isDetailOpen(): boolean {
    return this.selectedSlug !== null;
  }

  @computed
  get canCheck(): boolean {
    return this.boundConsoleId !== null && this.selectedSlug !== null;
  }

  @computed
  get solvedCount(): number {
    return this.challenges.filter((c) => c.progress?.status === "SOLVED")
      .length;
  }

  @computed
  get totalCount(): number {
    return this.challenges.length;
  }

  @computed
  get solvedByLevel(): Record<
    ChallengeLevel,
    { solved: number; total: number }
  > {
    const result: Record<ChallengeLevel, { solved: number; total: number }> = {
      BEGINNER: { solved: 0, total: 0 },
      MID_LEVEL: { solved: 0, total: 0 },
      SENIOR: { solved: 0, total: 0 },
      EXPERT: { solved: 0, total: 0 },
    };
    for (const c of this.challenges) {
      result[c.level].total++;
      if (c.progress?.status === "SOLVED") result[c.level].solved++;
    }
    return result;
  }

  @action
  setChallenges(challenges: ChallengeDTO[]) {
    this.challenges = challenges;
  }

  @action
  setSearch(value: string) {
    this.search = value;
  }

  @action
  setLevelFilter(level: LevelFilter) {
    this.levelFilter = level;
  }

  @action
  selectChallenge(slug: string | null) {
    this.selectedSlug = slug;
    this.checkResult = null;
    this.revealedResult = null;
    this.revealedHints = [];
    this.revealedSolution = null;
    this.solutionConfirming = false;

    // Restore revealed state from progress if available.
    if (slug) {
      const challenge = this.challenges.find((c) => c.slug === slug);
      if (challenge?.progress) {
        if (challenge.progress.revealedHints > 0) {
          this.revealedHints = challenge.hints.slice(
            0,
            challenge.progress.revealedHints,
          );
        }
      }
    }
  }

  @action
  setBoundConsoleId(id: string | null) {
    this.boundConsoleId = id;
  }

  @action
  setCheckResult(result: CheckResult | null) {
    this.checkResult = result;
  }

  @action
  setRevealedResult(data: RevealedResultData | null) {
    this.revealedResult = data;
  }

  @action
  addRevealedHints(hints: { id: number; position: number; text: string }[]) {
    this.revealedHints = hints;
  }

  @action
  setRevealedSolution(
    data: {
      solutionSql: string;
      resultRows: Record<string, unknown>[];
      resultColumns: string[];
    } | null,
  ) {
    this.revealedSolution = data;
    this.solutionConfirming = false;
  }

  @action
  setSolutionConfirming(value: boolean) {
    this.solutionConfirming = value;
  }

  @action
  updateProgress(slug: string, progress: ChallengeDTO["progress"]) {
    const challenge = this.challenges.find((c) => c.slug === slug);
    if (challenge) {
      challenge.progress = progress;
    }
  }
}

/**
 * Shared singleton — the challenges data is global (one database, one user).
 * Consistent with the schemaStore pattern.
 */
export const challengesStore = new ChallengesStore();

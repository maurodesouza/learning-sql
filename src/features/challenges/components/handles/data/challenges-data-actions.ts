import type { LevelFilter } from "#/features/challenges/stores/challenges-store";
import type { Action } from "#/lib/command";

declare module "#/lib/command/global" {
  interface ChallengesActions {
    data: {
      fetch: Action;
      refresh: Action;
    };
    select: Action<string>;
    back: Action;
    filter: {
      setSearch: Action<string>;
      setLevel: Action<LevelFilter>;
    };
  }

  interface Actions {
    challenges: ChallengesActions;
  }
}

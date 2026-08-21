import type { Action } from "#/lib/command";

declare module "#/lib/command/global" {
  interface ChallengesActions {
    console: {
      bind: Action<string | null>;
      loadStarter: Action;
    };
    check: Action;
    reveal: {
      result: Action;
      hint: Action;
      solution: Action;
    };
  }

  interface Actions {
    challenges: ChallengesActions;
  }
}

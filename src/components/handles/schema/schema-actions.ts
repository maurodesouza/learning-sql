import type { Action } from "#/lib/command";

declare module "#/lib/command/global" {
  interface Actions {
    schema: {
      fetch: Action;
      refresh: Action;
    };
  }
}

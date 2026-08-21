import type { Action } from "#/lib/command";

declare module "#/lib/command/global" {
  interface Actions {
    workspace: {
      addQueryConsole: Action;
      addSchemaExplorer: Action;
    };
  }
}

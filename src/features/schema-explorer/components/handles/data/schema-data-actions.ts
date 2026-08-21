import type { Action } from "#/lib/command";

declare module "#/lib/command/global" {
  interface Actions {
    schema: {
      data: {
        fetch: Action;
        refresh: Action;
      };
      search: {
        set: Action<string>;
      };
      table: {
        toggle: Action<string>;
        copySelect: Action<string>;
      };
      enums: {
        toggle: Action;
      };
    };
  }
}

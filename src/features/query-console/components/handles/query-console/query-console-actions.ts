import type { ScopedAction } from "#/lib/command";
import type { ExampleQuery } from "#/lib/sql/examples";
import type { QueryLanguage } from "#/lib/sql/types";

declare module "#/lib/command/global" {
  interface Actions {
    queryConsole: {
      run: ScopedAction;
      transform: ScopedAction;
      setSql: ScopedAction<string>;
      setPrql: ScopedAction<string>;
      setActivePane: ScopedAction<QueryLanguage>;
      selectTable: ScopedAction<string>;
      selectExample: ScopedAction<ExampleQuery>;
      download: ScopedAction;
    };
  }
}

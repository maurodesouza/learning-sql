import type { ScopedAction } from "#/lib/command";
import type { QueryLanguage } from "#/lib/sql/types";

export type UpdateEditorTemplatePayload = {
  template: string;
  activatePanel?: boolean;
};

export interface QueryConsoleSource {
  language: QueryLanguage;
  source: string;
}

declare module "#/lib/command/global" {
  interface Actions {
    queryConsole: {
      run: ScopedAction;
      transform: ScopedAction;
      download: ScopedAction;
      getSource: ScopedAction<undefined, QueryConsoleSource>;

      editor: {
        activate: ScopedAction<QueryLanguage>;
        toggle: ScopedAction;
        sql: ScopedAction<UpdateEditorTemplatePayload>;
        prql: ScopedAction<UpdateEditorTemplatePayload>;
      };
    };
  }
}

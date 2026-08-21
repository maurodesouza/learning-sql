import type { ScopedAction } from "#/lib/command";
import type { QueryLanguage } from "#/lib/sql/types";

export type UpdateEditorTemplatePayload = {
  template: string;
  activatePanel?: boolean;
};
declare module "#/lib/command/global" {
  interface Actions {
    queryConsole: {
      run: ScopedAction;
      transform: ScopedAction;
      download: ScopedAction;

      editor: {
        activate: ScopedAction<QueryLanguage>;
        sql: ScopedAction<UpdateEditorTemplatePayload>;
        prql: ScopedAction<UpdateEditorTemplatePayload>;
      };
    };
  }
}

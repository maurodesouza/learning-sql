import type { ExampleQuery } from "#/lib/sql/examples";
import type { QueryLanguage } from "#/lib/sql/types";

export type { ExampleQuery };

export interface HistoryEntry {
  language: QueryLanguage;
  source: string;
}

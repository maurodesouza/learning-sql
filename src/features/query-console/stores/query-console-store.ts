import { action, computed, observable } from "mobx";
import type { QueryLanguage, QueryResponse } from "#/lib/sql/types";
import type { HistoryEntry } from "../types/query-console-types";

const DEFAULT_SQL = "SELECT * FROM sellers LIMIT 10;";
const DEFAULT_PRQL = "from sellers | take 10";

export class QueryConsoleStore {
  readonly instanceId: string;

  @observable accessor sql = DEFAULT_SQL;
  @observable accessor prql = DEFAULT_PRQL;
  @observable accessor activePane: QueryLanguage = "sql";
  @observable accessor result: QueryResponse | null = null;
  @observable accessor history: HistoryEntry[] = [];

  constructor(instanceId: string) {
    this.instanceId = instanceId;
  }

  @computed
  get runLabel(): "Run PRQL" | "Run SQL" {
    return this.activePane === "prql" ? "Run PRQL" : "Run SQL";
  }

  @computed
  get runDisabled(): boolean {
    return this.activePane === "prql" ? !this.prql.trim() : !this.sql.trim();
  }

  @computed
  get canDownload(): boolean {
    return this.result !== null && !("error" in this.result);
  }

  @computed
  get hasResult(): boolean {
    return this.result !== null;
  }

  @computed
  get isSuccess(): boolean {
    return this.result !== null && !("error" in this.result);
  }

  @computed
  get isError(): boolean {
    return this.result !== null && "error" in this.result;
  }

  @action
  setSql(value: string) {
    this.sql = value;
  }

  @action
  setPrql(value: string) {
    this.prql = value;
  }

  @action
  setActivePane(pane: QueryLanguage) {
    this.activePane = pane;
  }

  @action
  setResult(result: QueryResponse | null) {
    this.result = result;
  }

  @action
  addHistory(entry: HistoryEntry) {
    this.history = [entry, ...this.history].slice(0, 20);
  }
}

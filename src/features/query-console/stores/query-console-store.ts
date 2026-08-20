import { action, computed, makeObservable, observable } from "mobx";
import type { QueryLanguage, QueryResponse } from "#/lib/sql/types";
import type { HistoryEntry } from "../types/query-console-types";

const DEFAULT_SQL = "SELECT * FROM sellers LIMIT 10;";
const DEFAULT_PRQL = "from sellers | take 10";

export class QueryConsoleStore {
  readonly instanceId: string;

  sql = DEFAULT_SQL;
  prql = DEFAULT_PRQL;
  activePane: QueryLanguage = "sql";
  result: QueryResponse | null = null;
  loading = false;
  transforming = false;
  history: HistoryEntry[] = [];

  constructor(instanceId: string) {
    this.instanceId = instanceId;

    makeObservable(this, {
      sql: observable,
      prql: observable,
      activePane: observable,
      result: observable.ref,
      loading: observable,
      transforming: observable,
      history: observable,
      runLabel: computed,
      runDisabled: computed,
      canDownload: computed,
      hasResult: computed,
      isSuccess: computed,
      isError: computed,
      setSql: action,
      setPrql: action,
      setActivePane: action,
      setResult: action,
      setLoading: action,
      setTransforming: action,
      addHistory: action,
    });
  }

  get runLabel(): "Run PRQL" | "Run SQL" {
    return this.activePane === "prql" ? "Run PRQL" : "Run SQL";
  }

  get runDisabled(): boolean {
    return (
      this.loading ||
      (this.activePane === "prql" ? !this.prql.trim() : !this.sql.trim())
    );
  }

  get canDownload(): boolean {
    return this.result !== null && !("error" in this.result);
  }

  get hasResult(): boolean {
    return this.result !== null;
  }

  get isSuccess(): boolean {
    return this.result !== null && !("error" in this.result);
  }

  get isError(): boolean {
    return this.result !== null && "error" in this.result;
  }

  setSql(value: string) {
    this.sql = value;
  }

  setPrql(value: string) {
    this.prql = value;
  }

  setActivePane(pane: QueryLanguage) {
    this.activePane = pane;
  }

  setResult(result: QueryResponse | null) {
    this.result = result;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setTransforming(transforming: boolean) {
    this.transforming = transforming;
  }

  addHistory(entry: HistoryEntry) {
    this.history = [entry, ...this.history].slice(0, 20);
  }
}

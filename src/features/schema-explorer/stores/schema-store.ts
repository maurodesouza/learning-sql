import { action, computed, observable } from "mobx";
import type { SchemaIntrospection, SchemaTable } from "#/lib/sql/types";

export class SchemaStore {
  @observable accessor schema: SchemaIntrospection | null = null;
  @observable accessor search = "";
  @observable accessor expandedTables = new Set<string>();
  @observable accessor enumsExpanded = false;

  @computed
  get hasSchema(): boolean {
    return this.schema !== null;
  }

  @computed
  get enums() {
    return this.schema?.enums ?? [];
  }

  @computed
  get filteredTables(): SchemaTable[] {
    if (!this.schema) return [];
    if (!this.search) return this.schema.tables;
    const q = this.search.toLowerCase();
    return this.schema.tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q)),
    );
  }

  @action
  setSchema(schema: SchemaIntrospection | null) {
    this.schema = schema;
  }

  @action
  setSearch(value: string) {
    this.search = value;
  }

  @action
  toggleTable(name: string) {
    const next = new Set(this.expandedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.expandedTables = next;
  }

  @action
  toggleEnums() {
    this.enumsExpanded = !this.enumsExpanded;
  }
}

/**
 * Shared singleton — the schema introspection is global (one database).
 * Used by cross-feature consumers such as the query-console code editor
 * for SQL autocompletion.
 */
export const schemaStore = new SchemaStore();

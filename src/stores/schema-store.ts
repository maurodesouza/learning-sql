import { action, computed, observable } from "mobx";
import type { SchemaIntrospection } from "#/lib/sql/types";

export class SchemaStore {
  @observable accessor schema: SchemaIntrospection | null = null;
  @observable accessor schemaLoading = false;

  @computed
  get hasSchema(): boolean {
    return this.schema !== null;
  }

  @action
  setSchema(schema: SchemaIntrospection | null) {
    this.schema = schema;
  }

  @action
  setSchemaLoading(loading: boolean) {
    this.schemaLoading = loading;
  }
}

export const schemaStore = new SchemaStore();

import { action, computed, makeObservable, observable } from "mobx";
import type { SchemaIntrospection } from "#/lib/sql/types";

export class SchemaStore {
  schema: SchemaIntrospection | null = null;
  schemaLoading = false;

  constructor() {
    makeObservable(this, {
      schema: observable.ref,
      schemaLoading: observable,
      hasSchema: computed,
      setSchema: action,
      setSchemaLoading: action,
    });
  }

  get hasSchema(): boolean {
    return this.schema !== null;
  }

  setSchema(schema: SchemaIntrospection | null) {
    this.schema = schema;
  }

  setSchemaLoading(loading: boolean) {
    this.schemaLoading = loading;
  }
}

export const schemaStore = new SchemaStore();

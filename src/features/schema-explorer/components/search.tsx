"use client";

import { observer } from "mobx-react-lite";
import { actions } from "#/lib/command";
import { useSchemaStore } from "../context/schema-explorer-context";

export const Search = observer(function Search() {
  const store = useSchemaStore();

  return (
    <input
      type="text"
      placeholder="Search tables or columns..."
      value={store.search}
      onChange={(e) => actions.schema.search.set(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
});

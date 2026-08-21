"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSchemaStore } from "#/features/schema-explorer/context/schema-explorer-context";
import { actions, command } from "#/lib/command";
import { fetchSchema } from "#/lib/sql/client";

export function SchemaDataHandle() {
  const store = useSchemaStore();

  async function handleFetch() {
    try {
      const s = await fetchSchema();
      store.setSchema(s);
    } catch (_err) {
      // Schema fetch failures are surfaced via the empty-schema state in the UI.
    }
  }

  async function handleRefresh() {
    try {
      const s = await fetchSchema();
      store.setSchema(s);
      toast.success("Schema refreshed");
    } catch (_err) {
      toast.error("Failed to refresh schema");
    }
  }

  async function handleSearchSet(payload: string) {
    store.setSearch(payload);
  }

  async function handleTableToggle(payload: string) {
    store.toggleTable(payload);
  }

  async function handleTableCopySelect(payload: string) {
    const sql = `SELECT * FROM ${payload} LIMIT 10;`;
    try {
      await navigator.clipboard.writeText(sql);
      toast.success(`Copied \`${sql}\` to clipboard`);
    } catch (_err) {
      toast.error("Failed to copy to clipboard");
    }
  }

  async function handleEnumsToggle() {
    store.toggleEnums();
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the store and only need to register once on mount
  useEffect(() => {
    const disposes = [
      command.handle("schema.data.fetch", handleFetch),
      command.handle("schema.data.refresh", handleRefresh),
      command.handle("schema.search.set", handleSearchSet),
      command.handle("schema.table.toggle", handleTableToggle),
      command.handle("schema.table.copySelect", handleTableCopySelect),
      command.handle("schema.enums.toggle", handleEnumsToggle),
    ];

    // Load schema on mount — dispatch through the actions proxy so the
    // shared ["schema"] transition is tracked by useTransition.
    actions.schema.data.fetch(undefined, { transition: ["schema"] });

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, [store]);

  return null;
}

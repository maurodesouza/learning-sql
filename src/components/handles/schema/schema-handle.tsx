"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { command } from "#/lib/command";
import { fetchSchema } from "#/lib/sql/client";
import { schemaStore } from "#/stores/schema-store";
import "./schema-actions";

export function SchemaHandle() {
  async function handleFetch() {
    schemaStore.setSchemaLoading(true);
    try {
      const s = await fetchSchema();
      schemaStore.setSchema(s);
      schemaStore.setSchemaLoading(false);
    } catch (_err) {
      schemaStore.setSchemaLoading(false);
    }
  }

  async function handleRefresh() {
    schemaStore.setSchemaLoading(true);
    try {
      const s = await fetchSchema();
      schemaStore.setSchema(s);
      schemaStore.setSchemaLoading(false);
      toast.success("Schema refreshed");
    } catch (_err) {
      schemaStore.setSchemaLoading(false);
      toast.error("Failed to refresh schema");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the singleton store and only need to register once on mount
  useEffect(() => {
    const disposes = [
      command.handle("schema.fetch", handleFetch),
      command.handle("schema.refresh", handleRefresh),
    ];

    // Load schema on mount
    handleFetch();

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, []);

  return null;
}

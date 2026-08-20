"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { actions, command } from "#/lib/command";
import { fetchSchema } from "#/lib/sql/client";
import { schemaStore } from "#/stores/schema-store";
import "./schema-actions";

export function SchemaHandle() {
  async function handleFetch() {
    try {
      const s = await fetchSchema();
      schemaStore.setSchema(s);
    } catch (_err) {
      // Schema fetch failures are surfaced via the empty-schema state in the UI.
    }
  }

  async function handleRefresh() {
    try {
      const s = await fetchSchema();
      schemaStore.setSchema(s);
      toast.success("Schema refreshed");
    } catch (_err) {
      toast.error("Failed to refresh schema");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the singleton store and only need to register once on mount
  useEffect(() => {
    const disposes = [
      command.handle("schema.fetch", handleFetch),
      command.handle("schema.refresh", handleRefresh),
    ];

    // Load schema on mount — dispatch through the actions proxy so the
    // shared ["schema"] transition is tracked by useTransition.
    actions.schema.fetch(undefined, { transition: ["schema"] });

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, []);

  return null;
}

"use client";

import {
  Actions,
  DockLocation,
  type ILayoutApi,
  type Model,
} from "flexlayout-react";
import { useEffect } from "react";
import { command } from "#/lib/command";
import { useWorkspaceStore } from "../../../context/workspace-context";

function resolveTargetTabsetId(model: Model): string | undefined {
  const active = model.getActiveTabset();
  if (active) return active.getId();
  const root = model.getRootRow();
  const firstTabset = root
    ?.getChildren()
    ?.find((c) => c.getType() === "tabset");
  return firstTabset?.getId();
}

function addTab(
  model: Model,
  layoutApi: ILayoutApi | null,
  tab: {
    type: "tab";
    name: string;
    component: string;
    config?: Record<string, unknown>;
  },
) {
  const tabsetId = resolveTargetTabsetId(model);
  if (!tabsetId) return;
  model.doAction(Actions.addTab(tab, tabsetId, DockLocation.CENTER, -1, true));
  layoutApi?.redraw();
}

export function WorkspaceHandle() {
  const store = useWorkspaceStore();

  async function handleAddQueryConsole() {
    store.consoleCounter += 1;
    const instanceId = `console-${store.consoleCounter}`;
    addTab(store.model, store.layoutApi, {
      type: "tab",
      name: "Query Console",
      component: "queryConsole",
      config: { instanceId },
    });
  }

  async function handleAddSchemaExplorer() {
    addTab(store.model, store.layoutApi, {
      type: "tab",
      name: "Schema",
      component: "schemaExplorer",
    });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the store and only need to register once
  useEffect(() => {
    const disposes = [
      command.handle("workspace.addQueryConsole", handleAddQueryConsole),
      command.handle("workspace.addSchemaExplorer", handleAddSchemaExplorer),
    ];

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, [store]);

  return null;
}

"use client";

import {
  Actions,
  DockLocation,
  Model as FlexLayoutModel,
  type ILayoutApi,
  type Model,
} from "flexlayout-react";
import { useRef, useState } from "react";
import "flexlayout-react/style/light.css";
import { INITIAL_MODEL } from "../model";
import { SideMenu } from "./side-menu";
import { WorkspaceLayout } from "./workspace-layout";

/**
 * Owns the flexlayout Model and the tab-add logic. The model is created once
 * from the initial JSON and kept stable across renders (flexlayout mutates it
 * in place). A thin SideMenu on the left lets the user add new Query Console
 * and Schema Explorer tabs.
 */
export function Workspace() {
  const [model] = useState<Model>(() =>
    FlexLayoutModel.fromJson(INITIAL_MODEL),
  );
  const layoutRef = useRef<ILayoutApi>(null);
  const consoleCounter = useRef(1);

  function resolveTargetTabsetId(): string | undefined {
    const active = model.getActiveTabset();
    if (active) return active.getId();
    const root = model.getRootRow();
    const firstTabset = root
      ?.getChildren()
      ?.find((c) => c.getType() === "tabset");
    return firstTabset?.getId();
  }

  function addQueryConsole() {
    consoleCounter.current += 1;
    const instanceId = `console-${consoleCounter.current}`;
    const tabsetId = resolveTargetTabsetId();
    if (!tabsetId) return;
    model.doAction(
      Actions.addTab(
        {
          type: "tab",
          name: "Query Console",
          component: "queryConsole",
          config: { instanceId },
        },
        tabsetId,
        DockLocation.CENTER,
        -1,
        true,
      ),
    );
    layoutRef.current?.redraw();
  }

  function addSchemaExplorer() {
    const tabsetId = resolveTargetTabsetId();
    if (!tabsetId) return;
    model.doAction(
      Actions.addTab(
        {
          type: "tab",
          name: "Schema",
          component: "schemaExplorer",
        },
        tabsetId,
        DockLocation.CENTER,
        -1,
        true,
      ),
    );
    layoutRef.current?.redraw();
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <SideMenu
        onAddQueryConsole={addQueryConsole}
        onAddSchemaExplorer={addSchemaExplorer}
      />
      <WorkspaceLayout ref={layoutRef} model={model} />
    </div>
  );
}

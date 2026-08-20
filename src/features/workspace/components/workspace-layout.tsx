"use client";

import { Plus, Table2 } from "lucide-react";
import { useRef } from "react";
import {
  Actions,
  DockLocation,
  type ILayoutApi,
  Layout,
  type Model,
  type TabNode,
} from "flexlayout-react";
import "flexlayout-react/style/light.css";
import { Button } from "#/components/atoms/button";
import { SchemaExplorer } from "#/features/schema-explorer";
import { QueryConsoleHandle } from "#/features/query-console/components/handles/query-console/query-console-handle";
import { QueryConsolePanel } from "#/features/query-console/components/templates/query-console-panel";

export function WorkspaceLayout({ model }: { model: Model }) {
  const layoutRef = useRef<ILayoutApi>(null);
  const consoleCounter = useRef(1);

  function factory(node: TabNode): React.ReactNode {
    const component = node.getComponent();
    if (component === "queryConsole") {
      const config = node.getConfig() as { instanceId?: string } | undefined;
      const instanceId = config?.instanceId ?? node.getId();
      return (
        <QueryConsoleHandle instanceId={instanceId}>
          <QueryConsolePanel />
        </QueryConsoleHandle>
      );
    }
    if (component === "schemaExplorer") {
      return <SchemaExplorer />;
    }
    return <div>Unknown component</div>;
  }

  function resolveTargetTabsetId(): string | undefined {
    const active = model.getActiveTabset();
    if (active) return active.getId();
    // Fall back to the first tabset in the root row.
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
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <Layout
        ref={layoutRef}
        model={model}
        factory={factory}
        supportsPopout={false}
      />
      {/* Add buttons overlay (bottom-left corner) */}
      <div className="absolute bottom-3 left-3 z-50 flex gap-2">
        <Button variant="outline" size="sm" onClick={addQueryConsole}>
          <Plus className="h-4 w-4" />
          Add Query Console
        </Button>
        <Button variant="outline" size="sm" onClick={addSchemaExplorer}>
          <Table2 className="h-4 w-4" />
          Add Schema Explorer
        </Button>
      </div>
    </div>
  );
}

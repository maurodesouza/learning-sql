"use client";

import {
  type ILayoutApi,
  Layout,
  type Model,
  type TabNode,
} from "flexlayout-react";
import { forwardRef } from "react";
import { QueryConsoleHandle } from "#/features/query-console/components/handles/query-console/query-console-handle";
import { QueryConsolePanel } from "#/features/query-console/components/templates/query-console-panel";
import { SchemaExplorer } from "#/features/schema-explorer";

export interface WorkspaceLayoutProps {
  model: Model;
}

export const WorkspaceLayout = forwardRef<ILayoutApi, WorkspaceLayoutProps>(
  function WorkspaceLayout({ model }, ref) {
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

    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Layout
          ref={ref}
          model={model}
          factory={factory}
          supportsPopout={false}
        />
      </div>
    );
  },
);

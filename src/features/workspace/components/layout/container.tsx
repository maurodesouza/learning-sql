"use client";

import { Layout, type TabNode } from "flexlayout-react";
import { forwardRef, type Ref } from "react";
import "flexlayout-react/style/light.css";
import type { ILayoutApi } from "flexlayout-react";
import { useWorkspaceStore } from "../../context/workspace-context";

export interface ContainerProps {
  factory: (node: TabNode) => React.ReactNode;
  apiRef?: Ref<ILayoutApi>;
}

export const Container = forwardRef<ILayoutApi, ContainerProps>(
  function Container({ factory, apiRef }, ref) {
    const store = useWorkspaceStore();

    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Layout
          ref={(api: ILayoutApi | null) => {
            store.setLayoutApi(api);
            if (typeof ref === "function") ref(api);
            else if (ref && api) ref.current = api;
            if (apiRef) {
              if (typeof apiRef === "function") apiRef(api);
              else if (api) apiRef.current = api;
            }
          }}
          model={store.model}
          factory={factory}
          supportsPopout={false}
        />
      </div>
    );
  },
);

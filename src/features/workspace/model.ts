import type { IJsonModel } from "flexlayout-react";

/**
 * Initial flexlayout model: one Schema Explorer tab (left, weight 25) and
 * one Query Console tab (right, weight 75), side by side in a row.
 */
export const INITIAL_MODEL: IJsonModel = {
  global: {
    tabSetEnableTabStrip: true,
    tabEnableClose: true,
    tabSetEnableMaximize: false,
  },
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 25,
        active: true,
        children: [
          {
            type: "tab",
            name: "Schema",
            component: "schemaExplorer",
          },
        ],
      },
      {
        type: "tabset",
        weight: 75,
        children: [
          {
            type: "tab",
            name: "Query Console",
            component: "queryConsole",
            config: { instanceId: "console-1" },
          },
        ],
      },
    ],
  },
};

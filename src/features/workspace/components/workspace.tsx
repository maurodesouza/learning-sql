"use client";

import { Model } from "flexlayout-react";
import { useState } from "react";
import { INITIAL_MODEL } from "../model";
import { WorkspaceLayout } from "./workspace-layout";

/**
 * Owns the flexlayout Model instance for the workspace. The model is created
 * once from the initial JSON and kept stable across renders (flexlayout
 * mutates it in place).
 */
export function Workspace() {
  const [model] = useState<Model>(() => Model.fromJson(INITIAL_MODEL));
  return <WorkspaceLayout model={model} />;
}

"use client";

import type { SchemaEnum } from "#/lib/sql/types";
import { EnumContext } from "./context";

export interface ProviderProps {
  enum: SchemaEnum;
  children: React.ReactNode;
}

export function Provider({ enum: enum_, children }: ProviderProps) {
  return <EnumContext.Provider value={enum_}>{children}</EnumContext.Provider>;
}

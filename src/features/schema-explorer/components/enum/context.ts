import { createContext, useContext } from "react";
import type { SchemaEnum } from "#/lib/sql/types";

export const EnumContext = createContext<SchemaEnum | null>(null);

export function useEnum(): SchemaEnum {
  const enum_ = useContext(EnumContext);
  if (!enum_) {
    throw new Error("useEnum must be used within Enum.Provider");
  }
  return enum_;
}

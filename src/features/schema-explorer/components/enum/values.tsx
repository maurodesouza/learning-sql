"use client";

import { useEnum } from "./context";

export function Values() {
  const enum_ = useEnum();
  return (
    <div className="ml-2 text-[10px] text-muted-foreground">
      {enum_.values.join(", ")}
    </div>
  );
}

"use client";

import { useEnum } from "./context";

export function Name() {
  const enum_ = useEnum();
  return <div className="font-mono text-xs font-medium">{enum_.name}</div>;
}

"use client";

export interface RowProps {
  children: React.ReactNode;
}

export function Row({ children }: RowProps) {
  return <div className="flex items-center gap-1">{children}</div>;
}

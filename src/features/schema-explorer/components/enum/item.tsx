"use client";

export interface ItemProps {
  children: React.ReactNode;
}

export function Item({ children }: ItemProps) {
  return <div className="mb-1">{children}</div>;
}

"use client";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return <div className="flex h-full min-h-0 flex-col">{children}</div>;
}

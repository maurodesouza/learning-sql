"use client";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>;
}

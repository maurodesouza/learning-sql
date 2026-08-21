"use client";

import { cn } from "#/lib/utils";

export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("flex h-full flex-col min-h-0", className)}>
      {children}
    </div>
  );
}

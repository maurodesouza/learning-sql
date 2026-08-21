"use client";

import { ScrollArea } from "#/components/atoms/scroll-area";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <ScrollArea className="flex-1 overflow-auto">
      <div className="flex flex-col gap-3 p-3">{children}</div>
    </ScrollArea>
  );
}

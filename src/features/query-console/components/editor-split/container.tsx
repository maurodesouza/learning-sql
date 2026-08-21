"use client";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="h-72 shrink-0 overflow-hidden border-b">
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

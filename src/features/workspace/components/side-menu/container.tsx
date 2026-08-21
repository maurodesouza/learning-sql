"use client";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <aside className="flex h-full w-12 flex-col items-center justify-center gap-4 border-r bg-background py-4">
      {children}
    </aside>
  );
}

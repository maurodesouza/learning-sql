"use client";

export interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-1.5">
      {children}
    </div>
  );
}

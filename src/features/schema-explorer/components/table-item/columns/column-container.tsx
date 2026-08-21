"use client";

export interface ColumnContainerProps {
  children: React.ReactNode;
}

export function ColumnContainer({ children }: ColumnContainerProps) {
  return (
    <div className="flex items-center gap-1.5 py-0.5 text-xs pr-2">
      {children}
    </div>
  );
}

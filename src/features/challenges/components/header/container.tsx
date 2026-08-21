"use client";

export interface HeaderContainerProps {
  children: React.ReactNode;
}

export function HeaderContainer({ children }: HeaderContainerProps) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">{children}</div>
  );
}

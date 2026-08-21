"use client";

export interface HeaderProps {
  children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return <div className="flex items-center gap-2 border-b p-3">{children}</div>;
}

"use client";

export interface PaneHeaderProps {
  label: string;
  action?: React.ReactNode;
  shortcut: string;
}

export function PaneHeader({ label, action, shortcut }: PaneHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-muted/40 px-3 py-1">
      <span className="text-xs font-semibold tracking-wide">{label}</span>
      {action}
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
        {shortcut}
      </span>
    </div>
  );
}

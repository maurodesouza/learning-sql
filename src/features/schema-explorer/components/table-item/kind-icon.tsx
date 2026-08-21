"use client";

import { Box, Table2 } from "lucide-react";
import { useTableItem } from "./context";

function ViewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden="true"
      {...props}
    >
      <title>View</title>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function KindIcon() {
  const table = useTableItem();
  const Icon =
    table.kind === "table" ? Table2 : table.kind === "view" ? ViewIcon : Box;

  return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

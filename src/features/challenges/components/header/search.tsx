"use client";

import { Search } from "lucide-react";
import { actions } from "#/lib/command";

export function SearchInput() {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search challenges..."
        className="h-8 w-full rounded-md border bg-transparent pl-7 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        onChange={(e) => actions.challenges.filter.setSearch(e.target.value)}
      />
    </div>
  );
}

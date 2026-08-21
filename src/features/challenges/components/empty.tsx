"use client";

import { Trophy } from "lucide-react";

export function Empty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <Trophy className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No challenges found.</p>
    </div>
  );
}

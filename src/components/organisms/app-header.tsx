import { Database } from "lucide-react";
import { Separator } from "#/components/atoms/separator";

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-2">
      <Database className="h-5 w-5 text-primary" />
      <h1 className="text-lg font-semibold">SQL Learning Lab</h1>
      <Separator orientation="vertical" className="h-6" />
    </header>
  );
}

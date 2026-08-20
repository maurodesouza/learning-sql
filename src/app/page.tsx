import { Toaster } from "sonner";
import { SchemaHandle } from "#/components/handles/schema/schema-handle";
import { AppHeader } from "#/components/organisms/app-header";
import { QueryConsoleHandle } from "#/features/query-console/components/handles/query-console/query-console-handle";
import { QueryConsolePanel } from "#/features/query-console/components/templates/query-console-panel";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <SchemaHandle />
      <Toaster richColors position="bottom-right" />
      <AppHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <QueryConsoleHandle instanceId="console-1">
          <QueryConsolePanel />
        </QueryConsoleHandle>
      </div>
    </div>
  );
}

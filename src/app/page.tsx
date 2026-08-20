import { Toaster } from "sonner";
import { SchemaHandle } from "#/components/handles/schema/schema-handle";
import { AppHeader } from "#/components/organisms/app-header";
import { Workspace } from "#/features/workspace";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <SchemaHandle />
      <Toaster richColors position="bottom-right" />
      <AppHeader />
      <Workspace />
    </div>
  );
}

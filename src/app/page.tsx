import { SchemaHandle } from "#/components/handles/schema/schema-handle";
import { QueryConsoleHandle } from "#/features/query-console/components/handles/query-console/query-console-handle";
import { QueryConsoleTemplate } from "#/features/query-console/components/templates/query-console-template";

export default function Home() {
  return (
    <>
      <SchemaHandle />
      <QueryConsoleHandle instanceId="console-1">
        <QueryConsoleTemplate />
      </QueryConsoleHandle>
    </>
  );
}

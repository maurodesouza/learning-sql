"use client";

import { observer } from "mobx-react-lite";
import { Fragment, type ReactNode } from "react";
import { ScrollArea } from "#/components/atoms/scroll-area";
import type { SchemaEnum } from "#/lib/sql/types";
import { useSchemaStore } from "../../context/schema-explorer-context";
import { Provider as EnumProvider } from "../enum/provider";

export interface ListProps {
  render: (enum_: SchemaEnum) => ReactNode;
  empty?: ReactNode;
}

export const List = observer(function List({ render, empty }: ListProps) {
  const store = useSchemaStore();

  if (!store.enumsExpanded) return null;

  const enums = store.enums;

  if (enums.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <ScrollArea className="max-h-48">
      <div className="ml-5 border-l pl-2 pb-2">
        {enums.map((e) => (
          <Fragment key={e.name}>
            <EnumProvider enum={e}>{render(e)}</EnumProvider>
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  );
});

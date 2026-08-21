"use client";

import { observer } from "mobx-react-lite";
import { useQueryConsoleStore } from "../../context/query-console-context";
import { Grid } from "./grid";
import { Header } from "./header";

export const GridWrapper = observer(function GridWrapper() {
  const store = useQueryConsoleStore();

  if (!store.isSuccess) return null;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Grid />
      </div>
    </div>
  );
});

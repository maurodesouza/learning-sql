"use client";

import { observer } from "mobx-react-lite";
import { useTransition } from "#/hooks/use-transition";
import { useQueryConsoleStore } from "../../context/query-console-context";

export interface ContainerProps {
  loading?: React.ReactNode;
  ok?: React.ReactNode;
  error?: React.ReactNode;
  empty?: React.ReactNode;
}

export const Container = observer(function Container({
  loading,
  ok,
  error,
  empty,
}: ContainerProps) {
  const store = useQueryConsoleStore();
  const { instanceId } = store;
  const isLoading = useTransition(["queryConsole.run", instanceId]);

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      {isLoading
        ? loading
        : store.hasResult
          ? store.isSuccess
            ? ok
            : error
          : empty}
    </div>
  );
});

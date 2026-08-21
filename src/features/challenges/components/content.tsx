"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";

export interface ContentProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  loading: React.ReactNode;
}

/**
 * Slot switch: renders `detail` when a challenge is selected, otherwise `list`.
 * The `loading` slot is shown while the initial fetch is in progress.
 */
export const Content = observer(function Content({
  list,
  detail,
  loading,
}: ContentProps) {
  const store = useChallengesStore();

  if (store.challenges.length === 0 && store.search === "") {
    return <>{loading}</>;
  }

  if (store.isDetailOpen) {
    return <>{detail}</>;
  }

  return <>{list}</>;
});

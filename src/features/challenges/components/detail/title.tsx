"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";

export const Title = observer(function Title() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;
  return (
    <span className="truncate text-sm font-semibold">{challenge.title}</span>
  );
});

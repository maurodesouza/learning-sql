"use client";

import { observer } from "mobx-react-lite";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import type { LevelFilter as LevelFilterValue } from "#/features/challenges/stores/challenges-store";
import { actions } from "#/lib/command";

const LEVELS: { value: LevelFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "MID_LEVEL", label: "Mid" },
  { value: "SENIOR", label: "Senior" },
  { value: "EXPERT", label: "Expert" },
];

export const LevelFilterSelect = observer(function LevelFilterSelect() {
  const store = useChallengesStore();

  return (
    <select
      value={store.levelFilter}
      onChange={(e) =>
        actions.challenges.filter.setLevel(e.target.value as LevelFilterValue)
      }
      className="h-8 rounded-md border bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {LEVELS.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
});

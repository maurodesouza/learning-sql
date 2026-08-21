"use client";

import { observer } from "mobx-react-lite";
import { ScrollArea } from "#/components/atoms/scroll-area";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";

export const Prompt = observer(function Prompt() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;

  return (
    <ScrollArea className="h-48 shrink-0 overflow-hidden">
      <div className="whitespace-pre-wrap p-3 text-sm leading-relaxed">
        {challenge.prompt}
      </div>
    </ScrollArea>
  );
});

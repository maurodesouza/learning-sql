"use client";

import { Eye } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "#/components/atoms/button";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { actions } from "#/lib/command";
import { ExpectedResultTable } from "./expected-result-table";

export const ExpectedResult = observer(function ExpectedResult() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;

  if (store.revealedResult) {
    return (
      <ExpectedResultTable
        columns={store.revealedResult.columns}
        rows={store.revealedResult.rows}
      />
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => actions.challenges.reveal.result()}
    >
      <Eye className="h-4 w-4" />
      Show Expected Result
    </Button>
  );
});

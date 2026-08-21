"use client";

import { Code, Copy } from "lucide-react";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";
import { Button } from "#/components/atoms/button";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { actions } from "#/lib/command";
import { ExpectedResultTable } from "./expected-result-table";

export const Solution = observer(function Solution() {
  const store = useChallengesStore();
  const challenge = store.selectedChallenge;
  if (!challenge) return null;

  if (store.revealedSolution) {
    return (
      <div className="flex flex-col gap-2">
        <pre className="overflow-auto rounded-md border bg-muted/20 p-3 text-xs font-mono">
          {store.revealedSolution.solutionSql}
        </pre>
        <ExpectedResultTable
          columns={store.revealedSolution.resultColumns}
          rows={store.revealedSolution.resultRows}
        />
        {store.boundConsoleId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const solution = store.revealedSolution;
              const consoleId = store.boundConsoleId;
              if (!solution || !consoleId) return;
              actions.queryConsole.editor.sql(
                {
                  template: solution.solutionSql,
                  activatePanel: true,
                },
                { instanceId: consoleId },
              );
              toast.success("Solution copied to console.");
            }}
            className="w-fit"
          >
            <Copy className="h-4 w-4" />
            Copy to Console
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => actions.challenges.reveal.solution()}
      className="w-fit"
    >
      <Code className="h-4 w-4" />
      {store.solutionConfirming ? "Click again to confirm" : "Show Solution"}
    </Button>
  );
});

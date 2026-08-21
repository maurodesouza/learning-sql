"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  checkChallenge,
  revealChallenge,
} from "#/features/challenges/api/client";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import type { QueryConsoleSource } from "#/features/query-console/components/handles/query-console/query-console-actions";
import { useInstances } from "#/hooks/use-instances";
import { actions, command } from "#/lib/command";

export function ChallengeAttemptHandle() {
  const store = useChallengesStore();
  const consoles = useInstances("queryConsole");

  // Auto-bind when exactly one console exists and none is bound.
  useEffect(() => {
    if (consoles.length === 1 && !store.boundConsoleId) {
      store.setBoundConsoleId(consoles[0]?.id ?? null);
    }
    // Clear binding if the bound console was closed.
    if (
      store.boundConsoleId &&
      !consoles.some((c) => c.id === store.boundConsoleId)
    ) {
      store.setBoundConsoleId(null);
      toast.warning("The bound console was closed.");
    }
  }, [consoles, store.boundConsoleId, store]);

  async function handleConsoleBind(payload: string | null) {
    store.setBoundConsoleId(payload);
  }

  async function handleLoadStarter() {
    const challenge = store.selectedChallenge;
    if (!challenge?.starterSql) {
      toast.error("This challenge has no starter query.");
      return;
    }
    const consoleId = store.boundConsoleId;
    if (!consoleId) {
      toast.error("Bind a query console first.");
      return;
    }
    actions.queryConsole.editor.sql(
      { template: challenge.starterSql, activatePanel: true },
      { instanceId: consoleId },
    );
    toast.success("Starter query loaded into the console.");
  }

  async function handleCheck() {
    const slug = store.selectedSlug;
    const consoleId = store.boundConsoleId;
    if (!slug || !consoleId) {
      toast.error("Select a challenge and bind a console first.");
      return;
    }

    let source: QueryConsoleSource;
    try {
      source = await actions.queryConsole.getSource(undefined, {
        instanceId: consoleId,
      });
    } catch {
      toast.error("Could not read the bound console.");
      return;
    }

    try {
      const response = await checkChallenge(
        slug,
        source.source,
        source.language,
      );
      store.setCheckResult(response.result);
      store.updateProgress(slug, {
        status: response.progress.status,
        attempts: response.progress.attempts,
        solvedAt: response.progress.solvedAt,
        revealedResult:
          store.selectedChallenge?.progress?.revealedResult ?? false,
        revealedHints: store.selectedChallenge?.progress?.revealedHints ?? 0,
        revealedSolution:
          store.selectedChallenge?.progress?.revealedSolution ?? false,
      });

      if (response.result.correct) {
        toast.success("Correct! Challenge solved.");
      } else if (response.result.error) {
        toast.error(response.result.error);
      } else {
        toast.warning("Not quite — keep trying.");
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    }
  }

  async function handleRevealResult() {
    const slug = store.selectedSlug;
    if (!slug) return;
    try {
      const res = await revealChallenge(slug, "result");
      if (res.reveal === "result") {
        store.setRevealedResult({
          columns: res.resultColumns,
          rows: res.resultRows,
        });
        const challenge = store.selectedChallenge;
        store.updateProgress(slug, {
          status: challenge?.progress?.status ?? "ATTEMPTED",
          attempts: challenge?.progress?.attempts ?? 0,
          solvedAt: challenge?.progress?.solvedAt ?? null,
          revealedResult: true,
          revealedHints: challenge?.progress?.revealedHints ?? 0,
          revealedSolution: challenge?.progress?.revealedSolution ?? false,
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleRevealHint() {
    const slug = store.selectedSlug;
    if (!slug) return;
    try {
      const res = await revealChallenge(slug, "hints", 1);
      if (res.reveal === "hints") {
        store.addRevealedHints(res.revealedHints);
        const challenge = store.selectedChallenge;
        store.updateProgress(slug, {
          status: challenge?.progress?.status ?? "ATTEMPTED",
          attempts: challenge?.progress?.attempts ?? 0,
          solvedAt: challenge?.progress?.solvedAt ?? null,
          revealedResult: challenge?.progress?.revealedResult ?? false,
          revealedHints: res.revealedCount,
          revealedSolution: challenge?.progress?.revealedSolution ?? false,
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleRevealSolution() {
    const slug = store.selectedSlug;
    if (!slug) return;

    // Two-click confirmation: first click sets confirming, second reveals.
    if (!store.solutionConfirming) {
      store.setSolutionConfirming(true);
      return;
    }

    try {
      const res = await revealChallenge(slug, "solution");
      if (res.reveal === "solution") {
        store.setRevealedSolution({
          solutionSql: res.solutionSql,
          resultRows: res.resultRows,
          resultColumns: res.resultColumns,
        });
        const challenge = store.selectedChallenge;
        store.updateProgress(slug, {
          status: challenge?.progress?.status ?? "ATTEMPTED",
          attempts: challenge?.progress?.attempts ?? 0,
          solvedAt: challenge?.progress?.solvedAt ?? null,
          revealedResult: true,
          revealedHints: challenge?.progress?.revealedHints ?? 0,
          revealedSolution: true,
        });
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the store and only need to register once on mount
  useEffect(() => {
    const disposes = [
      command.handle("challenges.console.bind", handleConsoleBind),
      command.handle("challenges.console.loadStarter", handleLoadStarter),
      command.handle("challenges.check", handleCheck),
      command.handle("challenges.reveal.result", handleRevealResult),
      command.handle("challenges.reveal.hint", handleRevealHint),
      command.handle("challenges.reveal.solution", handleRevealSolution),
    ];

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, [store]);

  return null;
}

"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { listChallenges } from "#/features/challenges/api/client";
import { useChallengesStore } from "#/features/challenges/context/challenges-context";
import { actions, command } from "#/lib/command";

export function ChallengesDataHandle() {
  const store = useChallengesStore();

  async function handleFetch() {
    try {
      const { challenges } = await listChallenges();
      store.setChallenges(challenges);
    } catch (_err) {
      // Fetch failures are surfaced via the empty state in the UI.
    }
  }

  async function handleRefresh() {
    try {
      const { challenges } = await listChallenges();
      store.setChallenges(challenges);
      toast.success("Challenges refreshed");
    } catch (_err) {
      toast.error("Failed to refresh challenges");
    }
  }

  async function handleSelect(payload: string) {
    store.selectChallenge(payload);
  }

  async function handleBack() {
    store.selectChallenge(null);
  }

  async function handleSetSearch(payload: string) {
    store.setSearch(payload);
  }

  async function handleSetLevel(
    payload: Parameters<typeof store.setLevelFilter>[0],
  ) {
    store.setLevelFilter(payload);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handlers close over the store and only need to register once on mount
  useEffect(() => {
    const disposes = [
      command.handle("challenges.data.fetch", handleFetch),
      command.handle("challenges.data.refresh", handleRefresh),
      command.handle("challenges.select", handleSelect),
      command.handle("challenges.back", handleBack),
      command.handle("challenges.filter.setSearch", handleSetSearch),
      command.handle("challenges.filter.setLevel", handleSetLevel),
    ];

    // Load challenges on mount — dispatch through the actions proxy so the
    // shared ["challenges"] transition is tracked by useTransition.
    actions.challenges.data.fetch(undefined, { transition: ["challenges"] });

    return () => {
      for (const dispose of disposes) dispose();
    };
  }, [store]);

  return null;
}

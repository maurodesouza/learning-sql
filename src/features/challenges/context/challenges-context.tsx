"use client";

import { createContext, useContext } from "react";
import type { ChallengesStore } from "../stores/challenges-store";

export const ChallengesContext = createContext<ChallengesStore | null>(null);

export function useChallengesStore(): ChallengesStore {
  const store = useContext(ChallengesContext);
  if (!store) {
    throw new Error(
      "useChallengesStore must be used within Challenges.Provider",
    );
  }
  return store;
}

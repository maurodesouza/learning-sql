"use client";

import { ChallengesContext } from "../context/challenges-context";
import { challengesStore } from "../stores/challenges-store";

export interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return (
    <ChallengesContext.Provider value={challengesStore}>
      {children}
    </ChallengesContext.Provider>
  );
}

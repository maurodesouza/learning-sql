"use client";

import { Challenges } from "#/features/challenges";

export interface ChallengesTabProps {
  children: React.ReactNode;
}

export function ChallengesTab({ children }: ChallengesTabProps) {
  return (
    <Challenges.Provider>
      <Challenges.Handles />
      <Challenges.Container>{children}</Challenges.Container>
    </Challenges.Provider>
  );
}

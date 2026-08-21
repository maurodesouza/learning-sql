"use client";

import { ChallengeAttemptHandle } from "./attempt/challenge-attempt-handle";
import { ChallengesDataHandle } from "./data/challenges-data-handle";

export function ChallengesHandles() {
  return (
    <>
      <ChallengesDataHandle />
      <ChallengeAttemptHandle />
    </>
  );
}

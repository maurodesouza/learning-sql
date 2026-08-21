/**
 * GET /api/challenges — list all challenges (solution_sql excluded).
 *
 * Returns challenges grouped by level, with progress and revealed hints.
 * The solution_sql column is never sent to the client.
 */

import { toChallengeDTO } from "#/lib/challenges/projection";
import { prisma } from "#/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const challenges = await prisma.challenge.findMany({
    orderBy: [{ level: "asc" }, { orderIndex: "asc" }],
    include: {
      hints: { orderBy: { position: "asc" } },
      progress: true,
    },
  });

  const dtos = challenges.map((c) =>
    toChallengeDTO(c, c.progress?.revealedHints ?? 0),
  );

  return Response.json({ challenges: dtos });
}

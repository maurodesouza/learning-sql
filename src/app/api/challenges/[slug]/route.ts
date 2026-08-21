/**
 * GET /api/challenges/[slug] — fetch a single challenge (solution_sql excluded).
 */

import { toChallengeDTO } from "#/lib/challenges/projection";
import { prisma } from "#/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    include: {
      hints: { orderBy: { position: "asc" } },
      progress: true,
    },
  });

  if (!challenge) {
    return Response.json(
      {
        error: { message: `Challenge "${slug}" not found.`, kind: "NOT_FOUND" },
      },
      { status: 404 },
    );
  }

  const dto = toChallengeDTO(challenge, challenge.progress?.revealedHints ?? 0);
  return Response.json(dto);
}

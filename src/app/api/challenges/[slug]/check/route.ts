/**
 * POST /api/challenges/[slug]/check — check a user query against a challenge.
 *
 * Body: { sql: string, language?: "sql" | "prql" }
 * Returns: CheckResult + updated progress.
 */

import { checkChallenge } from "#/lib/challenges/check";
import { prisma } from "#/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckRequestBody {
  sql?: string;
  language?: "sql" | "prql";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  let body: CheckRequestBody;
  try {
    body = (await request.json()) as CheckRequestBody;
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON body.", kind: "INPUT_INVALID" } },
      { status: 400 },
    );
  }

  if (!body.sql || body.sql.trim().length === 0) {
    return Response.json(
      { error: { message: "sql is required.", kind: "INPUT_INVALID" } },
      { status: 400 },
    );
  }

  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!challenge) {
    return Response.json(
      {
        error: { message: `Challenge "${slug}" not found.`, kind: "NOT_FOUND" },
      },
      { status: 404 },
    );
  }

  try {
    const outcome = await checkChallenge({
      challengeId: challenge.id,
      sql: body.sql,
      language: body.language ?? "sql",
    });
    return Response.json(outcome);
  } catch (err) {
    const error = err as Error;
    return Response.json(
      { error: { message: error.message, kind: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}

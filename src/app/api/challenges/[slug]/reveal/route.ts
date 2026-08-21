/**
 * POST /api/challenges/[slug]/reveal — reveal the solution, result, or hints.
 *
 * Body: { reveal: "solution" | "result" | "hints", count?: number }
 *
 * - "solution": returns the solution_sql and its result rows. Sets
 *   revealedSolution = true on progress.
 * - "result": returns the reference result rows (without the solution SQL).
 *   Sets revealedResult = true on progress.
 * - "hints": increments revealedHints by count (default 1) and returns the
 *   newly revealed hints.
 *
 * All reveal actions are recorded on the progress row so the UI can show
 * which spoilers have been exposed.
 */
import { prisma } from "#/lib/db/prisma";
import { readonlyPool } from "#/lib/db/readonly";
import { env } from "#/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RevealRequestBody {
  reveal?: "solution" | "result" | "hints";
  count?: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  let body: RevealRequestBody;
  try {
    body = (await request.json()) as RevealRequestBody;
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON body.", kind: "INPUT_INVALID" } },
      { status: 400 },
    );
  }

  const reveal = body.reveal ?? "hints";
  if (!["solution", "result", "hints"].includes(reveal)) {
    return Response.json(
      {
        error: {
          message: 'reveal must be "solution", "result", or "hints".',
          kind: "INPUT_INVALID",
        },
      },
      { status: 400 },
    );
  }

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

  // Ensure a progress row exists.
  const progress = await prisma.challengeProgress.upsert({
    where: { challengeId: challenge.id },
    create: {
      challengeId: challenge.id,
      status: challenge.progress?.status ?? "ATTEMPTED",
      attempts: challenge.progress?.attempts ?? 0,
    },
    update: {},
    select: {
      id: true,
      revealedHints: true,
      revealedResult: true,
      revealedSolution: true,
    },
  });

  if (reveal === "hints") {
    const count = Math.max(1, body.count ?? 1);
    const newCount = Math.min(
      progress.revealedHints + count,
      challenge.hints.length,
    );

    await prisma.challengeProgress.update({
      where: { challengeId: challenge.id },
      data: { revealedHints: newCount },
    });

    const revealedHints = challenge.hints.slice(0, newCount).map((h) => ({
      id: h.id,
      position: h.position,
      text: h.text,
    }));

    return Response.json({
      reveal: "hints",
      revealedHints,
      totalHints: challenge.hints.length,
      revealedCount: newCount,
    });
  }

  // For "solution" and "result", run the reference query to get rows.
  const referenceResult = await runReadonlyQuery(challenge.solutionSql);

  if (reveal === "result") {
    await prisma.challengeProgress.update({
      where: { challengeId: challenge.id },
      data: { revealedResult: true },
    });

    return Response.json({
      reveal: "result",
      resultColumns: referenceResult.columns,
      resultRows: referenceResult.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < referenceResult.columns.length; i++) {
          obj[referenceResult.columns[i] ?? `col_${i}`] = row[i];
        }
        return obj;
      }),
    });
  }

  // reveal === "solution"
  await prisma.challengeProgress.update({
    where: { challengeId: challenge.id },
    data: { revealedSolution: true, revealedResult: true },
  });

  return Response.json({
    reveal: "solution",
    solutionSql: challenge.solutionSql,
    resultColumns: referenceResult.columns,
    resultRows: referenceResult.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < referenceResult.columns.length; i++) {
        obj[referenceResult.columns[i] ?? `col_${i}`] = row[i];
      }
      return obj;
    }),
  });
}

async function runReadonlyQuery(sql: string): Promise<{
  columns: string[];
  rows: unknown[][];
}> {
  const client = await readonlyPool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${env.queryTimeoutMs}`);
    const result = await client.query({
      text: sql,
      values: [],
      rowMode: "array",
    });
    return {
      columns: result.fields.map((f) => f.name),
      rows: result.rows as unknown[][],
    };
  } finally {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    client.release();
  }
}

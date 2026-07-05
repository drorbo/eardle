import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getOrCreateDailyPuzzle } from "@/lib/daily/generate";
import { toDailyPayload, DailyExerciseSnapshot } from "@/lib/daily/sanitize";
import { MAX_GUESSES, todaysPuzzleDateStr } from "@/lib/daily/config";

export async function GET(req: NextRequest) {
  const [session, token] = await Promise.all([
    auth(),
    Promise.resolve(new URL(req.url).searchParams.get("token")),
  ]);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const puzzle = await getOrCreateDailyPuzzle(todaysPuzzleDateStr());
  if (!puzzle) {
    return NextResponse.json({ error: "No puzzle available today" }, { status: 404 });
  }

  const snapshot: DailyExerciseSnapshot = JSON.parse(puzzle.exerciseSnapshot);
  const performanceParams = JSON.parse(puzzle.performanceParams);

  let attempt = null;
  if (userId) {
    attempt = await db.query.dailyAttempts.findFirst({
      where: and(eq(dailyAttempts.puzzleId, puzzle.id), eq(dailyAttempts.userId, userId)),
    });
  } else if (token) {
    attempt = await db.query.dailyAttempts.findFirst({
      where: and(
        eq(dailyAttempts.puzzleId, puzzle.id),
        isNull(dailyAttempts.userId),
        eq(dailyAttempts.sessionToken, token)
      ),
    });
  }

  const revealed = !!attempt && attempt.status !== "in_progress";

  return NextResponse.json({
    date: puzzle.puzzleDate,
    category: puzzle.category,
    difficulty: puzzle.difficulty,
    maxGuesses: MAX_GUESSES,
    status: attempt?.status ?? "not_started",
    guesses: attempt ? JSON.parse(attempt.guesses) : [],
    performanceParams,
    exercise: toDailyPayload(snapshot, revealed),
  });
}

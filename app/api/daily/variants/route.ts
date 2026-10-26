import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getOrCreateDailyPuzzle } from "@/lib/daily/generate";
import { DailyExerciseSnapshot } from "@/lib/daily/sanitize";
import { todaysPuzzleDateStr } from "@/lib/daily/config";
import { getChoiceVariants } from "@/lib/exercises/choiceVariants";

// Sounds for every choice of today's puzzle. The variant whose config equals the puzzle's own is
// the answer, so this is only served once the caller's attempt is finished (won/lost).
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

  if (!attempt || attempt.status === "in_progress") {
    return NextResponse.json({ error: "Puzzle not finished" }, { status: 403 });
  }

  const snapshot: DailyExerciseSnapshot = JSON.parse(puzzle.exerciseSnapshot);
  return NextResponse.json({ variants: await getChoiceVariants(snapshot) });
}

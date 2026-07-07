import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts, dailyPuzzles, streaks } from "@/lib/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { todaysPuzzleDateStr } from "@/lib/daily/config";

// Lightweight — for the Navbar, called on every page load. Reads the
// persisted streak (no full-history scan) plus a cheap "did they finish
// today's puzzle" check. Deliberately does NOT call getOrCreateDailyPuzzle
// (that generates/persists a puzzle) — a plain read-only lookup, so visiting
// any page never triggers puzzle generation as a side effect.
export async function GET(req: NextRequest) {
  const [session, token] = await Promise.all([
    auth(),
    Promise.resolve(new URL(req.url).searchParams.get("token")),
  ]);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  if (!userId && !token) {
    return NextResponse.json({ currentStreak: 0, playedToday: false });
  }

  const streakRow = await db.query.streaks.findFirst({
    where: userId
      ? and(eq(streaks.userId, userId), eq(streaks.kind, "daily"))
      : and(isNull(streaks.userId), eq(streaks.sessionToken, token!), eq(streaks.kind, "daily")),
  });

  const puzzle = await db.query.dailyPuzzles.findFirst({
    where: eq(dailyPuzzles.puzzleDate, todaysPuzzleDateStr()),
  });

  let playedToday = false;
  if (puzzle) {
    const attempt = await db.query.dailyAttempts.findFirst({
      where: userId
        ? and(eq(dailyAttempts.puzzleId, puzzle.id), eq(dailyAttempts.userId, userId), ne(dailyAttempts.status, "in_progress"))
        : and(eq(dailyAttempts.puzzleId, puzzle.id), isNull(dailyAttempts.userId), eq(dailyAttempts.sessionToken, token!), ne(dailyAttempts.status, "in_progress")),
    });
    playedToday = !!attempt;
  }

  return NextResponse.json({ currentStreak: streakRow?.currentStreak ?? 0, playedToday });
}

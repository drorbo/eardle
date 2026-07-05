import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts, dailyPuzzles } from "@/lib/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";

function isNextCalendarDay(prev: string, next: string): boolean {
  const prevDate = new Date(`${prev}T00:00:00Z`);
  const expected = new Date(prevDate);
  expected.setUTCDate(expected.getUTCDate() + 1);
  return expected.toISOString().slice(0, 10) === next;
}

export async function GET(req: NextRequest) {
  const [session, token] = await Promise.all([
    auth(),
    Promise.resolve(new URL(req.url).searchParams.get("token")),
  ]);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  if (!userId && !token) {
    return NextResponse.json({
      gamesPlayed: 0, winPct: 0, currentStreak: 0, longestStreak: 0,
      distribution: [1, 2, 3, 4, 5].map((g) => ({ guesses: g, count: 0 })), lostCount: 0,
    });
  }

  const identityWhere = userId
    ? and(eq(dailyAttempts.userId, userId), ne(dailyAttempts.status, "in_progress"))
    : and(isNull(dailyAttempts.userId), eq(dailyAttempts.sessionToken, token!), ne(dailyAttempts.status, "in_progress"));

  const rows = await db
    .select({
      status: dailyAttempts.status,
      finalGuessCount: dailyAttempts.finalGuessCount,
      puzzleDate: dailyPuzzles.puzzleDate,
    })
    .from(dailyAttempts)
    .innerJoin(dailyPuzzles, eq(dailyPuzzles.id, dailyAttempts.puzzleId))
    .where(identityWhere)
    .orderBy(dailyPuzzles.puzzleDate);

  const gamesPlayed = rows.length;
  const wins = rows.filter((r) => r.status === "won");
  const winPct = gamesPlayed > 0 ? Math.round((wins.length / gamesPlayed) * 100) : 0;
  const lostCount = rows.length - wins.length;

  const distribution = [1, 2, 3, 4, 5].map((g) => ({
    guesses: g,
    count: wins.filter((w) => w.finalGuessCount === g).length,
  }));

  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;
  let prevDate: string | null = null;
  for (const row of rows) {
    const continuesStreak = row.status === "won" && (prevDate === null || isNextCalendarDay(prevDate, row.puzzleDate));
    if (row.status === "won" && continuesStreak) {
      running += 1;
    } else if (row.status === "won") {
      running = 1; // won, but broke the day-to-day chain — restart at 1
    } else {
      running = 0; // a loss always breaks the streak
    }
    longestStreak = Math.max(longestStreak, running);
    prevDate = row.puzzleDate;
  }
  // Current streak only counts if the most recent finished puzzle was a win.
  currentStreak = rows.length > 0 && rows[rows.length - 1].status === "won" ? running : 0;

  return NextResponse.json({ gamesPlayed, winPct, currentStreak, longestStreak, distribution, lostCount });
}

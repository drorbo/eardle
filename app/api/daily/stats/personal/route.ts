import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts, dailyPuzzles } from "@/lib/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { computeStreaksFromRows } from "@/lib/daily/streak";

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

  const { currentStreak, longestStreak } = computeStreaksFromRows(rows);

  return NextResponse.json({ gamesPlayed, winPct, currentStreak, longestStreak, distribution, lostCount });
}

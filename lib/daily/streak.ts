import { db } from "@/lib/db";
import { dailyAttempts, dailyPuzzles, streaks } from "@/lib/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";

function isNextCalendarDay(prev: string, next: string): boolean {
  const prevDate = new Date(`${prev}T00:00:00Z`);
  const expected = new Date(prevDate);
  expected.setUTCDate(expected.getUTCDate() + 1);
  return expected.toISOString().slice(0, 10) === next;
}

export interface StreakRow {
  status: string;
  puzzleDate: string;
}

/**
 * Shared by app/api/daily/stats/personal (live display) and the streaks-table
 * persistence write in app/api/daily/guess — both must agree, so this is the
 * single implementation of the day-continuity streak logic. Rows must be in
 * ascending puzzleDate order.
 */
export function computeStreaksFromRows(rows: StreakRow[]): { currentStreak: number; longestStreak: number } {
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
  const currentStreak = rows.length > 0 && rows[rows.length - 1].status === "won" ? running : 0;

  return { currentStreak, longestStreak };
}

/**
 * Recomputes this identity's daily streak from full history and upserts it
 * into the streaks table (kind="daily"). Called whenever a guess completes an
 * attempt (app/api/daily/guess). Recomputing from scratch each time (rather
 * than incrementing) means longestStreak is always exactly correct without
 * needing to separately guard against decreasing it.
 */
export async function persistDailyStreak(userId: number | null, token: string | null): Promise<void> {
  if (!userId && !token) return;

  const identityWhere = userId
    ? and(eq(dailyAttempts.userId, userId), ne(dailyAttempts.status, "in_progress"))
    : and(isNull(dailyAttempts.userId), eq(dailyAttempts.sessionToken, token!), ne(dailyAttempts.status, "in_progress"));

  const rows = await db
    .select({ status: dailyAttempts.status, puzzleDate: dailyPuzzles.puzzleDate })
    .from(dailyAttempts)
    .innerJoin(dailyPuzzles, eq(dailyPuzzles.id, dailyAttempts.puzzleId))
    .where(identityWhere)
    .orderBy(dailyPuzzles.puzzleDate);

  const { currentStreak, longestStreak } = computeStreaksFromRows(rows);
  const now = Math.floor(Date.now() / 1000);

  const streakIdentityWhere = userId
    ? and(eq(streaks.userId, userId), eq(streaks.kind, "daily"))
    : and(isNull(streaks.userId), eq(streaks.sessionToken, token!), eq(streaks.kind, "daily"));

  const existing = await db.query.streaks.findFirst({ where: streakIdentityWhere });

  if (existing) {
    await db.update(streaks)
      .set({ currentStreak, longestStreak, updatedAt: now })
      .where(eq(streaks.id, existing.id));
  } else {
    await db.insert(streaks).values({
      userId: userId ?? undefined,
      sessionToken: token ?? "",
      kind: "daily",
      currentStreak,
      longestStreak,
      updatedAt: now,
    });
  }
}

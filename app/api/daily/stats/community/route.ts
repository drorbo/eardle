import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyAttempts, dailyPuzzles } from "@/lib/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { todaysPuzzleDateStr } from "@/lib/daily/config";

export async function GET(req: NextRequest) {
  const dateStr = new URL(req.url).searchParams.get("date") ?? todaysPuzzleDateStr();

  const puzzle = await db.query.dailyPuzzles.findFirst({ where: eq(dailyPuzzles.puzzleDate, dateStr) });
  if (!puzzle) {
    return NextResponse.json({ error: "No puzzle for that date" }, { status: 404 });
  }

  const rows = await db
    .select({
      status: dailyAttempts.status,
      finalGuessCount: dailyAttempts.finalGuessCount,
      count: sql<number>`count(*)`,
    })
    .from(dailyAttempts)
    .where(and(eq(dailyAttempts.puzzleId, puzzle.id), ne(dailyAttempts.status, "in_progress")))
    .groupBy(dailyAttempts.status, dailyAttempts.finalGuessCount);

  const totalPlayers = rows.reduce((sum, r) => sum + Number(r.count), 0);
  const wonCounts: Record<number, number> = {};
  let lostTotal = 0;
  for (const r of rows) {
    if (r.status === "won" && r.finalGuessCount) wonCounts[r.finalGuessCount] = Number(r.count);
    if (r.status === "lost") lostTotal += Number(r.count);
  }

  const pct = (n: number) => (totalPlayers > 0 ? Math.round((n / totalPlayers) * 100) : 0);
  const distribution = [1, 2, 3, 4, 5].map((g) => ({ guesses: g, pct: pct(wonCounts[g] ?? 0) }));

  return NextResponse.json({ totalPlayers, distribution, lostPct: pct(lostTotal) });
}

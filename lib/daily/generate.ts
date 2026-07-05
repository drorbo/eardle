import { db } from "@/lib/db";
import { dailyPuzzles, exercises } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { generatePerformanceParams } from "@/lib/audio/randomize";
import { DAILY_DIFFICULTY_BY_WEEKDAY, DAILY_ELIGIBLE_CATEGORIES } from "./config";
import type { DailyPuzzle } from "@/lib/db/schema";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns today's (or the given date's) daily puzzle, lazily generating and
 * permanently persisting it on first request for that date. Once created, a
 * puzzle never changes — later admin edits to the underlying exercise can't
 * retroactively alter an already-served day.
 */
export async function getOrCreateDailyPuzzle(dateStr: string): Promise<DailyPuzzle | null> {
  const existing = await db.query.dailyPuzzles.findFirst({
    where: eq(dailyPuzzles.puzzleDate, dateStr),
  });
  if (existing) return existing;

  const weekday = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const difficulty = DAILY_DIFFICULTY_BY_WEEKDAY[weekday];

  for (const category of shuffle(DAILY_ELIGIBLE_CATEGORIES)) {
    const [candidate] = await db
      .select()
      .from(exercises)
      .where(and(eq(exercises.category, category), eq(exercises.difficulty, difficulty)))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    if (!candidate) continue;

    const config = JSON.parse(candidate.config);
    const choices = JSON.parse(candidate.choices);
    const exerciseSnapshot = JSON.stringify({
      id: candidate.id,
      category: candidate.category,
      title: candidate.title,
      prompt: candidate.prompt,
      difficulty: candidate.difficulty,
      config,
      choices,
      answer: candidate.answer,
    });
    const performanceParams = JSON.stringify(generatePerformanceParams(category, config));

    const [inserted] = await db
      .insert(dailyPuzzles)
      .values({
        puzzleDate: dateStr,
        category,
        difficulty,
        exerciseId: candidate.id,
        exerciseSnapshot,
        performanceParams,
      })
      .onConflictDoNothing({ target: dailyPuzzles.puzzleDate })
      .returning();

    // undefined if we lost a concurrent race generating the same day — re-read the winner.
    return inserted ?? (await db.query.dailyPuzzles.findFirst({ where: eq(dailyPuzzles.puzzleDate, dateStr) })) ?? null;
  }

  return null; // all eligible categories empty at this difficulty
}

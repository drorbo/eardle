export const dynamic = "force-dynamic";

import { CategoryCard } from "@/components/ui/CategoryCard";
import { DailyHeroCard } from "@/components/ui/DailyHeroCard";
import { LearnFeedbackBanner } from "@/components/ui/LearnFeedbackBanner";
import { Category, CATEGORY_META } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { getOrCreateDailyPuzzle } from "@/lib/daily/generate";
import { todaysPuzzleDateStr } from "@/lib/daily/config";

async function getCounts(): Promise<Record<Category, number>> {
  const rows = await db
    .select({ category: exercises.category, count: sql<number>`count(*)` })
    .from(exercises)
    .groupBy(exercises.category);
  const counts: Record<string, number> = {};
  rows.forEach((r) => { counts[r.category] = r.count; });
  return counts as Record<Category, number>;
}

export default async function HomePage() {
  const [counts, dailyPuzzle] = await Promise.all([
    getCounts(),
    getOrCreateDailyPuzzle(todaysPuzzleDateStr()),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
      <LearnFeedbackBanner />

      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-4xl sm:text-6xl font-bold text-text mb-4 tracking-tight">
          Train Your Ear
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-xl mx-auto">
          Interactive exercises to sharpen your musical hearing — notes, intervals, chords, progressions, and scales.
        </p>
      </div>

      <DailyHeroCard
        category={dailyPuzzle?.category}
        difficulty={dailyPuzzle?.difficulty}
        emoji={dailyPuzzle ? CATEGORY_META[dailyPuzzle.category as Category].emoji : undefined}
      />

      <p className="text-center text-xs font-semibold text-text-faint uppercase tracking-widest mb-4">
        Or practice freely
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {(["note", "interval", "chord", "progression", "scale"] as Category[]).map((cat) => (
          <CategoryCard key={cat} category={cat} count={counts[cat] ?? 0} />
        ))}
      </div>

      <p className="text-center text-text-faint text-sm mt-12">
        Press play, listen carefully, then pick your answer.
      </p>
    </div>
  );
}

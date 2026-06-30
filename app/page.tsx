export const dynamic = "force-dynamic";

import { CategoryCard } from "@/components/ui/CategoryCard";
import { Category } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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
  const counts = await getCounts();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
      <div className="text-center mb-8 sm:mb-16">
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
          Train Your Ear
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto">
          Interactive exercises to sharpen your musical hearing — notes, intervals, chords, progressions, and scales.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {(["note", "interval", "chord", "progression", "scale"] as Category[]).map((cat) => (
          <CategoryCard key={cat} category={cat} count={counts[cat] ?? 0} />
        ))}
      </div>

      <p className="text-center text-gray-600 text-sm mt-12">
        Press play, listen carefully, then pick your answer.
      </p>
    </div>
  );
}

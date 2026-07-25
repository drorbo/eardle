export const dynamic = "force-dynamic";

import { CategoryCard } from "@/components/ui/CategoryCard";
import { Category } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

async function getCounts(): Promise<Record<Category, number>> {
  const rows = await db
    .select({ category: exercises.category, count: sql<number>`count(*)` })
    .from(exercises)
    .groupBy(exercises.category);
  const counts: Record<string, number> = {};
  rows.forEach((r) => { counts[r.category] = r.count; });
  return counts as Record<Category, number>;
}

export default async function PracticePage() {
  const counts = await getCounts();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3 tracking-tight">
          Practice Mode
        </h1>
        <p className="text-text-muted max-w-xl mx-auto">
          Pick a category to start training your ear.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {(["note", "interval", "chord", "progression", "scale"] as Category[]).map((cat) => (
          <CategoryCard key={cat} category={cat} count={counts[cat] ?? 0} />
        ))}
      </div>
    </div>
  );
}

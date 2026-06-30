import { notFound } from "next/navigation";
import { CATEGORY_META, Category, Exercise } from "@/types/exercise";
import { ExercisePlayerWrapper } from "./ExercisePlayerWrapper";
import { ExerciseErrorBoundary } from "@/components/exercise/ErrorBoundary";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { eq, and, sql, ne } from "drizzle-orm";

interface Props {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<{ mode?: string; difficulty?: string; practiceExclude?: string; topic?: string }>;
}

export default async function ExercisePage({ params, searchParams }: Props) {
  const { category, id } = await params;
  const { mode, difficulty, practiceExclude, topic } = await searchParams;

  if (!CATEGORY_META[category as Category]) notFound();

  const row = await db.query.exercises.findFirst({
    where: eq(exercisesTable.id, Number(id)),
  });
  if (!row) notFound();

  const exercise: Exercise = { ...row, config: JSON.parse(row.config), choices: JSON.parse(row.choices) } as Exercise;

  let nextHref: string | undefined;
  if (mode === "practice") {
    const excludeParam = practiceExclude ?? id;
    const topicParam = topic ? `&topic=${topic}` : "";
    nextHref = `/${category}/practice?difficulty=${difficulty ?? "all"}&exclude=${excludeParam}${topicParam}`;
  } else {
    // Browse mode: random exercise from same category, excluding current
    const [randomNext] = await db.select({ id: exercisesTable.id })
      .from(exercisesTable)
      .where(and(eq(exercisesTable.category, category as Category), ne(exercisesTable.id, exercise.id)))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    if (randomNext) nextHref = `/${category}/${randomNext.id}`;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-16">
        <div className="mb-8 flex items-center gap-3 flex-wrap">
          <a href={`/${category}`} className="text-gray-500 hover:text-gray-300 text-sm transition">
            ← {CATEGORY_META[category as Category]?.label ?? category}
          </a>
          <span className="text-gray-700">·</span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 capitalize">
            {exercise.difficulty}
          </span>
          {mode === "practice" && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-900/60 text-indigo-300">
              Practice Mode
            </span>
          )}
        </div>

        <ExerciseErrorBoundary>
          <ExercisePlayerWrapper exercise={exercise} nextHref={nextHref} />
        </ExerciseErrorBoundary>
      </div>
    </div>
  );
}

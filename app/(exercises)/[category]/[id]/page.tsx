import { notFound } from "next/navigation";
import { CATEGORY_META, Category, Exercise } from "@/types/exercise";
import { ExercisePlayerWrapper } from "./ExercisePlayerWrapper";
import { ExerciseErrorBoundary } from "@/components/exercise/ErrorBoundary";
import { SharePackageButton } from "@/components/exercise/SharePackageButton";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { eq, and, sql, ne, inArray } from "drizzle-orm";

interface Props {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<{ mode?: string; difficulty?: string; practiceExclude?: string; topic?: string; ids?: string }>;
}

export default async function ExercisePage({ params, searchParams }: Props) {
  const { category, id } = await params;
  const { mode, difficulty, practiceExclude, topic, ids } = await searchParams;

  if (!CATEGORY_META[category as Category]) notFound();

  const row = await db.query.exercises.findFirst({
    where: eq(exercisesTable.id, Number(id)),
  });
  if (!row) notFound();

  let exercise: Exercise = { ...row, config: JSON.parse(row.config), choices: JSON.parse(row.choices) } as Exercise;

  // Custom package session: replace this exercise's default choices with the
  // deduped set of answers across every exercise the user hand-picked into
  // the package, so the choice grid reflects exactly what they chose to
  // drill rather than the category's full default option set.
  const idsList = ids?.split(",").map(Number).filter(Boolean) ?? [];
  if (idsList.length > 1) {
    const packageRows = await db.select({ answer: exercisesTable.answer })
      .from(exercisesTable)
      .where(inArray(exercisesTable.id, idsList));
    const packageChoices = [...new Set(packageRows.map((r) => r.answer))];
    if (packageChoices.length > 1) {
      exercise = { ...exercise, choices: packageChoices };
    }
  }

  let nextHref: string | undefined;
  if (mode === "practice") {
    const excludeParam = practiceExclude ?? id;
    const topicParam = topic ? `&topic=${topic}` : "";
    const idsParam = ids ? `&ids=${ids}` : "";
    nextHref = `/${category}/practice?difficulty=${difficulty ?? "all"}&exclude=${excludeParam}${topicParam}${idsParam}`;
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
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-16">
        <div className="mb-8 flex items-center gap-3 flex-wrap">
          <a href={`/${category}`} className="text-text-subtle hover:text-text-secondary text-sm transition">
            ← {CATEGORY_META[category as Category]?.label ?? category}
          </a>
          {mode === "practice" && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              Practice Mode
            </span>
          )}
          {ids && <SharePackageButton category={category} ids={ids} />}
        </div>

        <ExerciseErrorBoundary>
          <ExercisePlayerWrapper exercise={exercise} nextHref={nextHref} />
        </ExerciseErrorBoundary>
      </div>
    </div>
  );
}

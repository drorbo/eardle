import { notFound } from "next/navigation";
import { CATEGORY_META, Category, Exercise } from "@/types/exercise";
import { ExercisePlayerWrapper } from "./ExercisePlayerWrapper";
import { ExerciseErrorBoundary } from "@/components/exercise/ErrorBoundary";
import { SharePackageButton } from "@/components/exercise/SharePackageButton";
import { PracticeCompletionTracker } from "@/components/lesson/PracticeCompletionTracker";
import { getLessonById } from "@/lib/db/lessons";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { eq, and, sql, ne, inArray } from "drizzle-orm";

interface Props {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<{
    mode?: string;
    difficulty?: string;
    practiceExclude?: string;
    topic?: string;
    ids?: string;
    lessonId?: string;
  }>;
}

export default async function ExercisePage({ params, searchParams }: Props) {
  const { category, id } = await params;
  const { mode, difficulty, practiceExclude, topic, ids, lessonId } = await searchParams;

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

  // Custom package session tied to a lesson: this render is the exact moment
  // the user has now been shown every exercise in the package at least once
  // (practiceExclude, accumulated up through this exercise, covers the whole
  // id list) — that's "practiced" for the linked lesson's progress tracking.
  const exclSet = new Set(practiceExclude?.split(",").map(Number).filter(Boolean) ?? []);
  const cycleJustCompleted = idsList.length > 0 && idsList.every((pid) => exclSet.has(pid));

  // Only set when this session was reached via a lesson's "Start Practicing"
  // link (never via the Custom Package picker, which never sets lessonId) —
  // re-resolved fresh on every exercise page load so the link stays correct
  // and present across the whole session without needing extra plumbing,
  // since lessonId already round-trips through nextHref below.
  const linkedLesson = lessonId ? await getLessonById(Number(lessonId)) : null;
  const backToLessonHref = linkedLesson?.published
    ? `/learn/${linkedLesson.topicSlug}/${linkedLesson.slug}`
    : null;

  let nextHref: string | undefined;
  if (mode === "practice") {
    const excludeParam = practiceExclude ?? id;
    const topicParam = topic ? `&topic=${topic}` : "";
    const idsParam = ids ? `&ids=${ids}` : "";
    const lessonIdParam = lessonId ? `&lessonId=${lessonId}` : "";
    nextHref = `/${category}/practice?difficulty=${difficulty ?? "all"}&exclude=${excludeParam}${topicParam}${idsParam}${lessonIdParam}`;
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
          {backToLessonHref && (
            <a
              href={backToLessonHref}
              className="text-xs px-2 py-1 rounded-full bg-surface-2 border border-border-subtle text-text-secondary hover:border-border hover:text-text transition"
            >
              📖 Back to Lesson
            </a>
          )}
          {mode === "practice" && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              Practice Mode
            </span>
          )}
          {ids && <SharePackageButton category={category} ids={ids} />}
        </div>

        {lessonId && cycleJustCompleted && <PracticeCompletionTracker lessonId={Number(lessonId)} />}

        <ExerciseErrorBoundary>
          <ExercisePlayerWrapper exercise={exercise} nextHref={nextHref} isPracticeMode={mode === "practice"} />
        </ExerciseErrorBoundary>
      </div>
    </div>
  );
}

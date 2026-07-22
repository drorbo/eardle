import { notFound, redirect } from "next/navigation";
import { CATEGORY_META, CATEGORY_TOPICS, Category, Difficulty } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { and, eq, sql, notInArray, inArray } from "drizzle-orm";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ difficulty?: string; topic?: string; exclude?: string; ids?: string }>;
}

const DIFFICULTY_OPTIONS = [
  { id: "all",    label: "All Levels", color: "bg-indigo-700 hover:bg-indigo-600" },
  { id: "easy",   label: "Easy",       color: "bg-green-700 hover:bg-green-600" },
  { id: "medium", label: "Medium",     color: "bg-yellow-700 hover:bg-yellow-600" },
  { id: "hard",   label: "Hard",       color: "bg-red-700 hover:bg-red-600" },
  { id: "jazz",   label: "Jazz",       color: "bg-amber-700 hover:bg-amber-600" },
] as const;

export default async function PracticePage({ params, searchParams }: Props) {
  const { category } = await params;
  const { difficulty, topic, exclude, ids } = await searchParams;

  if (!CATEGORY_META[category as Category]) notFound();
  const cat = category as Category;
  const meta = CATEGORY_META[cat];

  const idsList = ids?.split(",").map(Number).filter(Boolean) ?? [];

  // No difficulty, no topic, no custom id list → send back to category page
  if (!difficulty && !topic && !idsList.length) {
    redirect(`/${cat}`);
  }

  // Topic set but no difficulty (and no custom id list) → show difficulty sub-picker for this topic
  if (topic && !difficulty && !idsList.length) {
    const topicMeta = CATEGORY_TOPICS[cat].find((t) => t.id === topic);
    const topicLabel = topicMeta?.label ?? topic;

    const [{ jazzCnt }] = await db
      .select({ jazzCnt: sql<number>`count(*)` })
      .from(exercisesTable)
      .where(
        and(
          eq(exercisesTable.category, cat),
          eq(exercisesTable.difficulty, "jazz" as Difficulty),
          sql`(${exercisesTable.config}::jsonb)->>'topic' = ${topic}`
        )
      );
    const difficultyOptions = jazzCnt > 0
      ? DIFFICULTY_OPTIONS
      : DIFFICULTY_OPTIONS.filter((d) => d.id !== "jazz");

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center max-w-sm w-full">
          <span className="text-5xl mb-4 block">{meta.emoji}</span>
          <h1 className="text-3xl font-bold text-text mb-2">{topicLabel}</h1>
          <p className="text-text-muted mb-10">Choose a difficulty level.</p>
          <div className="flex flex-col gap-3">
            {difficultyOptions.map((d) => (
              <a
                key={d.id}
                href={`/${cat}/practice?topic=${topic}&difficulty=${d.id}`}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition ${d.color}`}
              >
                {d.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // difficulty is set (topic optional), or a custom id list is set → pick a random exercise
  const excludeIds = exclude?.split(",").map(Number).filter(Boolean) ?? [];

  const conditions = [eq(exercisesTable.category, cat)];
  if (idsList.length) {
    // Custom package: the chosen id list fully determines the pool — difficulty/topic don't apply.
    conditions.push(inArray(exercisesTable.id, idsList));
  } else {
    if (difficulty !== "all") {
      conditions.push(eq(exercisesTable.difficulty, difficulty as Difficulty));
    }
    if (topic) {
      conditions.push(sql`(${exercisesTable.config}::jsonb)->>'topic' = ${topic}`);
    }
  }

  let [next] = excludeIds.length
    ? await db.select().from(exercisesTable).where(and(...conditions, notInArray(exercisesTable.id, excludeIds))).orderBy(sql`RANDOM()`).limit(1)
    : await db.select().from(exercisesTable).where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1);

  if (!next) {
    // All seen — reset and start fresh
    [next] = await db.select().from(exercisesTable).where(and(...conditions)).orderBy(sql`RANDOM()`).limit(1);
  }

  if (!next && idsList.length) {
    // Stale/invalid custom id list (e.g. tampered URL) — send back to the picker
    redirect(`/${cat}/practice/custom`);
  }

  if (!next) {
    const topicMeta = topic ? CATEGORY_TOPICS[cat].find((t) => t.id === topic) : null;
    const topicLabel = topicMeta?.label ?? topic;
    const backHref = topic && difficulty ? `/${cat}/practice?topic=${topic}` : `/${cat}`;
    const difficultyLabel = DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label ?? difficulty;

    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="text-center max-w-sm w-full">
          <span className="text-5xl mb-4 block">{meta.emoji}</span>
          <h1 className="text-2xl font-bold text-text mb-2">No exercises found</h1>
          <p className="text-text-muted mb-8">
            There are no {topicLabel ? <strong className="text-text-secondary">{topicLabel}</strong> : null}
            {topicLabel ? " " : null}
            exercises at the <strong className="text-text-secondary">{difficultyLabel}</strong> level yet.
          </p>
          <a
            href={backHref}
            className="inline-block px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold transition"
          >
            {topic && difficulty ? "Try a different difficulty" : `Back to ${meta.label}`}
          </a>
        </div>
      </div>
    );
  }

  const newExcludeIds = excludeIds.includes(next.id) ? [next.id] : [...excludeIds, next.id];
  const excludeParam = newExcludeIds.join(",");
  const topicParam = topic ? `&topic=${topic}` : "";
  const idsParam = idsList.length ? `&ids=${idsList.join(",")}` : "";

  redirect(`/${cat}/${next.id}?mode=practice&difficulty=${difficulty ?? "all"}&practiceExclude=${excludeParam}${topicParam}${idsParam}`);
}

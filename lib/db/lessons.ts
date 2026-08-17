import { cache } from "react";
import { asc, eq, inArray, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { topics, lessons, exercises } from "@/lib/db/schema";
import { isValidCategory } from "@/types/exercise";
import type { LessonBlock, LessonDetail, LessonSummary, NavCategoryId, PracticePackage, TopicWithLessons } from "@/types/lesson";

// Defensive, not just JSON.parse-and-trust: the write path validates shape
// before storage (see app/api/admin/lessons/route.ts), but this is the read
// boundary for data that predates that validation, or that a future write
// path might regress on — a package with a malformed category or a null/
// non-array exerciseIds (both possible from the pre-multi-package data this
// column was backfilled from) is dropped individually instead of crashing
// every reader of this lesson (see the 2026-08-11 audit).
function parsePracticePackages(raw: string | null): PracticePackage[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const packages: PracticePackage[] = [];
  for (const p of data) {
    if (!p || typeof p !== "object") continue;
    const pkg = p as Record<string, unknown>;
    if (typeof pkg.label !== "string" || !isValidCategory(pkg.category)) continue;
    const exerciseIds = Array.isArray(pkg.exerciseIds)
      ? pkg.exerciseIds.filter((id): id is number => typeof id === "number" && Number.isInteger(id))
      : [];
    packages.push({ label: pkg.label, category: pkg.category, exerciseIds });
  }
  return packages;
}

/**
 * All topics, each with its lessons, both in suggested-path order.
 * Public callers only ever see published lessons; the admin lesson list
 * passes `includeUnpublished` to also see drafts.
 *
 * Wrapped in React's cache() so the (learn) layout's own call and
 * getOrderedLessonSequence()'s internal call dedupe to one query pair per
 * request instead of two (see the 2026-08-11 latency investigation).
 */
export const getTopicsWithLessons = cache(async function getTopicsWithLessons(
  options?: { includeUnpublished?: boolean }
): Promise<TopicWithLessons[]> {
  const [topicRows, lessonRows] = await Promise.all([
    db.select().from(topics).orderBy(asc(topics.sortOrder)),
    options?.includeUnpublished
      ? db.select().from(lessons).orderBy(asc(lessons.sortOrder))
      : db.select().from(lessons).where(eq(lessons.published, true)).orderBy(asc(lessons.sortOrder)),
  ]);

  const byTopic = new Map<number, LessonSummary[]>();
  const categoryByTopic = new Map<number, NavCategoryId>();
  for (const l of lessonRows) {
    const topic = topicRows.find((t) => t.id === l.topicId);
    if (!topic) continue; // orphaned row, shouldn't happen (FK cascade), skip defensively
    const list = byTopic.get(l.topicId) ?? [];
    list.push({
      id: l.id,
      slug: l.slug,
      title: l.title,
      sortOrder: l.sortOrder,
      topicId: l.topicId,
      topicSlug: topic.slug,
      topicTitle: topic.title,
      published: l.published,
      prerequisiteTopicId: l.prerequisiteTopicId,
    });
    byTopic.set(l.topicId, list);
    if (!categoryByTopic.has(l.topicId)) {
      const firstPackage = parsePracticePackages(l.practicePackages)[0];
      if (firstPackage) categoryByTopic.set(l.topicId, firstPackage.category);
    }
  }

  return topicRows.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    sortOrder: t.sortOrder,
    category: categoryByTopic.get(t.id) ?? "fundamentals",
    lessons: byTopic.get(t.id) ?? [],
  }));
});

/** The flattened "suggested path" — every published lesson, topic order then lesson order. */
export const getOrderedLessonSequence = cache(async function getOrderedLessonSequence(): Promise<LessonSummary[]> {
  const topicsWithLessons = await getTopicsWithLessons();
  return topicsWithLessons.flatMap((t) => t.lessons);
});

function toLessonDetail(
  lesson: typeof lessons.$inferSelect,
  topic: typeof topics.$inferSelect,
  prereq: typeof topics.$inferSelect | undefined
): LessonDetail {
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    sortOrder: lesson.sortOrder,
    topicId: topic.id,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    prerequisiteTopicId: lesson.prerequisiteTopicId,
    prerequisiteTopicSlug: prereq?.slug ?? null,
    prerequisiteTopicTitle: prereq?.title ?? null,
    practicePackages: parsePracticePackages(lesson.practicePackages),
    body: JSON.parse(lesson.body) as LessonBlock[],
    published: lesson.published,
  };
}

// Lessons reference exercises by id, authored in whichever database they
// were written against — a prod/dev id drift (different seed history) or a
// since-deleted exercise leaves stale ids that would 404 the practice picker.
// Filtering to only the ids that actually exist (per package's own category)
// keeps every consumer honest about what this environment can actually
// play; a package left with zero valid ids is dropped entirely. Shared by
// both the public lesson page and the admin edit form, so a dangling id
// can't silently survive repeated admin saves (see the 2026-08-11 audit).
async function filterToValidExerciseIds(packages: PracticePackage[]): Promise<PracticePackage[]> {
  if (packages.length === 0) return packages;
  const validRows = await db
    .select({ id: exercises.id, category: exercises.category })
    .from(exercises)
    .where(or(...packages.map((p) => and(eq(exercises.category, p.category), inArray(exercises.id, p.exerciseIds)))));
  const validIdsByCategory = new Map<string, Set<number>>();
  for (const row of validRows) {
    const set = validIdsByCategory.get(row.category) ?? new Set<number>();
    set.add(row.id);
    validIdsByCategory.set(row.category, set);
  }
  return packages
    .map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((id) => validIdsByCategory.get(p.category)?.has(id)) }))
    .filter((p) => p.exerciseIds.length > 0);
}

// Prereq lookup and the exercise-validity filter both depend only on `lesson`
// (not on each other), so they run in parallel rather than sequentially.
async function resolvePrereqAndPackages(
  lesson: typeof lessons.$inferSelect
): Promise<[typeof topics.$inferSelect | undefined, PracticePackage[]]> {
  return Promise.all([
    lesson.prerequisiteTopicId
      ? db
          .select()
          .from(topics)
          .where(eq(topics.id, lesson.prerequisiteTopicId))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
    filterToValidExerciseIds(parsePracticePackages(lesson.practicePackages)),
  ]);
}

// Wrapped in cache() so generateMetadata() and the page component's separate
// calls (identical args, same request) share one query chain instead of
// running it twice (see the 2026-08-11 latency investigation). Topic and
// lesson lookups are independent (different tables, no shared dependency) and
// run in parallel.
export const getLessonDetail = cache(async function getLessonDetail(
  topicSlug: string,
  lessonSlug: string
): Promise<LessonDetail | null> {
  const [[topic], [lesson]] = await Promise.all([
    db.select().from(topics).where(eq(topics.slug, topicSlug)).limit(1),
    db.select().from(lessons).where(eq(lessons.slug, lessonSlug)).limit(1),
  ]);
  if (!topic || !lesson || lesson.topicId !== topic.id) return null;

  const [prereq, practicePackages] = await resolvePrereqAndPackages(lesson);
  const detail = toLessonDetail(lesson, topic, prereq);
  detail.practicePackages = practicePackages;
  return detail;
});

/** Admin edit form lookup — by id rather than slug pair. */
export const getLessonById = cache(async function getLessonById(id: number): Promise<LessonDetail | null> {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) return null;

  const [[topic], [prereq, practicePackages]] = await Promise.all([
    db.select().from(topics).where(eq(topics.id, lesson.topicId)).limit(1),
    resolvePrereqAndPackages(lesson),
  ]);
  if (!topic) return null;

  const detail = toLessonDetail(lesson, topic, prereq);
  detail.practicePackages = practicePackages;
  return detail;
});

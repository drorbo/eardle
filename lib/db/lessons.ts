import { asc, eq, inArray, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { topics, lessons, exercises } from "@/lib/db/schema";
import type { LessonBlock, LessonDetail, LessonSummary, NavCategoryId, PracticePackage, TopicWithLessons } from "@/types/lesson";

function parsePracticePackages(raw: string | null): PracticePackage[] {
  return raw ? (JSON.parse(raw) as PracticePackage[]) : [];
}

/**
 * All topics, each with its lessons, both in suggested-path order.
 * Public callers only ever see published lessons; the admin lesson list
 * passes `includeUnpublished` to also see drafts.
 */
export async function getTopicsWithLessons(options?: { includeUnpublished?: boolean }): Promise<TopicWithLessons[]> {
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
}

/** The flattened "suggested path" — every published lesson, topic order then lesson order. */
export async function getOrderedLessonSequence(): Promise<LessonSummary[]> {
  const topicsWithLessons = await getTopicsWithLessons();
  return topicsWithLessons.flatMap((t) => t.lessons);
}

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

export async function getLessonDetail(topicSlug: string, lessonSlug: string): Promise<LessonDetail | null> {
  const [topic] = await db.select().from(topics).where(eq(topics.slug, topicSlug)).limit(1);
  if (!topic) return null;

  const [lesson] = await db.select().from(lessons).where(eq(lessons.slug, lessonSlug)).limit(1);
  if (!lesson || lesson.topicId !== topic.id) return null;

  const prereq = lesson.prerequisiteTopicId
    ? (await db.select().from(topics).where(eq(topics.id, lesson.prerequisiteTopicId)).limit(1))[0]
    : undefined;

  const detail = toLessonDetail(lesson, topic, prereq);
  if (detail.practicePackages.length > 0) {
    // Lessons reference exercises by id, authored in whichever database they
    // were written against — a prod/dev id drift (different seed history)
    // leaves stale ids that 404 the practice picker into its "build a
    // custom package" fallback instead of playing. Filtering to only the
    // ids that actually exist here (per package's own category) keeps each
    // CTA honest about what this environment can actually play; a package
    // left with zero valid ids is dropped entirely.
    const validRows = await db
      .select({ id: exercises.id, category: exercises.category })
      .from(exercises)
      .where(
        or(
          ...detail.practicePackages.map((p) => and(eq(exercises.category, p.category), inArray(exercises.id, p.exerciseIds)))
        )
      );
    const validIdsByCategory = new Map<string, Set<number>>();
    for (const row of validRows) {
      const set = validIdsByCategory.get(row.category) ?? new Set<number>();
      set.add(row.id);
      validIdsByCategory.set(row.category, set);
    }
    detail.practicePackages = detail.practicePackages
      .map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((id) => validIdsByCategory.get(p.category)?.has(id)) }))
      .filter((p) => p.exerciseIds.length > 0);
  }
  return detail;
}

/** Admin edit form lookup — by id rather than slug pair. */
export async function getLessonById(id: number): Promise<LessonDetail | null> {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!lesson) return null;

  const [topic] = await db.select().from(topics).where(eq(topics.id, lesson.topicId)).limit(1);
  if (!topic) return null;

  const prereq = lesson.prerequisiteTopicId
    ? (await db.select().from(topics).where(eq(topics.id, lesson.prerequisiteTopicId)).limit(1))[0]
    : undefined;

  return toLessonDetail(lesson, topic, prereq);
}

import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { topics, lessons, exercises } from "@/lib/db/schema";
import type { Category } from "@/types/exercise";
import type { LessonBlock, LessonDetail, LessonSummary, NavCategoryId, TopicWithLessons } from "@/types/lesson";

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
    });
    byTopic.set(l.topicId, list);
    if (!categoryByTopic.has(l.topicId) && l.practiceCategory) {
      categoryByTopic.set(l.topicId, l.practiceCategory as Category);
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
    practiceCategory: (lesson.practiceCategory as Category | null) ?? null,
    practiceExerciseIds: lesson.practiceExerciseIds ? (JSON.parse(lesson.practiceExerciseIds) as number[]) : null,
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
  if (detail.practiceCategory && detail.practiceExerciseIds?.length) {
    // Lessons reference exercises by id, authored in whichever database they
    // were written against — a prod/dev id drift (different seed history)
    // leaves stale ids that 404 the practice picker into its "build a
    // custom package" fallback instead of playing. Filtering to only the
    // ids that actually exist here keeps the CTA (and the click-through)
    // honest about what this environment can actually play.
    const validRows = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.category, detail.practiceCategory), inArray(exercises.id, detail.practiceExerciseIds)));
    const validIds = new Set(validRows.map((r) => r.id));
    const filtered = detail.practiceExerciseIds.filter((id) => validIds.has(id));
    detail.practiceExerciseIds = filtered.length > 0 ? filtered : null;
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

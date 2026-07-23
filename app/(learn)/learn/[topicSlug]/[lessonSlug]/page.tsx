export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLessonDetail, getOrderedLessonSequence } from "@/lib/db/lessons";
import { LessonBlocks } from "@/components/lesson/LessonBlocks";
import { LessonProgressPanel } from "@/components/lesson/LessonProgressPanel";

interface Props {
  params: Promise<{ topicSlug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicSlug, lessonSlug } = await params;
  const lesson = await getLessonDetail(topicSlug, lessonSlug);
  if (!lesson) return {};
  return {
    title: `${lesson.title} — Eardle Learn`,
    description: `${lesson.title} — part of Eardle's "${lesson.topicTitle}" topic.`,
  };
}

export default async function LessonPage({ params }: Props) {
  const { topicSlug, lessonSlug } = await params;
  const lesson = await getLessonDetail(topicSlug, lessonSlug);
  if (!lesson || !lesson.published) notFound();

  const sequence = await getOrderedLessonSequence();
  const idx = sequence.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? sequence[idx - 1] : null;
  const next = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;

  const practiceHref =
    lesson.practiceCategory && lesson.practiceExerciseIds && lesson.practiceExerciseIds.length > 0
      ? `/${lesson.practiceCategory}/practice?ids=${lesson.practiceExerciseIds.join(",")}&lessonId=${lesson.id}`
      : null;

  // sequence is already fetched above for prev/next — reuse it to find the
  // prerequisite topic's own first lesson, instead of just linking to the
  // generic overview and making the reader hunt for it themselves.
  const prereqLesson = lesson.prerequisiteTopicId
    ? sequence.find((l) => l.topicId === lesson.prerequisiteTopicId)
    : null;
  const prereqHref = prereqLesson ? `/learn/${prereqLesson.topicSlug}/${prereqLesson.slug}` : "/learn";

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3 flex-wrap text-sm">
        <Link href="/learn" className="text-text-subtle hover:text-text-secondary transition">
          ← Learn
        </Link>
        <span className="text-text-faint">·</span>
        <span className="text-text-muted">{lesson.topicTitle}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">{lesson.title}</h1>

      {lesson.prerequisiteTopicTitle && (
        <p className="text-xs text-text-subtle mb-6">
          Builds on{" "}
          <Link href={prereqHref} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            {lesson.prerequisiteTopicTitle}
          </Link>
        </p>
      )}

      <LessonBlocks blocks={lesson.body} />

      {practiceHref ? (
        <div className="mt-8 p-5 rounded-2xl bg-surface border border-border-subtle surface-elevated text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-2">
            Practice what you&apos;ve learned
          </p>
          <Link
            href={practiceHref}
            className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            Start Practicing →
          </Link>
        </div>
      ) : (
        <p className="mt-8 text-center text-xs text-text-faint italic">
          This lesson is a concept primer — no dedicated practice exercises yet.
        </p>
      )}

      <LessonProgressPanel lessonId={lesson.id} topicId={lesson.topicId} prev={prev} next={next} />
    </div>
  );
}

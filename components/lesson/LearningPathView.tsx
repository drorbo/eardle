"use client";

import Link from "next/link";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { LearningTrail } from "@/components/lesson/LearningTrail";
import type { TopicWithLessons } from "@/types/lesson";

export function LearningPathView({ topics }: { topics: TopicWithLessons[] }) {
  const { progress, loaded } = useLessonProgress();

  const allLessons = topics.flatMap((t) => t.lessons);
  const continueLesson = loaded ? allLessons.find((l) => !progress[l.id]?.viewed) : undefined;
  const nothingViewedYet = loaded && allLessons.length > 0 && allLessons.every((l) => !progress[l.id]?.viewed);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-text-muted text-xs sm:text-sm">Your suggested order through every lesson.</p>
        <Link
          href="/learn/browse"
          className="text-xs sm:text-sm text-indigo-500 hover:text-indigo-400 transition whitespace-nowrap"
        >
          Browse by subject area →
        </Link>
      </div>

      {loaded && nothingViewedYet && allLessons[0] && (
        <Link
          href={`/learn/${allLessons[0].topicSlug}/${allLessons[0].slug}`}
          className="block mb-6 rounded-2xl bg-accent-banner-bg border border-accent-banner-border p-5 transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-banner-text mb-1">👋 New here?</p>
          <p className="text-text font-bold text-lg">Start with the fundamentals →</p>
          <p className="text-text-muted text-sm mt-0.5">{allLessons[0].title}</p>
        </Link>
      )}

      {loaded && !nothingViewedYet && continueLesson && (
        <Link
          href={`/learn/${continueLesson.topicSlug}/${continueLesson.slug}`}
          className="block mb-6 rounded-2xl bg-accent-banner-bg border border-accent-banner-border p-5 transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-banner-text mb-1">
            Continue where you left off
          </p>
          <p className="text-text font-bold text-lg">{continueLesson.title} →</p>
        </Link>
      )}

      {loaded && !continueLesson && allLessons.length > 0 && (
        <p className="mb-6 text-sm text-text-faint italic">
          You&apos;ve explored every lesson — jump back into any one below anytime.
        </p>
      )}

      <LearningTrail topics={topics} />
    </>
  );
}

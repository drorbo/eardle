"use client";

import Link from "next/link";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";
import type { TopicWithLessons } from "@/types/lesson";

export function LearnOverviewClient({ topics }: { topics: TopicWithLessons[] }) {
  const { progress, loaded } = useLessonProgress();

  const allLessons = topics.flatMap((t) => t.lessons);
  // First not-yet-viewed lesson in suggested-path order — undefined once
  // everything's been read, or before progress has loaded (avoids a flash).
  // Keyed on `viewed`, not `completed`: completed also requires having
  // practiced, so keying on it here left this stuck pointing at lesson 1
  // for anyone who reads ahead without practicing every single lesson.
  const continueLesson = loaded ? allLessons.find((l) => !progress[l.id]?.viewed) : undefined;

  return (
    <>
      {continueLesson && (
        <Link
          href={`/learn/${continueLesson.topicSlug}/${continueLesson.slug}`}
          className="block mb-6 p-4 rounded-xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">
            Continue where you left off
          </p>
          <p className="text-text font-semibold">{continueLesson.title} →</p>
        </Link>
      )}

      <div className="space-y-8">
        {topics.map((topic) => (
          <section key={topic.id}>
            <h2 className="text-lg font-bold text-text mb-1">{topic.title}</h2>
            {topic.description && <p className="text-text-muted text-sm mb-3">{topic.description}</p>}
            <div className="space-y-2">
              {topic.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${topic.slug}/${lesson.slug}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition"
                >
                  <span className="flex items-center gap-2.5">
                    <StatusDot status={progress[lesson.id]} />
                    <span className="text-sm font-medium text-text">{lesson.title}</span>
                  </span>
                  <span className="text-text-faint text-sm">→</span>
                </Link>
              ))}
              {topic.lessons.length === 0 && (
                <p className="text-text-faint text-xs italic">No lessons in this topic yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

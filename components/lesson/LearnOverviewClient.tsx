"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { CategoryTile } from "@/components/lesson/CategoryTile";
import { TopicLessonCard } from "@/components/lesson/TopicLessonCard";
import { LEARN_CATEGORY_ORDER } from "@/lib/learn/categoryMeta";
import type { NavCategoryId, TopicWithLessons } from "@/types/lesson";

export function LearnOverviewClient({ topics }: { topics: TopicWithLessons[] }) {
  const { progress, loaded } = useLessonProgress();

  const allLessons = useMemo(() => topics.flatMap((t) => t.lessons), [topics]);

  // First not-yet-viewed lesson in suggested-path order — undefined once
  // everything's been read, or before progress has loaded (avoids a flash).
  // Keyed on `viewed`, not `completed`: completed also requires having
  // practiced, so keying on it here would leave this stuck pointing at
  // lesson 1 for anyone who reads ahead without practicing every lesson.
  const continueLesson = loaded ? allLessons.find((l) => !progress[l.id]?.viewed) : undefined;
  // True only once progress has loaded and confirmed nothing was viewed —
  // undefined progress (not yet loaded) must not be mistaken for "new user".
  const nothingViewedYet = loaded && allLessons.length > 0 && allLessons.every((l) => !progress[l.id]?.viewed);

  const grouped = useMemo(() => {
    const map = new Map<NavCategoryId, TopicWithLessons[]>();
    for (const t of topics) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return LEARN_CATEGORY_ORDER.map((c) => ({ ...c, topics: map.get(c.id) ?? [] })).filter((c) => c.topics.length > 0);
  }, [topics]);

  const [expanded, setExpanded] = useState<Set<NavCategoryId>>(new Set());

  // Auto-expand (without collapsing anything the user already opened) the
  // category containing the "continue" lesson, so a returning user lands on
  // an already-open section instead of having to find and tap it themselves.
  useEffect(() => {
    if (!continueLesson) return;
    const topic = topics.find((t) => t.id === continueLesson.topicId);
    if (!topic) return;
    setExpanded((prev) => (prev.has(topic.category) ? prev : new Set(prev).add(topic.category)));
  }, [continueLesson, topics]);

  function toggle(id: NavCategoryId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {loaded && nothingViewedYet && allLessons[0] && (
        <Link
          href={`/learn/${allLessons[0].topicSlug}/${allLessons[0].slug}`}
          className="block mb-6 p-5 rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">
            👋 New here?
          </p>
          <p className="text-text font-bold text-lg">Start with the fundamentals →</p>
          <p className="text-text-muted text-sm mt-0.5">{allLessons[0].title}</p>
        </Link>
      )}

      {loaded && !nothingViewedYet && continueLesson && (
        <Link
          href={`/learn/${continueLesson.topicSlug}/${continueLesson.slug}`}
          className="block mb-6 p-5 rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">
            Continue where you left off
          </p>
          <p className="text-text font-bold text-lg">{continueLesson.title} →</p>
        </Link>
      )}

      {loaded && !continueLesson && allLessons.length > 0 && (
        <p className="mb-6 text-sm text-text-faint italic">
          You&apos;ve explored every lesson — jump back into any topic below anytime.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {grouped.map((cat) => {
          const total = cat.topics.reduce((sum, t) => sum + t.lessons.length, 0);
          const completed = cat.topics.reduce(
            (sum, t) => sum + t.lessons.filter((l) => progress[l.id]?.completed).length,
            0
          );
          return (
            <CategoryTile
              key={cat.id}
              meta={cat}
              completed={completed}
              total={total}
              expanded={expanded.has(cat.id)}
              onToggle={() => toggle(cat.id)}
            />
          );
        })}
      </div>

      <div className="space-y-8">
        {grouped
          .filter((cat) => expanded.has(cat.id))
          .map((cat) => (
            <section key={cat.id}>
              <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </h2>
              <div className="space-y-6">
                {cat.topics.map((topic) => (
                  <div key={topic.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-2">
                      {topic.title}
                    </p>
                    {topic.description && <p className="text-text-muted text-sm mb-2">{topic.description}</p>}
                    <div className="space-y-2">
                      {topic.lessons.map((lesson) => (
                        <TopicLessonCard key={lesson.id} lesson={lesson} status={progress[lesson.id]} />
                      ))}
                      {topic.lessons.length === 0 && (
                        <p className="text-text-faint text-xs italic">No lessons in this topic yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}

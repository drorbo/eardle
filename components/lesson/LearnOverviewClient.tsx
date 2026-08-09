"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { CategoryTile } from "@/components/lesson/CategoryTile";
import { CategoryChip } from "@/components/lesson/CategoryChip";
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
  const nothingViewedYet = loaded && allLessons.length > 0 && allLessons.every((l) => !progress[l.id]?.viewed);

  // Each category's lessons flattened (topic grouping headers dropped from
  // this view — nearly every topic has exactly one lesson, so a topic-by-
  // topic breakdown mostly just repeated the lesson title under a near-
  // duplicate heading). Each lesson still carries its topic's one-line
  // description along for the card to show. Order is preserved: topics
  // arrive pre-sorted by sortOrder, and lessons pre-sorted within each
  // topic, so flatMap keeps the suggested reading order intact.
  const grouped = useMemo(() => {
    const map = new Map<NavCategoryId, TopicWithLessons[]>();
    for (const t of topics) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return LEARN_CATEGORY_ORDER.map((c) => ({
      ...c,
      lessons: (map.get(c.id) ?? []).flatMap((t) =>
        t.lessons.map((l) => ({ ...l, description: t.description }))
      ),
    })).filter((c) => c.lessons.length > 0);
  }, [topics]);

  // Exactly one category "tab" is open at a time — never stacks. Starts on
  // the first category so there's always something to look at immediately,
  // then (once progress has loaded) jumps to whichever category holds the
  // "continue" lesson — unless the user has already picked one themselves,
  // in which case their choice is never overridden.
  const [activeCategory, setActiveCategory] = useState<NavCategoryId | null>(() => grouped[0]?.id ?? null);
  const [userPicked, setUserPicked] = useState(false);

  useEffect(() => {
    if (userPicked || !continueLesson) return;
    const topic = topics.find((t) => t.id === continueLesson.topicId);
    if (!topic) return;
    setActiveCategory(topic.category);
  }, [continueLesson, topics, userPicked]);

  function selectCategory(id: NavCategoryId) {
    setUserPicked(true);
    setActiveCategory(id);
  }

  const activePanel = grouped.find((c) => c.id === activeCategory) ?? grouped[0];

  return (
    <>
      {loaded && nothingViewedYet && allLessons[0] && (
        <Link
          href={`/learn/${allLessons[0].topicSlug}/${allLessons[0].slug}`}
          className="block mb-1.5 sm:mb-6 rounded-lg sm:rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          {/* Mobile: one compact line. Desktop: full eyebrow + title block. */}
          <p className="sm:hidden px-3 py-1.5 text-xs font-semibold text-accent-banner-text truncate">
            👋 New here? Start with {allLessons[0].title} →
          </p>
          <div className="hidden sm:block p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-banner-text mb-1">
              👋 New here?
            </p>
            <p className="text-text font-bold text-lg">Start with the fundamentals →</p>
            <p className="text-text-muted text-sm mt-0.5">{allLessons[0].title}</p>
          </div>
        </Link>
      )}

      {loaded && !nothingViewedYet && continueLesson && (
        <Link
          href={`/learn/${continueLesson.topicSlug}/${continueLesson.slug}`}
          className="block mb-1.5 sm:mb-6 rounded-lg sm:rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="sm:hidden px-3 py-1.5 text-xs font-semibold text-accent-banner-text truncate">
            ▶ Continue: {continueLesson.title} →
          </p>
          <div className="hidden sm:block p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-banner-text mb-1">
              Continue where you left off
            </p>
            <p className="text-text font-bold text-lg">{continueLesson.title} →</p>
          </div>
        </Link>
      )}

      {loaded && !continueLesson && allLessons.length > 0 && (
        <p className="mb-1.5 sm:mb-6 text-xs sm:text-sm text-text-faint italic">
          You&apos;ve explored every lesson — jump back into any topic below anytime.
        </p>
      )}

      {/* Mobile: a small chip picker instead of the full tile grid, so it
          stays out of the way and lessons show as high up the screen as
          possible. Wraps to as many rows as needed rather than scrolling
          horizontally — every subject stays visible at once. Desktop/tablet
          keeps the full tile grid below, hidden here to avoid rendering
          both at once. */}
      <div className="flex sm:hidden flex-wrap gap-1.5 mb-3">
        {grouped.map((cat) => (
          <CategoryChip
            key={cat.id}
            meta={cat}
            active={activeCategory === cat.id}
            onSelect={() => selectCategory(cat.id)}
          />
        ))}
      </div>

      <div className="hidden sm:grid sm:grid-cols-3 gap-3 mb-4">
        {grouped.map((cat) => (
          <CategoryTile
            key={cat.id}
            meta={cat}
            completed={cat.lessons.filter((l) => progress[l.id]?.completed).length}
            total={cat.lessons.length}
            active={activeCategory === cat.id}
            onSelect={() => selectCategory(cat.id)}
          />
        ))}
      </div>

      {activePanel && (
        <div className="rounded-2xl border border-border-subtle p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text mb-3">
            <span>{activePanel.emoji}</span>
            <span>{activePanel.label}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activePanel.lessons.map((lesson) => (
              <TopicLessonCard
                key={lesson.id}
                lesson={lesson}
                status={progress[lesson.id]}
                description={lesson.description}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

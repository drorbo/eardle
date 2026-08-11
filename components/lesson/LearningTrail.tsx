"use client";

import Link from "next/link";
import { useLessonProgress, type LessonProgressMap } from "@/hooks/useLessonProgress";
import { PATH_SECTIONS, getSectionForTopic } from "@/lib/learn/pathSections";
import { TIER_PALETTE, TRAIL_ROW_HEIGHT, trailPathD, trailPoint, type TierColor } from "@/lib/learn/pathVisual";
import type { LessonSummary, TopicWithLessons } from "@/types/lesson";

interface AnnotatedLesson {
  lesson: LessonSummary;
  crossLinkTopic?: { slug: string; title: string; firstLessonSlug: string };
}

/** The winding, Duolingo/chess.com-style trail through every lesson,
 *  segmented into one S-curve per curriculum tier with a colored unit
 *  banner above each. */
export function LearningTrail({ topics }: { topics: TopicWithLessons[] }) {
  const { progress } = useLessonProgress();

  const allLessons = topics.flatMap((t) => t.lessons);
  const topicById = new Map(topics.map((t) => [t.id, t] as const));
  const continueLesson = allLessons.find((l) => !progress[l.id]?.viewed);

  // Precomputed against the full flat sequence (not per-tier) so a tier
  // boundary never resets what counts as "the lesson right before this
  // one" for the cross-topic "builds on" annotation.
  const annotated: AnnotatedLesson[] = [];
  let lastTopicId: number | null = null;
  for (const lesson of allLessons) {
    const prereqTopic = lesson.prerequisiteTopicId ? topicById.get(lesson.prerequisiteTopicId) : undefined;
    const showsCrossLink = !!prereqTopic && prereqTopic.id !== lastTopicId;
    const firstLesson = prereqTopic?.lessons[0];
    annotated.push({
      lesson,
      crossLinkTopic:
        showsCrossLink && prereqTopic && firstLesson
          ? { slug: prereqTopic.slug, title: prereqTopic.title, firstLessonSlug: firstLesson.slug }
          : undefined,
    });
    lastTopicId = lesson.topicId;
  }

  const bySection = PATH_SECTIONS.map((section) => ({
    label: section.label,
    items: annotated.filter((a) => getSectionForTopic(a.lesson.topicSlug) === section.label),
  })).filter((s) => s.items.length > 0);

  return (
    <div>
      {bySection.map((section, i) => (
        <TierTrail
          key={section.label}
          label={section.label}
          items={section.items}
          palette={TIER_PALETTE[i % TIER_PALETTE.length]}
          progress={progress}
          currentLessonId={continueLesson?.id}
        />
      ))}
    </div>
  );
}

function TierTrail({
  label,
  items,
  palette,
  progress,
  currentLessonId,
}: {
  label: string;
  items: AnnotatedLesson[];
  palette: TierColor;
  progress: LessonProgressMap;
  currentLessonId?: number;
}) {
  const totalHeight = items.length * TRAIL_ROW_HEIGHT;
  const pathD = trailPathD(items.length);
  const completedCount = items.filter((it) => progress[it.lesson.id]?.completed).length;

  return (
    <div className="mb-8">
      <div
        className={`mx-auto max-w-[240px] rounded-2xl border px-5 py-2.5 text-center bg-gradient-to-b mb-6 ${palette.banner}`}
      >
        <p className={`text-sm font-extrabold uppercase tracking-wide ${palette.bannerText}`}>{label}</p>
        <p className={`text-[11px] font-medium opacity-80 ${palette.bannerText}`}>
          {completedCount}/{items.length} done
        </p>
      </div>

      <div className="relative mx-auto" style={{ maxWidth: 420, height: totalHeight }}>
        {items.length > 1 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 100 ${totalHeight}`}
            preserveAspectRatio="none"
          >
            <path
              d={pathD}
              fill="none"
              style={{ stroke: "var(--border-subtle)" }}
              strokeWidth={2.5}
              strokeDasharray="1 11"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {items.map((item, i) => {
          const { x, y } = trailPoint(i);
          const status = progress[item.lesson.id];
          const completed = !!status?.completed;
          const isCurrent = item.lesson.id === currentLessonId;
          // Viewed or practiced, but not both yet — the "in progress" state
          // already shown as an amber dot in StatusDot elsewhere in the app;
          // mirrored here as a tier-tinted node plus the same amber dot so
          // the trail carries a real third state, not just done/not-done.
          const inProgress = !completed && !!(status?.viewed || status?.practiced);

          return (
            <div
              key={item.lesson.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${x}%`, top: y, transform: "translate(-50%, -50%)", width: 118 }}
            >
              {isCurrent && (
                <span className="absolute -top-8 text-2xl motion-safe:animate-bounce" aria-hidden>
                  🎧
                </span>
              )}
              <Link
                href={`/learn/${item.lesson.topicSlug}/${item.lesson.slug}`}
                aria-label={item.lesson.title}
                title={item.lesson.title}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-md transition hover:scale-105 active:scale-95 ${
                  completed || isCurrent
                    ? `${palette.nodeFill} text-white border-4 border-white/70 dark:border-black/20`
                    : inProgress
                      ? `${palette.nodeTint} border-[3px] ${palette.nodeRing} ${palette.nodeRingText}`
                      : `bg-surface border-[3px] ${palette.nodeRing} ${palette.nodeRingText}`
                } ${isCurrent && !completed ? "motion-safe:animate-pulse" : ""}`}
              >
                {completed ? "✓" : i + 1}
                {inProgress && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-bg"
                    aria-hidden
                  />
                )}
              </Link>
              <p className="mt-2 text-[11px] font-semibold text-text text-center leading-tight line-clamp-2">
                {item.lesson.title}
              </p>
              {item.crossLinkTopic && (
                <Link
                  href={`/learn/${item.crossLinkTopic.slug}/${item.crossLinkTopic.firstLessonSlug}`}
                  className="text-[10px] text-text-faint hover:text-text-subtle transition text-center leading-tight"
                >
                  ↳ builds on {item.crossLinkTopic.title}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

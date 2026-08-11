"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TopicWithLessons } from "@/types/lesson";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";
import { PATH_SECTIONS, getSectionForTopic } from "@/lib/learn/pathSections";
import { TIER_PALETTE } from "@/lib/learn/pathVisual";

export function LearnSidebar({ topics }: { topics: TopicWithLessons[] }) {
  const pathname = usePathname();
  const { progress } = useLessonProgress();

  // Grouped by curriculum tier — the same grouping the Learning Path trail
  // itself uses — rather than by exercise category, so this nav mirrors
  // what's actually shown on /learn instead of a different, category-based
  // cut of the same lessons.
  const grouped = useMemo(() => {
    return PATH_SECTIONS.map((section, i) => ({
      label: section.label,
      palette: TIER_PALETTE[i % TIER_PALETTE.length],
      topics: topics.filter((t) => getSectionForTopic(t.slug) === section.label),
    })).filter((s) => s.topics.length > 0);
  }, [topics]);

  // /learn/[topicSlug]/[lessonSlug] while on a lesson page, else null
  const activeSlugs = useMemo(() => {
    const m = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
    return m ? { topicSlug: m[1], lessonSlug: m[2] } : null;
  }, [pathname]);

  const activeSectionLabel = useMemo(() => {
    if (!activeSlugs) return null;
    return getSectionForTopic(activeSlugs.topicSlug);
  }, [activeSlugs]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Auto-expand (without collapsing anything the user already opened) whichever
  // tier contains the lesson currently being viewed.
  useEffect(() => {
    if (!activeSectionLabel) return;
    setExpanded((prev) => (prev.has(activeSectionLabel) ? prev : new Set(prev).add(activeSectionLabel)));
  }, [activeSectionLabel]);

  function toggle(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <nav className="text-sm">
      <Link
        href="/learn"
        className="block px-2 py-1.5 rounded-lg font-semibold text-text hover:bg-surface-2 transition"
      >
        📖 Learning Path
      </Link>
      <p className="px-2 mb-3 text-[11px] leading-snug text-text-faint">
        Jump to any lesson directly below, or follow the suggested path.
      </p>

      <div className="space-y-0.5">
        {grouped.map((section) => {
          const isOpen = expanded.has(section.label);
          const lessonCount = section.topics.reduce((n, t) => n + t.lessons.length, 0);
          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => toggle(section.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-text-faint text-xs w-3 inline-block">{isOpen ? "▾" : "▸"}</span>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${section.palette.nodeFill}`} />
                  <span>{section.label}</span>
                </span>
                <span className="text-text-faint text-xs">{lessonCount}</span>
              </button>

              {isOpen && (
                <div className={`ml-5 mt-0.5 mb-1 space-y-0.5 border-l-2 pl-3 ${section.palette.nodeRing}`}>
                  {section.topics.map((topic) => {
                    return (
                      <div key={topic.id} className="mb-1">
                        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-text-muted leading-snug">
                          {topic.title}
                        </p>
                        {topic.lessons.map((lesson) => {
                          const active = activeSlugs?.topicSlug === topic.slug && activeSlugs?.lessonSlug === lesson.slug;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/learn/${topic.slug}/${lesson.slug}`}
                              className={`flex items-start gap-2 px-2 py-1 rounded-lg transition leading-snug ${
                                active
                                  ? "bg-surface-2 text-text font-semibold"
                                  : "text-text-secondary font-medium hover:text-text hover:bg-surface-2"
                              }`}
                            >
                              <span className="mt-0.5"><StatusDot status={progress[lesson.id]} /></span>
                              <span>{lesson.title}</span>
                            </Link>
                          );
                        })}
                        {topic.lessons.length === 0 && (
                          <p className="px-2 py-1 text-xs italic text-text-faint">No lessons yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

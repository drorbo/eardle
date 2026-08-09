"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCategoryId, TopicWithLessons } from "@/types/lesson";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";
import { LEARN_CATEGORY_ORDER } from "@/lib/learn/categoryMeta";

export function LearnSidebar({ topics }: { topics: TopicWithLessons[] }) {
  const pathname = usePathname();
  const { progress } = useLessonProgress();

  const grouped = useMemo(() => {
    const map = new Map<NavCategoryId, TopicWithLessons[]>();
    for (const t of topics) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return LEARN_CATEGORY_ORDER.map((c) => ({ ...c, topics: map.get(c.id) ?? [] })).filter((c) => c.topics.length > 0);
  }, [topics]);

  // /learn/[topicSlug]/[lessonSlug] while on a lesson page, else null
  const activeSlugs = useMemo(() => {
    const m = pathname.match(/^\/learn\/([^/]+)\/([^/]+)/);
    return m ? { topicSlug: m[1], lessonSlug: m[2] } : null;
  }, [pathname]);

  const activeCategoryId = useMemo(() => {
    if (!activeSlugs) return null;
    const topic = topics.find((t) => t.slug === activeSlugs.topicSlug);
    return topic?.category ?? null;
  }, [activeSlugs, topics]);

  const [expanded, setExpanded] = useState<Set<NavCategoryId>>(new Set());

  // Auto-expand (without collapsing anything the user already opened) whichever
  // category contains the lesson currently being viewed.
  useEffect(() => {
    if (!activeCategoryId) return;
    setExpanded((prev) => (prev.has(activeCategoryId) ? prev : new Set(prev).add(activeCategoryId)));
  }, [activeCategoryId]);

  function toggle(id: NavCategoryId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="text-sm">
      <Link
        href="/learn"
        className="block px-2 py-1.5 rounded-lg font-semibold text-text hover:bg-surface-2 transition"
      >
        📖 Learn overview
      </Link>
      <p className="px-2 mb-3 text-[11px] leading-snug text-text-faint">
        Jump to any lesson directly, or use the overview above for the suggested order.
      </p>

      <div className="space-y-0.5">
        {grouped.map((cat) => {
          const isOpen = expanded.has(cat.id);
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-text-secondary hover:bg-surface-2 hover:text-text transition"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="text-text-faint text-xs w-3 inline-block">{isOpen ? "▾" : "▸"}</span>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
                <span className="text-text-faint text-xs">{cat.topics.length}</span>
              </button>

              {isOpen && (
                <div className="ml-5 mt-0.5 mb-1 space-y-0.5 border-l border-border-subtle pl-3">
                  {cat.topics.map((topic) => {
                    return (
                      <div key={topic.id} className="mb-1">
                        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-faint leading-snug">
                          {topic.title}
                        </p>
                        {topic.lessons.map((lesson) => {
                          const active = activeSlugs?.topicSlug === topic.slug && activeSlugs?.lessonSlug === lesson.slug;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/learn/${topic.slug}/${lesson.slug}`}
                              className={`flex items-start gap-2 px-2 py-1 rounded-lg transition leading-snug ${
                                active ? "bg-surface-2 text-text font-semibold" : "text-text-muted hover:text-text hover:bg-surface-2"
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

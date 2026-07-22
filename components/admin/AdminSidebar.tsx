"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORY_META, CATEGORY_TOPICS, Category } from "@/types/exercise";

interface CountRow { category: string; count: number }
interface TopicRow  { category: string; topic: string | null; count: number }

interface Props {
  categoryCounts: CountRow[];
  topicCounts: TopicRow[];
}

const CATEGORIES: Category[] = ["note", "interval", "chord", "progression", "scale"];

function SidebarInner({ categoryCounts, topicCounts }: Props) {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const selCat        = searchParams.get("category") as Category | null;
  const selTopic      = searchParams.get("topic");

  const onExercises = pathname === "/admin/exercises";

  const catCount = (cat: Category) =>
    categoryCounts.find(r => r.category === cat)?.count ?? 0;

  const topicCount = (cat: Category, topic: string) =>
    topicCounts.find(r => r.category === cat && r.topic === topic)?.count ?? 0;

  const total = categoryCounts.reduce((s, r) => s + r.count, 0);

  return (
    <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-800">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase text-indigo-400">
          🎧 Eardle Admin
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {/* All */}
        <Link
          href="/admin/exercises"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
            onExercises && !selCat
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span>All Exercises</span>
          <span className="opacity-50">{total}</span>
        </Link>

        <Link
          href="/admin/lessons"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
            pathname.startsWith("/admin/lessons")
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span>🎓 Lessons</span>
        </Link>

        <div className="pt-3 pb-1 px-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Categories</p>
        </div>

        {CATEGORIES.map(cat => {
          const meta    = CATEGORY_META[cat];
          const count   = catCount(cat);
          const topics  = CATEGORY_TOPICS[cat];
          const catHref = `/admin/exercises?category=${cat}`;
          const isCat   = onExercises && selCat === cat;

          return (
            <div key={cat}>
              <Link
                href={catHref}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition ${
                  isCat && !selTopic
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="text-gray-600 text-[11px]">{count}</span>
              </Link>

              <div className="ml-5 mt-0.5 space-y-0.5">
                {topics.map(t => {
                  const tc      = topicCount(cat, t.id);
                  if (!tc) return null;
                  const tHref   = `/admin/exercises?category=${cat}&topic=${t.id}`;
                  const active  = isCat && selTopic === t.id;
                  return (
                    <Link
                      key={t.id}
                      href={tHref}
                      className={`flex items-center justify-between px-3 py-1 rounded-lg text-[11px] transition ${
                        active
                          ? "bg-indigo-600/50 text-indigo-200"
                          : "text-gray-500 hover:text-gray-200 hover:bg-gray-800/60"
                      }`}
                    >
                      <span className="capitalize">{t.label}</span>
                      <span className="opacity-50">{tc}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-800 p-2 space-y-0.5">
        <Link
          href="/admin/stats"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
            pathname === "/admin/stats"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          📊 Stats
        </Link>
        <Link
          href="/admin/feedback"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ${
            pathname === "/admin/feedback"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          💬 Feedback
        </Link>
        <Link
          href="/admin/exercises/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 transition"
        >
          + New Exercise
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition text-left"
          >
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminSidebar(props: Props) {
  return (
    <Suspense
      fallback={
        <aside className="w-52 flex-shrink-0 bg-gray-900 border-r border-gray-800" />
      }
    >
      <SidebarInner {...props} />
    </Suspense>
  );
}

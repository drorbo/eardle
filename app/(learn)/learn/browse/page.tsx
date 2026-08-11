export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTopicsWithLessons } from "@/lib/db/lessons";
import { LearnOverviewClient } from "@/components/lesson/LearnOverviewClient";

export const metadata = {
  title: "Browse Lessons — Eardle",
  description: "Jump straight to lessons for a specific subject area.",
};

export default async function LearnBrowsePage() {
  const topics = await getTopicsWithLessons();

  return (
    <div className="max-w-3xl">
      <div className="mb-1.5 sm:mb-6 flex items-center gap-3 flex-wrap">
        <Link href="/learn" className="text-text-subtle hover:text-text-secondary transition text-xs sm:text-sm">
          ← Path
        </Link>
        <span className="text-text-faint text-xs sm:text-sm">·</span>
        <h1 className="text-base sm:text-2xl font-bold text-text">Browse by subject area</h1>
      </div>

      {topics.length === 0 ? (
        <p className="text-text-subtle text-sm">No lessons published yet — check back soon.</p>
      ) : (
        <LearnOverviewClient topics={topics} />
      )}
    </div>
  );
}

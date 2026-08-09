"use client";

import { usePathname } from "next/navigation";
import { LearnSidebar } from "@/components/lesson/LearnSidebar";
import type { TopicWithLessons } from "@/types/lesson";

/** Mobile-only "Browse all topics" disclosure shown above lesson pages.
 *  Hidden on the /learn overview itself — that page already has its own
 *  compact subject picker, so this would just be a second, redundant way
 *  to do the same thing while eating space above the fold. */
export function MobileBrowseDisclosure({ topics }: { topics: TopicWithLessons[] }) {
  const pathname = usePathname();
  if (pathname === "/learn") return null;

  return (
    <details className="w-full sm:hidden rounded-xl border border-border-subtle bg-surface px-3 py-2">
      <summary className="text-sm font-semibold text-text cursor-pointer select-none">
        🗂️ Browse all topics
      </summary>
      <div className="mt-3">
        <LearnSidebar topics={topics} />
      </div>
    </details>
  );
}

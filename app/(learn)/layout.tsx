import { getTopicsWithLessons } from "@/lib/db/lessons";
import { LearnSidebar } from "@/components/lesson/LearnSidebar";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const topics = await getTopicsWithLessons();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
      {/* Mobile: collapsed disclosure above the content. Desktop: persistent sticky column. */}
      <details className="w-full sm:hidden rounded-xl border border-border-subtle bg-surface px-3 py-2">
        <summary className="text-sm font-semibold text-text cursor-pointer select-none">
          🗂️ Browse all topics
        </summary>
        <div className="mt-3">
          <LearnSidebar topics={topics} />
        </div>
      </details>

      <aside className="hidden sm:block w-64 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-8">
        <LearnSidebar topics={topics} />
      </aside>

      <div className="min-w-0 flex-1 w-full">{children}</div>
    </div>
  );
}

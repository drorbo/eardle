export const dynamic = "force-dynamic";

import { getTopicsWithLessons } from "@/lib/db/lessons";
import { LearningPathView } from "@/components/lesson/LearningPathView";

export const metadata = {
  title: "Learn — Eardle",
  description: "A guided path through the music theory and ear-training concepts behind Eardle's exercises.",
};

export default async function LearnOverviewPage() {
  const topics = await getTopicsWithLessons();

  return (
    <div className="max-w-3xl">
      <div className="mb-1.5 sm:mb-6">
        <h1 className="text-base sm:text-3xl font-bold text-text sm:mb-2">Learn</h1>
        <p className="text-text-muted text-[11px] sm:text-sm hidden sm:block">
          Every lesson, in the order that builds on itself.
        </p>
      </div>

      {topics.length === 0 ? (
        <p className="text-text-subtle text-sm">No lessons published yet — check back soon.</p>
      ) : (
        <LearningPathView topics={topics} />
      )}
    </div>
  );
}

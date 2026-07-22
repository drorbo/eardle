import { getTopicsWithLessons } from "@/lib/db/lessons";
import { LearnOverviewClient } from "@/components/lesson/LearnOverviewClient";

export const metadata = {
  title: "Learn — Eardle",
  description: "A guided path through the music theory and ear-training concepts behind Eardle's exercises.",
};

export default async function LearnOverviewPage() {
  const topics = await getTopicsWithLessons();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Learn</h1>
        <p className="text-text-muted text-sm">
          A suggested path through the ideas behind Eardle&apos;s exercises — read at your own pace,
          jump to any topic any time.
        </p>
      </div>

      {topics.length === 0 ? (
        <p className="text-text-subtle text-sm">No lessons published yet — check back soon.</p>
      ) : (
        <LearnOverviewClient topics={topics} />
      )}
    </div>
  );
}

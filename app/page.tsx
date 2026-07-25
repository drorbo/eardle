export const dynamic = "force-dynamic";

import { HomeActionCard } from "@/components/ui/HomeActionCard";
import { Category, CATEGORY_META } from "@/types/exercise";
import { getOrCreateDailyPuzzle } from "@/lib/daily/generate";
import { todaysPuzzleDateStr } from "@/lib/daily/config";

export default async function HomePage() {
  const dailyPuzzle = await getOrCreateDailyPuzzle(todaysPuzzleDateStr());
  const dailyDescription =
    dailyPuzzle?.category && dailyPuzzle?.difficulty
      ? `Today: ${CATEGORY_META[dailyPuzzle.category as Category].emoji} ${dailyPuzzle.category} · ${dailyPuzzle.difficulty}`
      : "One shared puzzle a day — 5 guesses to solve it.";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20">
      <div className="text-center mb-6 sm:mb-10">
        <h1 className="text-4xl sm:text-6xl font-bold text-text mb-4 tracking-tight">
          Train Your Ear
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-xl mx-auto">
          Interactive exercises to sharpen your musical hearing — notes, intervals, chords, progressions, and scales.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <HomeActionCard
          href="/daily"
          emoji="📅"
          eyebrow="New puzzle every day"
          title="Daily EarDle"
          description={dailyDescription}
          ctaText="Play Today →"
          colorClasses="
            from-orange-300 via-orange-200 to-yellow-200 border-orange-400 hover:border-orange-500
            dark:from-orange-700/70 dark:via-orange-600/50 dark:to-amber-600/40 dark:border-orange-500 dark:hover:border-orange-400
          "
          eyebrowClasses="text-orange-800 dark:text-orange-200"
          ctaTextClasses="text-orange-700"
        />
        <HomeActionCard
          href="/practice"
          emoji="🎯"
          eyebrow="Practice anytime"
          title="Practice Mode"
          description="Free practice across notes, intervals, chords, progressions, and scales — pick a category and difficulty."
          ctaText="Start Practicing →"
          colorClasses="
            from-sky-300 via-sky-200 to-cyan-200 border-sky-400 hover:border-sky-500
            dark:from-sky-700/70 dark:via-sky-600/50 dark:to-cyan-600/40 dark:border-sky-500 dark:hover:border-sky-400
          "
          eyebrowClasses="text-sky-800 dark:text-sky-200"
          ctaTextClasses="text-sky-700"
        />
        <HomeActionCard
          href="/learn"
          emoji="🎓"
          eyebrow="Build the theory"
          title="Learning Platform"
          description="Structured lessons that build the theory behind what you're hearing, topic by topic."
          ctaText="Start Learning →"
          colorClasses="
            from-violet-300 via-violet-200 to-purple-200 border-violet-400 hover:border-violet-500
            dark:from-violet-700/70 dark:via-violet-600/50 dark:to-purple-600/40 dark:border-violet-500 dark:hover:border-violet-400
          "
          eyebrowClasses="text-violet-800 dark:text-violet-200"
          ctaTextClasses="text-violet-700"
          sticker={
            <span className="absolute -top-3 -right-3 rotate-12 bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-bg z-10">
              NEW!
            </span>
          }
        />
      </div>

      <p className="text-center text-text-faint text-sm mt-12">
        Press play, listen carefully, then pick your answer.
      </p>
    </div>
  );
}

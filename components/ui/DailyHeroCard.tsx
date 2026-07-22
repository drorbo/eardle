import Link from "next/link";
import { InfoTooltip } from "./InfoTooltip";
import { DAILY_INFO_TEXT } from "@/lib/daily/config";

interface Props {
  category?: string;
  difficulty?: string;
  emoji?: string;
}

export function DailyHeroCard({ category, difficulty, emoji }: Props) {
  return (
    <div
      className="
        group relative rounded-2xl p-5 sm:p-8 mb-8 sm:mb-12
        bg-gradient-to-br from-orange-300 via-orange-200 to-yellow-200
        border border-orange-400 hover:border-orange-500
        dark:from-orange-700/70 dark:via-orange-600/50 dark:to-amber-600/40
        dark:border-orange-500 dark:hover:border-orange-400
        transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
      "
    >
      {/* Fills the whole card as the click target; content above is pointer-events-none
          so clicks pass through to this Link, except the info icon which opts back in. */}
      <Link href="/daily" className="absolute inset-0 rounded-2xl" aria-label="Play today's Daily EarDle" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap pointer-events-none">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">📅</span>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-800 dark:text-orange-200">New puzzle every day</span>
            <span className="pointer-events-auto">
              <InfoTooltip text={DAILY_INFO_TEXT} />
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-1">Daily EarDle</h2>
          <p className="text-sm text-text-secondary">
            {category && difficulty ? (
              <>
                Today: {emoji} <span className="capitalize">{category}</span> ·{" "}
                <span className="capitalize">{difficulty}</span>
              </>
            ) : (
              "One shared puzzle a day — 5 guesses to solve it."
            )}
          </p>
        </div>
        <span
          className="
            flex-shrink-0 px-6 py-3 rounded-xl bg-white text-orange-700 font-bold text-sm sm:text-base
            group-hover:bg-orange-50 transition shadow-sm
          "
        >
          Play Today →
        </span>
      </div>
    </div>
  );
}

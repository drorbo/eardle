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
        bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-fuchsia-900/30
        border border-indigo-700/50 hover:border-indigo-500
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
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">New puzzle every day</span>
            <span className="pointer-events-auto">
              <InfoTooltip text={DAILY_INFO_TEXT} />
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Daily EarDle</h2>
          <p className="text-sm text-gray-300">
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
            flex-shrink-0 px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-sm sm:text-base
            group-hover:bg-indigo-50 transition
          "
        >
          Play Today →
        </span>
      </div>
    </div>
  );
}

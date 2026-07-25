import Link from "next/link";

interface Props {
  href: string;
  emoji: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  colorClasses: string;      // gradient + border, same convention as DailyHeroCard/CategoryCard
  eyebrowClasses: string;    // eyebrow text color, tuned per card for contrast against colorClasses
  ctaTextClasses: string;    // CTA pill text color, same reasoning
  sticker?: React.ReactNode;
}

export function HomeActionCard({
  href, emoji, eyebrow, title, description, ctaText, colorClasses, eyebrowClasses, ctaTextClasses, sticker,
}: Props) {
  return (
    <div
      className={`
        group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-6 h-full flex flex-col
        bg-gradient-to-br ${colorClasses}
        border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
      `}
    >
      {/* Fills the whole card as the click target; content below is pointer-events-none
          so clicks pass through to this Link. Mirrors DailyHeroCard's pattern. */}
      <Link href={href} className="absolute inset-0 rounded-xl sm:rounded-2xl" aria-label={title} />

      {sticker}

      <div className="relative flex flex-col gap-1 sm:gap-3 pointer-events-none flex-1 min-h-0">
        <div className="min-h-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1.5">
            <span className="text-sm sm:text-xl">{emoji}</span>
            <span className={`hidden sm:inline text-xs font-bold uppercase tracking-widest ${eyebrowClasses}`}>{eyebrow}</span>
          </div>
          <h2 className="text-sm sm:text-2xl font-bold text-text mb-0 sm:mb-1 leading-tight">{title}</h2>
          <p className="text-[10px] sm:text-sm text-text-secondary line-clamp-1 sm:line-clamp-none">{description}</p>
        </div>
        <span
          className={`
            mt-auto self-start px-2.5 py-1 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white font-bold text-[11px] sm:text-sm shadow-sm
            group-hover:opacity-90 transition ${ctaTextClasses}
          `}
        >
          {ctaText}
        </span>
      </div>
    </div>
  );
}

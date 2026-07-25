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
        group relative rounded-2xl p-5 sm:p-6 flex flex-col
        bg-gradient-to-br ${colorClasses}
        border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
      `}
    >
      {/* Fills the whole card as the click target; content below is pointer-events-none
          so clicks pass through to this Link. Mirrors DailyHeroCard's pattern. */}
      <Link href={href} className="absolute inset-0 rounded-2xl" aria-label={title} />

      {sticker}

      <div className="relative flex flex-col gap-3 pointer-events-none flex-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">{emoji}</span>
            <span className={`text-xs font-bold uppercase tracking-widest ${eyebrowClasses}`}>{eyebrow}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-1">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <span
          className={`
            mt-auto self-start px-5 py-2.5 rounded-xl bg-white font-bold text-sm shadow-sm
            group-hover:opacity-90 transition ${ctaTextClasses}
          `}
        >
          {ctaText}
        </span>
      </div>
    </div>
  );
}

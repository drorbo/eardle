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
        group relative rounded-xl sm:rounded-2xl p-3 sm:p-6 h-full flex flex-col
        bg-gradient-to-br ${colorClasses}
        border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
      `}
    >
      {/* Fills the whole card as the click target; content below is pointer-events-none
          so clicks pass through to this Link. Mirrors DailyHeroCard's pattern. */}
      <Link href={href} className="absolute inset-0 rounded-xl sm:rounded-2xl" aria-label={title} />

      {/* Sticker renders outside the overflow-hidden content wrapper below —
          it's deliberately positioned partially outside the card edge
          (ad-style corner sticker), so it must not be clipped by the
          text-overflow safety net that wrapper provides. */}
      {sticker}

      {/* Below sm, card height varies by phone (it's 1/3 of whatever viewport
          height is left after the navbar/header — see app/page.tsx), but the
          card's own height is what actually flexes to fill that space — text
          stays one fixed, comfortably-legible size rather than trying to
          scale continuously with it. (An earlier attempt at vh-based
          clamp() text sizing silently generated no CSS at all in this
          Tailwind v4/Turbopack setup — arbitrary clamp() values aren't
          reliable here, so don't reintroduce that pattern.) overflow-hidden
          here is a safety net against any edge-case text overflow, not the
          sizing strategy — scoped to this inner wrapper (not the outer card)
          so it doesn't clip the sticker above. Content is centered as a
          block on mobile (rather than top-anchored with the CTA pushed to
          the bottom) so extra room on taller phones doesn't just become an
          awkward empty gap. */}
      <div className="relative overflow-hidden flex flex-col justify-center sm:justify-start gap-1.5 sm:gap-3 pointer-events-none flex-1 min-h-0">
        <div className="min-h-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
            <span className="text-lg sm:text-xl">{emoji}</span>
            <span className={`text-xs font-bold uppercase tracking-widest ${eyebrowClasses}`}>{eyebrow}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-text mb-1 leading-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 sm:line-clamp-none">{description}</p>
        </div>
        <span
          className={`
            self-start sm:mt-auto px-3 py-1.5 sm:px-5 sm:py-2.5
            rounded-lg sm:rounded-xl bg-white font-bold text-xs sm:text-sm shadow-sm
            group-hover:opacity-90 transition ${ctaTextClasses}
          `}
        >
          {ctaText}
        </span>
      </div>
    </div>
  );
}

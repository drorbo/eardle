import Link from "next/link";
import { Category, CATEGORY_META } from "@/types/exercise";

// Mapped away from the literal indigo/violet/purple/fuchsia/pink hues named
// by CATEGORY_META — those all sit in the same purple family as the page
// background/theme now, so category cards would blend into it. These render
// as clearly different hues (blue/teal/amber/rose/green) instead, while
// keeping the original semantic keys.
//
// Light-mode shades are pulled up to the 300/200 range (rather than pale
// 100/50) so they sit at roughly the same visual weight as the saturated
// violet-400 page background — pale pastels there read as oddly "lighter
// than the page" instead of as a distinct card.
const colorMap: Record<string, string> = {
  indigo:  "from-sky-300 to-sky-200 border-sky-400 hover:border-sky-500 dark:from-sky-800/70 dark:to-sky-700/40 dark:border-sky-600 dark:hover:border-sky-400",
  violet:  "from-teal-300 to-teal-200 border-teal-400 hover:border-teal-500 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600 dark:hover:border-teal-400",
  purple:  "from-amber-300 to-amber-200 border-amber-400 hover:border-amber-500 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600 dark:hover:border-amber-400",
  fuchsia: "from-rose-300 to-rose-200 border-rose-400 hover:border-rose-500 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600 dark:hover:border-rose-400",
  pink:    "from-emerald-300 to-emerald-200 border-emerald-400 hover:border-emerald-500 dark:from-emerald-800/70 dark:to-emerald-700/40 dark:border-emerald-600 dark:hover:border-emerald-400",
};

interface CategoryCardProps {
  category: Category;
  count: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const meta = CATEGORY_META[category];
  const colors = colorMap[meta.color];
  return (
    <Link
      href={`/${category}`}
      className={`
        group relative flex flex-col gap-3 p-6 rounded-2xl
        bg-gradient-to-br ${colors}
        border transition-all duration-200
        hover:scale-[1.02] active:scale-[0.99]
      `}
    >
      <span className="text-4xl">{meta.emoji}</span>
      <div>
        <h2 className="text-xl font-bold text-text mb-1">{meta.label}</h2>
        <p className="text-sm text-text-muted">{meta.description}</p>
      </div>
      <span className="text-xs text-text-subtle mt-auto">{count} exercises</span>
    </Link>
  );
}

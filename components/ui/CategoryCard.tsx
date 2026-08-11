import Link from "next/link";
import { Category, CATEGORY_META } from "@/types/exercise";
import { HUES, type Hue } from "@/lib/design/palette";

// Mapped away from the literal indigo/violet/purple/fuchsia/pink hues named
// by CATEGORY_META — those all sit in the same purple family as the page
// background/theme now, so category cards would blend into it. These render
// as clearly different hues (blue/teal/amber/rose/green) instead, while
// keeping the original semantic keys. Actual class strings live once in
// lib/design/palette.ts — this only maps CATEGORY_META's color name to a hue.
const colorMap: Record<string, Hue> = {
  indigo: "sky",
  violet: "teal",
  purple: "amber",
  fuchsia: "rose",
  pink: "emerald",
};

interface CategoryCardProps {
  category: Category;
  count: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const meta = CATEGORY_META[category];
  const colors = HUES[colorMap[meta.color]].tile;
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

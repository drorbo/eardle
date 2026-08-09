import type { LearnCategoryMeta } from "@/lib/learn/categoryMeta";

interface Props {
  meta: LearnCategoryMeta;
  active: boolean;
  onSelect: () => void;
}

/** Compact mobile-only picker — a single scrollable row instead of
 *  CategoryTile's grid, so the picker stays small and lessons are visible
 *  without scrolling past a tall grid first. See CategoryTile for the
 *  full-size sm+ version. */
export function CategoryChip({ meta, active, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`
        flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
        border transition-all whitespace-nowrap
        ${active
          ? `bg-gradient-to-br ${meta.colorClasses} text-text ring-2 ring-offset-1 ring-offset-bg ring-text/70`
          : "bg-surface border-border-subtle text-text-muted"}
      `}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
    </button>
  );
}

import type { LearnCategoryMeta } from "@/lib/learn/categoryMeta";

interface Props {
  meta: LearnCategoryMeta;
  completed: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}

export function CategoryTile({ meta, completed, total, expanded, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`
        text-left rounded-xl sm:rounded-2xl p-3 sm:p-4
        bg-gradient-to-br ${meta.colorClasses}
        border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
        ${expanded ? "ring-2 ring-offset-1 ring-border" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl sm:text-2xl">{meta.emoji}</span>
        <span className="text-text-faint text-xs">{expanded ? "▾" : "▸"}</span>
      </div>
      <h3 className="text-sm sm:text-base font-bold text-text leading-tight">{meta.label}</h3>
      <p className="text-xs text-text-subtle mt-0.5">
        {total === 0 ? "No lessons yet" : `${completed}/${total} done`}
      </p>
    </button>
  );
}

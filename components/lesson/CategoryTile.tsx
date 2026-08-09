import type { LearnCategoryMeta } from "@/lib/learn/categoryMeta";

interface Props {
  meta: LearnCategoryMeta;
  completed: number;
  total: number;
  active: boolean;
  onSelect: () => void;
}

export function CategoryTile({ meta, completed, total, active, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`
        text-left rounded-xl sm:rounded-2xl p-3 sm:p-4
        bg-gradient-to-br ${meta.colorClasses}
        border transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]
        ${active ? "ring-2 ring-offset-2 ring-offset-bg ring-text/70" : ""}
      `}
    >
      <span className="text-xl sm:text-2xl">{meta.emoji}</span>
      <h3 className="text-sm sm:text-base font-bold text-text leading-tight mt-1">{meta.label}</h3>
      <p className="text-xs text-text-subtle mt-0.5">
        {total === 0 ? "No lessons yet" : `${completed}/${total} done`}
      </p>
    </button>
  );
}

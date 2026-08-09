import { CATEGORY_META, type Category } from "@/types/exercise";
import type { NavCategoryId } from "@/types/lesson";

export interface LearnCategoryMeta {
  id: NavCategoryId;
  label: string;
  emoji: string;
  /** Tailwind gradient/border classes (light + dark), same visual weight as
   *  CategoryCard.tsx's resolved hues on /practice. Kept as a local literal
   *  rather than derived from CATEGORY_META.color so "fundamentals" — which
   *  has no Category value — can have its own entry in the same list. */
  colorClasses: string;
}

const REAL_CATEGORY_COLORS: Record<Category, string> = {
  note:        "from-sky-300 to-sky-200 border-sky-400 hover:border-sky-500 dark:from-sky-800/70 dark:to-sky-700/40 dark:border-sky-600 dark:hover:border-sky-400",
  interval:    "from-teal-300 to-teal-200 border-teal-400 hover:border-teal-500 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600 dark:hover:border-teal-400",
  chord:       "from-amber-300 to-amber-200 border-amber-400 hover:border-amber-500 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600 dark:hover:border-amber-400",
  progression: "from-rose-300 to-rose-200 border-rose-400 hover:border-rose-500 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600 dark:hover:border-rose-400",
  scale:       "from-emerald-300 to-emerald-200 border-emerald-400 hover:border-emerald-500 dark:from-emerald-800/70 dark:to-emerald-700/40 dark:border-emerald-600 dark:hover:border-emerald-400",
};

export const LEARN_CATEGORY_ORDER: LearnCategoryMeta[] = [
  {
    id: "fundamentals",
    label: "Fundamentals",
    emoji: "🧱",
    colorClasses: "from-slate-300 to-slate-200 border-slate-400 hover:border-slate-500 dark:from-slate-700/70 dark:to-slate-600/40 dark:border-slate-500 dark:hover:border-slate-400",
  },
  { id: "note", label: CATEGORY_META.note.label, emoji: CATEGORY_META.note.emoji, colorClasses: REAL_CATEGORY_COLORS.note },
  { id: "interval", label: CATEGORY_META.interval.label, emoji: CATEGORY_META.interval.emoji, colorClasses: REAL_CATEGORY_COLORS.interval },
  { id: "chord", label: CATEGORY_META.chord.label, emoji: CATEGORY_META.chord.emoji, colorClasses: REAL_CATEGORY_COLORS.chord },
  { id: "progression", label: CATEGORY_META.progression.label, emoji: CATEGORY_META.progression.emoji, colorClasses: REAL_CATEGORY_COLORS.progression },
  { id: "scale", label: CATEGORY_META.scale.label, emoji: CATEGORY_META.scale.emoji, colorClasses: REAL_CATEGORY_COLORS.scale },
];

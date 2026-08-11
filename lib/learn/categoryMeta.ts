import { CATEGORY_META, type Category } from "@/types/exercise";
import type { NavCategoryId } from "@/types/lesson";
import { HUES, type Hue } from "@/lib/design/palette";

export interface LearnCategoryMeta {
  id: NavCategoryId;
  label: string;
  emoji: string;
  /** Tailwind gradient/border classes (light + dark), same visual weight as
   *  CategoryCard.tsx's resolved hues on /practice — both pull from the same
   *  lib/design/palette.ts hue table, not from CATEGORY_META.color, so
   *  "fundamentals" (which has no Category value) can have its own entry in
   *  the same list. */
  colorClasses: string;
}

// Same category → hue assignment CategoryCard.tsx uses for /practice's tiles,
// kept here as the second, independent place that needs it (fundamentals has
// no Category value to hang a mapping off of on that side).
const CATEGORY_HUES: Record<Category, Hue> = {
  note: "sky",
  interval: "teal",
  chord: "amber",
  progression: "rose",
  scale: "emerald",
};

export const LEARN_CATEGORY_ORDER: LearnCategoryMeta[] = [
  {
    id: "fundamentals",
    label: "Fundamentals",
    emoji: "🧱",
    colorClasses: HUES.slate.tile,
  },
  // Relabeled from CATEGORY_META.note.label ("Note ID") for this context —
  // that's exercise-picker language; here it's a subject-area tab, and
  // "Notes & Pitch" reads better as a lessons grouping.
  { id: "note", label: "Notes & Pitch", emoji: CATEGORY_META.note.emoji, colorClasses: HUES[CATEGORY_HUES.note].tile },
  { id: "interval", label: CATEGORY_META.interval.label, emoji: CATEGORY_META.interval.emoji, colorClasses: HUES[CATEGORY_HUES.interval].tile },
  { id: "chord", label: CATEGORY_META.chord.label, emoji: CATEGORY_META.chord.emoji, colorClasses: HUES[CATEGORY_HUES.chord].tile },
  { id: "progression", label: CATEGORY_META.progression.label, emoji: CATEGORY_META.progression.emoji, colorClasses: HUES[CATEGORY_HUES.progression].tile },
  { id: "scale", label: CATEGORY_META.scale.label, emoji: CATEGORY_META.scale.emoji, colorClasses: HUES[CATEGORY_HUES.scale].tile },
];

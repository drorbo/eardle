import type { Degree } from "@/lib/audio/lessonPlayback";

export interface DegreeColor {
  bg: string;   // fill color for keys/noteheads
  text: string; // readable label color against `bg`
  ring: string; // border/outline accent
}

// One hue per scale degree, shared by the piano keyboard and staff notation
// so "the 3rd" is always the same color everywhere. Deliberately avoids
// indigo/violet (already means "selected" elsewhere, e.g. ExercisePlayer's
// instrument/play-mode pills) and amber (already means "warning", e.g.
// LessonBlocks' commonMistake callout).
const LIGHT: Record<number, DegreeColor> = {
  0: { bg: "#dc2626", text: "#ffffff", ring: "#b91c1c" }, // Root — red-600
  1: { bg: "#ea580c", text: "#ffffff", ring: "#c2410c" }, // 2nd — orange-600
  2: { bg: "#65a30d", text: "#ffffff", ring: "#4d7c0f" }, // 3rd — lime-600
  3: { bg: "#059669", text: "#ffffff", ring: "#047857" }, // 4th — emerald-600
  4: { bg: "#0d9488", text: "#ffffff", ring: "#0f766e" }, // 5th — teal-600
  5: { bg: "#0284c7", text: "#ffffff", ring: "#0369a1" }, // 6th — sky-600
  6: { bg: "#db2777", text: "#ffffff", ring: "#be185d" }, // 7th — pink-600
};

const DARK: Record<number, DegreeColor> = {
  0: { bg: "#f87171", text: "#1e1b2e", ring: "#ef4444" }, // Root — red-400
  1: { bg: "#fb923c", text: "#1e1b2e", ring: "#f97316" }, // 2nd — orange-400
  2: { bg: "#a3e635", text: "#1e1b2e", ring: "#84cc16" }, // 3rd — lime-400
  3: { bg: "#34d399", text: "#1e1b2e", ring: "#10b981" }, // 4th — emerald-400
  4: { bg: "#2dd4bf", text: "#1e1b2e", ring: "#14b8a6" }, // 5th — teal-400
  5: { bg: "#38bdf8", text: "#1e1b2e", ring: "#0ea5e9" }, // 6th — sky-400
  6: { bg: "#f472b6", text: "#1e1b2e", ring: "#ec4899" }, // 7th — pink-400
};

const NEUTRAL_LIGHT: DegreeColor = { bg: "#64748b", text: "#ffffff", ring: "#475569" };
const NEUTRAL_DARK: DegreeColor = { bg: "#94a3b8", text: "#1e1b2e", ring: "#64748b" };

export function getDegreeColor(degree: Degree, isDark: boolean): DegreeColor {
  if (degree === "neutral") return isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT;
  const table = isDark ? DARK : LIGHT;
  return table[degree] ?? (isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT);
}

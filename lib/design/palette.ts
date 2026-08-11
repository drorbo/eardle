// Single source of truth for the small set of Tailwind color hues used to
// visually distinguish "pick one of N groups" UI across the app (exercise
// category tiles, curriculum-tier trail banners/nodes, etc).
//
// Each hue's classes are written out in full below — Tailwind's build-time
// scanner only picks up literal class names that appear as text in source
// files, so these can never be assembled from a template string like
// `bg-${hue}-500` (that would silently produce no CSS at all). Consolidating
// the six-part light/dark boilerplate here once, instead of retyping it per
// hue in every feature that needs a color, is what actually prevents two
// copies drifting out of sync — which is exactly how a too-pale sidebar
// heading shipped once (see the 2026-08-11 dev-process audit). Every
// consumer should reference HUES[...] rather than hand-writing new class
// strings.

export type Hue = "slate" | "sky" | "cyan" | "teal" | "emerald" | "amber" | "rose" | "fuchsia";

export interface HueClasses {
  /** Gradient tile background + border, WITH a hover state — for clickable cards/tiles. */
  tile: string;
  /** Same gradient, no hover — for static banners/headers. */
  banner: string;
  bannerText: string;
  /** Solid fill — for a "selected / completed / active" state. */
  fill: string;
  /** Border/ring only, no fill — for an "unselected / outline" state. */
  ring: string;
  ringText: string;
  /** Light tint fill — for an in-between "partial / in-progress" state. */
  tint: string;
}

export const HUES: Record<Hue, HueClasses> = {
  slate: {
    tile: "from-slate-300 to-slate-200 border-slate-400 hover:border-slate-500 dark:from-slate-700/70 dark:to-slate-600/40 dark:border-slate-500 dark:hover:border-slate-400",
    banner: "from-slate-300 to-slate-200 border-slate-400 dark:from-slate-700/70 dark:to-slate-600/40 dark:border-slate-500",
    bannerText: "text-slate-800 dark:text-slate-100",
    fill: "bg-slate-500",
    ring: "border-slate-400 dark:border-slate-500",
    ringText: "text-slate-500 dark:text-slate-400",
    tint: "bg-slate-100 dark:bg-slate-800/60",
  },
  sky: {
    tile: "from-sky-300 to-sky-200 border-sky-400 hover:border-sky-500 dark:from-sky-800/70 dark:to-sky-700/40 dark:border-sky-600 dark:hover:border-sky-400",
    banner: "from-sky-300 to-sky-200 border-sky-400 dark:from-sky-800/70 dark:to-sky-700/40 dark:border-sky-600",
    bannerText: "text-sky-900 dark:text-sky-100",
    fill: "bg-sky-500",
    ring: "border-sky-400 dark:border-sky-500",
    ringText: "text-sky-600 dark:text-sky-400",
    tint: "bg-sky-100 dark:bg-sky-900/50",
  },
  cyan: {
    tile: "from-cyan-300 to-cyan-200 border-cyan-400 hover:border-cyan-500 dark:from-cyan-800/70 dark:to-cyan-700/40 dark:border-cyan-600 dark:hover:border-cyan-400",
    banner: "from-cyan-300 to-cyan-200 border-cyan-400 dark:from-cyan-800/70 dark:to-cyan-700/40 dark:border-cyan-600",
    bannerText: "text-cyan-900 dark:text-cyan-100",
    fill: "bg-cyan-500",
    ring: "border-cyan-400 dark:border-cyan-500",
    ringText: "text-cyan-600 dark:text-cyan-400",
    tint: "bg-cyan-100 dark:bg-cyan-900/50",
  },
  teal: {
    tile: "from-teal-300 to-teal-200 border-teal-400 hover:border-teal-500 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600 dark:hover:border-teal-400",
    banner: "from-teal-300 to-teal-200 border-teal-400 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600",
    bannerText: "text-teal-900 dark:text-teal-100",
    fill: "bg-teal-500",
    ring: "border-teal-400 dark:border-teal-500",
    ringText: "text-teal-600 dark:text-teal-400",
    tint: "bg-teal-100 dark:bg-teal-900/50",
  },
  emerald: {
    tile: "from-emerald-300 to-emerald-200 border-emerald-400 hover:border-emerald-500 dark:from-emerald-800/70 dark:to-emerald-700/40 dark:border-emerald-600 dark:hover:border-emerald-400",
    banner: "from-emerald-300 to-emerald-200 border-emerald-400 dark:from-emerald-800/70 dark:to-emerald-700/40 dark:border-emerald-600",
    bannerText: "text-emerald-900 dark:text-emerald-100",
    fill: "bg-emerald-500",
    ring: "border-emerald-400 dark:border-emerald-500",
    ringText: "text-emerald-600 dark:text-emerald-400",
    tint: "bg-emerald-100 dark:bg-emerald-900/50",
  },
  amber: {
    tile: "from-amber-300 to-amber-200 border-amber-400 hover:border-amber-500 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600 dark:hover:border-amber-400",
    banner: "from-amber-300 to-amber-200 border-amber-400 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600",
    bannerText: "text-amber-900 dark:text-amber-100",
    fill: "bg-amber-500",
    ring: "border-amber-400 dark:border-amber-500",
    ringText: "text-amber-600 dark:text-amber-400",
    tint: "bg-amber-100 dark:bg-amber-900/50",
  },
  rose: {
    tile: "from-rose-300 to-rose-200 border-rose-400 hover:border-rose-500 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600 dark:hover:border-rose-400",
    banner: "from-rose-300 to-rose-200 border-rose-400 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600",
    bannerText: "text-rose-900 dark:text-rose-100",
    fill: "bg-rose-500",
    ring: "border-rose-400 dark:border-rose-500",
    ringText: "text-rose-600 dark:text-rose-400",
    tint: "bg-rose-100 dark:bg-rose-900/50",
  },
  fuchsia: {
    tile: "from-fuchsia-300 to-fuchsia-200 border-fuchsia-400 hover:border-fuchsia-500 dark:from-fuchsia-800/70 dark:to-fuchsia-700/40 dark:border-fuchsia-600 dark:hover:border-fuchsia-400",
    banner: "from-fuchsia-300 to-fuchsia-200 border-fuchsia-400 dark:from-fuchsia-800/70 dark:to-fuchsia-700/40 dark:border-fuchsia-600",
    bannerText: "text-fuchsia-900 dark:text-fuchsia-100",
    fill: "bg-fuchsia-500",
    ring: "border-fuchsia-400 dark:border-fuchsia-500",
    ringText: "text-fuchsia-600 dark:text-fuchsia-400",
    tint: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
  },
};

// Pure geometry + color helpers for the winding Learning Path trail
// (components/lesson/LearningTrail.tsx). Kept separate from that component
// so the wave math and palette can be unit-reasoned-about without JSX.

export interface TrailPoint {
  /** 0-100, treated as a percentage of the trail's rendered width. */
  x: number;
  /** px, distance from the top of this tier's trail segment. */
  y: number;
}

const WAVE_MID = 50;
const WAVE_AMPLITUDE = 26;
const WAVE_PERIOD = 6;

/** Vertical space reserved per node — circle + connecting curve + label. */
export const TRAIL_ROW_HEIGHT = 118;

// Rounded to 2 decimal places — Math.sin can differ in its last bit between
// server (Node) and client (browser) engines, which was enough to make the
// generated SVG path string mismatch between SSR and hydration.
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function trailPoint(index: number): TrailPoint {
  return {
    x: round2(WAVE_MID + WAVE_AMPLITUDE * Math.sin((index * 2 * Math.PI) / WAVE_PERIOD)),
    y: index * TRAIL_ROW_HEIGHT + TRAIL_ROW_HEIGHT / 2,
  };
}

/**
 * A smooth S-curve through every node in a trail segment: each pair of
 * consecutive points is joined by a cubic bezier whose control points sit
 * horizontally in line with each endpoint but vertically at the midpoint —
 * the standard "wavy connector" trick behind most Duolingo-style path
 * clones, and cheap enough to compute analytically with no DOM measurement.
 */
export function trailPathD(count: number): string {
  if (count < 2) return "";
  const points = Array.from({ length: count }, (_, i) => trailPoint(i));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export interface TierColor {
  /** Unit banner background gradient + border. */
  banner: string;
  bannerText: string;
  /** Solid fill for a completed or current node. */
  nodeFill: string;
  /** Border/ring color for an upcoming (not-yet-viewed) node's outline. */
  nodeRing: string;
  /** Text color used for numbers/text sitting on nodeRing (upcoming) nodes. */
  nodeRingText: string;
  /** Light tint fill for a viewed-but-not-completed ("in progress") node —
   *  visually between the plain outline (not started) and the solid fill
   *  (completed). */
  nodeTint: string;
}

// One color per curriculum tier (see lib/learn/pathSections.ts) — a
// deliberately different hue set from CATEGORY_META/REAL_CATEGORY_COLORS,
// since tiers are a different grouping than exercise categories and
// reusing the same hues would wrongly imply they're the same thing.
export const TIER_PALETTE: TierColor[] = [
  {
    banner:
      "from-slate-300 to-slate-200 border-slate-400 dark:from-slate-700/70 dark:to-slate-600/40 dark:border-slate-500",
    bannerText: "text-slate-800 dark:text-slate-100",
    nodeFill: "bg-slate-500",
    nodeRing: "border-slate-400 dark:border-slate-500",
    nodeRingText: "text-slate-500 dark:text-slate-400",
    nodeTint: "bg-slate-100 dark:bg-slate-800/60",
  },
  {
    banner:
      "from-cyan-300 to-cyan-200 border-cyan-400 dark:from-cyan-800/70 dark:to-cyan-700/40 dark:border-cyan-600",
    bannerText: "text-cyan-900 dark:text-cyan-100",
    nodeFill: "bg-cyan-500",
    nodeRing: "border-cyan-400 dark:border-cyan-500",
    nodeRingText: "text-cyan-600 dark:text-cyan-400",
    nodeTint: "bg-cyan-100 dark:bg-cyan-900/50",
  },
  {
    banner:
      "from-teal-300 to-teal-200 border-teal-400 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600",
    bannerText: "text-teal-900 dark:text-teal-100",
    nodeFill: "bg-teal-500",
    nodeRing: "border-teal-400 dark:border-teal-500",
    nodeRingText: "text-teal-600 dark:text-teal-400",
    nodeTint: "bg-teal-100 dark:bg-teal-900/50",
  },
  {
    banner:
      "from-amber-300 to-amber-200 border-amber-400 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600",
    bannerText: "text-amber-900 dark:text-amber-100",
    nodeFill: "bg-amber-500",
    nodeRing: "border-amber-400 dark:border-amber-500",
    nodeRingText: "text-amber-600 dark:text-amber-400",
    nodeTint: "bg-amber-100 dark:bg-amber-900/50",
  },
  {
    banner:
      "from-rose-300 to-rose-200 border-rose-400 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600",
    bannerText: "text-rose-900 dark:text-rose-100",
    nodeFill: "bg-rose-500",
    nodeRing: "border-rose-400 dark:border-rose-500",
    nodeRingText: "text-rose-600 dark:text-rose-400",
    nodeTint: "bg-rose-100 dark:bg-rose-900/50",
  },
  {
    banner:
      "from-fuchsia-300 to-fuchsia-200 border-fuchsia-400 dark:from-fuchsia-800/70 dark:to-fuchsia-700/40 dark:border-fuchsia-600",
    bannerText: "text-fuchsia-900 dark:text-fuchsia-100",
    nodeFill: "bg-fuchsia-500",
    nodeRing: "border-fuchsia-400 dark:border-fuchsia-500",
    nodeRingText: "text-fuchsia-600 dark:text-fuchsia-400",
    nodeTint: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
  },
];

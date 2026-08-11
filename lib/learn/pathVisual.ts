// Pure geometry + color helpers for the winding Learning Path trail
// (components/lesson/LearningTrail.tsx). Kept separate from that component
// so the wave math and palette can be unit-reasoned-about without JSX.

import { HUES, type Hue } from "@/lib/design/palette";

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

function tierColor(hue: Hue): TierColor {
  const h = HUES[hue];
  return { banner: h.banner, bannerText: h.bannerText, nodeFill: h.fill, nodeRing: h.ring, nodeRingText: h.ringText, nodeTint: h.tint };
}

// One color per curriculum tier (see lib/learn/pathSections.ts) — a
// deliberately different hue set from the one lib/learn/categoryMeta.ts
// picks for exercise categories, since tiers are a different grouping and
// reusing the same hues would wrongly imply they're the same thing. Both
// draw from the same lib/design/palette.ts source, though, so a hue's
// actual class strings only ever exist in one place.
export const TIER_PALETTE: TierColor[] = (
  ["slate", "cyan", "teal", "amber", "rose", "fuchsia"] satisfies Hue[]
).map(tierColor);

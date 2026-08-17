# Admin Stats Panel Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-section `/admin/stats` page with a 5-tab dashboard (Overview, Growth & Activity, Exercise Practice, Daily EarDle, Learning Platform) covering signup/activity growth, regularity/retention, category and difficulty engagement, Daily EarDle performance, and Learn-feature usage — per `docs/superpowers/specs/2026-08-17-admin-stats-expansion-design.md`.

**Architecture:** A query layer (`lib/db/stats.ts`) computes every stat server-side from existing tables (no new tracking). A small hand-built SVG chart kit (`components/admin/charts/`) — no charting library dependency, matching this codebase's existing pattern of hand-rolled visuals (`Staff.tsx`, `PianoKeyboard.tsx`, `GuessDistributionChart.tsx`) — renders the data. `app/admin/(protected)/stats/page.tsx` becomes a thin server component that runs all queries in parallel and hands pre-rendered tab content to a client-side tab switcher (`StatsTabs`), so the interactive part (which tab is open) stays a small client island instead of forcing the whole page to be a client component.

**Tech Stack:** Next.js 16 App Router (server components + one client island), Drizzle ORM + Postgres (`postgres-js` driver), Tailwind v4 tokens, plain SVG (no charting library — this project has none installed and the `dataviz` skill's own component model is "assembled in plain HTML/SVG").

**No new npm dependency required.**

---

## Chart color tokens (already validated — do not re-derive)

Per the `dataviz` skill's procedure, every categorical order below was run through `scripts/validate_palette.js` against Eardle's actual light (`#ffffff`) and dark (`#4c1d95`, `bg-surface-2` dark) chart surfaces. Both passing orders reuse Eardle's existing `lib/design/palette.ts` hue *names* (so they stay conceptually tied to the app's established hue vocabulary) but at literal hex steps, since SVG needs real color values, not Tailwind classes.

**Category series — order is `scale, chord, interval, progression, note`, NOT the usual `CATEGORY_ORDER` (`note, interval, chord, progression, scale`).** This reordering is required — the natural order fails the CVD/normal-vision adjacency checks (verified: `teal`/`emerald` and `sky`/`teal` are too close when adjacent); this order passes clean. Every chart using these 5 colors must render/legend them in *this* sequence, not category-table order.

| Series (category) | Light hex | Dark hex |
|---|---|---|
| scale | `#10b981` | `#059669` |
| chord | `#f59e0b` | `#d97706` |
| interval | `#14b8a6` | `#0d9488` |
| progression | `#f43f5e` | `#e11d48` |
| note | `#0ea5e9` | `#0284c7` |

**Difficulty series — natural order `easy, medium, hard, jazz` passes as-is** (reuses the `DIFFICULTY_HUE` mapping added in the admin CSS merge: emerald/amber/rose/fuchsia).

| Series (difficulty) | Light hex | Dark hex |
|---|---|---|
| easy | `#10b981` | `#059669` |
| medium | `#f59e0b` | `#d97706` |
| hard | `#f43f5e` | `#e11d48` |
| jazz | `#d946ef` | `#c026d3` |

Both sets carry a CVD WARN (6–8 band) and a contrast WARN on at least one pair/step — per the skill, this is legal *only* with secondary encoding, so **every chart using these colors must always show a visible legend with text labels** (never color-only) — this is enforced structurally by the `Legend` component built in Task 2, not left to each call site to remember.

**Single-series trend accent:** reuse the site's existing indigo accent (`#4f46e5` light / `#818cf8` dark) — a lone series carries no adjacency risk, so no validation needed (per the skill: "a single series needs no legend box — the title names it").

**Status (Daily EarDle won/lost):** reuse the app's existing correct/incorrect convention already used in `ChoiceGrid`/`StatsGrid` (`text-green-600 dark:text-green-400` / `text-red-600 dark:text-red-400`) rather than inventing new status hex — literal hex for the chart: won `#16a34a` / `#4ade80`, lost `#dc2626` / `#f87171`.

---

## File structure

**New files:**
- `lib/db/stats.ts` — every query function for the stats page, grouped by tab
- `components/admin/charts/ChartCard.tsx` — card container: title, description, optional table-view toggle (client)
- `components/admin/charts/Legend.tsx` — static text legend (categorical color + label pairs)
- `components/admin/charts/LineChart.tsx` — multi-series SVG line chart with hover crosshair + tooltip (client)
- `components/admin/charts/BarChart.tsx` — vertical or horizontal bars, single or grouped series (client, for hover tooltip)
- `components/admin/charts/TableView.tsx` — plain `<table>` twin of a chart's series data
- `components/admin/stats/StatsTabs.tsx` — client tab switcher shell (owns `activeTab` state only)
- `components/admin/stats/OverviewTab.tsx`
- `components/admin/stats/GrowthTab.tsx`
- `components/admin/stats/ExercisePracticeTab.tsx`
- `components/admin/stats/DailyEardleTab.tsx`
- `components/admin/stats/LearningPlatformTab.tsx`

**Modified files:**
- `app/admin/(protected)/stats/page.tsx` — rewritten: run all `lib/db/stats.ts` queries via one `Promise.all`, render `<StatsTabs>` with the five tab components as props
- `app/globals.css` — add the chart color tokens above as CSS custom properties + `@theme inline` mappings

**Verification approach (matches this project's actual practice — no test framework is installed):** `npx tsc --noEmit` after every task; direct `docker exec eardle-db-1 psql -U eardle -d eardle -c "..."` spot-checks against real data for every new query before wiring it into UI; the final task is the standard visual/console/a11y checkpoint this project always runs before calling UI work done (screenshot mobile + desktop, both themes; console check; `lighthouse_audit`).

---

### Task 1: Chart color tokens in `globals.css`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the token block**

Add this immediately after the existing `.dark { ... }` block's closing brace (i.e. as a new top-level block, before `@theme inline`):

```css
:root {
  --chart-cat-scale: #10b981;
  --chart-cat-chord: #f59e0b;
  --chart-cat-interval: #14b8a6;
  --chart-cat-progression: #f43f5e;
  --chart-cat-note: #0ea5e9;
  --chart-diff-easy: #10b981;
  --chart-diff-medium: #f59e0b;
  --chart-diff-hard: #f43f5e;
  --chart-diff-jazz: #d946ef;
  --chart-accent: #4f46e5;
  --chart-good: #16a34a;
  --chart-bad: #dc2626;
}

.dark {
  --chart-cat-scale: #059669;
  --chart-cat-chord: #d97706;
  --chart-cat-interval: #0d9488;
  --chart-cat-progression: #e11d48;
  --chart-cat-note: #0284c7;
  --chart-diff-easy: #059669;
  --chart-diff-medium: #d97706;
  --chart-diff-hard: #e11d48;
  --chart-diff-jazz: #c026d3;
  --chart-accent: #818cf8;
  --chart-good: #4ade80;
  --chart-bad: #f87171;
}
```

- [ ] **Step 2: Add to the existing `@theme inline` block**

Inside the existing `@theme inline { ... }` block, add:

```css
  --color-chart-cat-scale: var(--chart-cat-scale);
  --color-chart-cat-chord: var(--chart-cat-chord);
  --color-chart-cat-interval: var(--chart-cat-interval);
  --color-chart-cat-progression: var(--chart-cat-progression);
  --color-chart-cat-note: var(--chart-cat-note);
  --color-chart-diff-easy: var(--chart-diff-easy);
  --color-chart-diff-medium: var(--chart-diff-medium);
  --color-chart-diff-hard: var(--chart-diff-hard);
  --color-chart-diff-jazz: var(--chart-diff-jazz);
  --color-chart-accent: var(--chart-accent);
  --color-chart-good: var(--chart-good);
  --color-chart-bad: var(--chart-bad);
```

This makes both raw `var(--chart-*)` (for SVG `fill`/`stroke`, which the chart components use directly) and Tailwind utilities like `bg-chart-good` (for any non-SVG chrome) available.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (CSS isn't typechecked, but this confirms the step didn't break anything else mid-edit). Expected: `TypeScript: No errors found`.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Add validated chart color tokens for the admin stats expansion"
```

---

### Task 2: Chart primitives

**Files:**
- Create: `components/admin/charts/Legend.tsx`
- Create: `components/admin/charts/TableView.tsx`
- Create: `components/admin/charts/ChartCard.tsx`
- Create: `components/admin/charts/LineChart.tsx`
- Create: `components/admin/charts/BarChart.tsx`

These five are used by every tab built in Tasks 5–9. Build and typecheck them in isolation first.

- [ ] **Step 1: `Legend.tsx`**

```tsx
interface LegendItem {
  label: string;
  color: string; // literal hex, e.g. "var(--chart-cat-note)" or a resolved hex
}

export function Legend({ items }: { items: LegendItem[] }) {
  if (items.length < 2) return null; // a single series is named by the chart title, not a legend
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-text-muted">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: `TableView.tsx`**

The accessibility twin required by the `dataviz` skill for every multi-series chart (single-series trend lines skip this — see Task 2 Step 5's `ChartCard` doc comment for why).

```tsx
interface TableViewColumn {
  key: string;
  label: string;
}

interface TableViewProps {
  columns: TableViewColumn[];
  rows: Record<string, string | number>[];
}

export function TableView({ columns, rows }: TableViewProps) {
  return (
    <div className="overflow-x-auto mt-3 border border-border-subtle rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-2 text-text-subtle">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border-subtle/50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-1.5 text-text-secondary">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: `ChartCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Pass a TableView element when this chart has 2+ series (the skill's
   *  accessibility-twin requirement). A single-series trend line may omit
   *  this — its one value per point is already reachable via the axis and
   *  hover tooltip, and the headline number is shown in a stat card
   *  elsewhere on the same tab, so a second full data table would be pure
   *  duplication for no added reachability. */
  tableView?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({ title, description, tableView, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description && <p className="text-xs text-text-subtle mt-0.5">{description}</p>}
        </div>
        {tableView && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className={clsx(
              "flex-shrink-0 text-xs px-2 py-1 rounded-lg border transition",
              showTable
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-surface text-text-muted border-border-subtle hover:text-text"
            )}
          >
            {showTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {showTable && tableView ? tableView : children}
    </div>
  );
}
```

- [ ] **Step 4: `LineChart.tsx`**

A multi-series SVG line chart with a hover crosshair + tooltip, per the `dataviz` skill's mark spec (2px lines, hairline recessive gridlines, no dashed rules, hit targets bigger than the visual mark).

```tsx
"use client";

import { useState, useMemo } from "react";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  points: { x: number; y: number }[]; // x = unix seconds, y = value
}

interface LineChartProps {
  series: LineSeries[];
  height?: number;
  /** Format an x value (unix seconds) for the axis/tooltip. */
  formatX?: (x: number) => string;
  /** Format a y value for the tooltip. */
  formatY?: (y: number) => string;
}

const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };

function defaultFormatX(x: number) {
  return new Date(x * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LineChart({ series, height = 200, formatX = defaultFormatX, formatY = String }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 600; // viewBox units; the svg scales to its container via CSS width:100%

  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const maxY = Math.max(1, ...allY); // never divide by zero when every series is flat at 0
  const minY = 0; // every metric on this page (counts, rates) has a natural zero floor

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const scaleX = (x: number) => PADDING.left + ((x - minX) / (maxX - minX || 1)) * plotW;
  const scaleY = (y: number) => PADDING.top + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

  // All series share the same x-axis points (each query already returns one
  // row per day in range, zero-filled) — use the longest series to drive the
  // crosshair's snap points.
  const xTicks = useMemo(() => {
    const longest = series.reduce((a, b) => (a.points.length > b.points.length ? a : b), series[0]);
    return longest?.points.map((p) => p.x) ?? [];
  }, [series]);

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let nearestDist = Infinity;
    xTicks.forEach((x, i) => {
      const dist = Math.abs(scaleX(x) - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hoverX = hoverIndex !== null ? xTicks[hoverIndex] : null;

  // Gridlines: 4 horizontal hairlines, evenly spaced, per the skill's
  // "recessive grid" spec — solid, one shade off the surface, never dashed.
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => PADDING.top + plotH * (1 - f));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {gridLines.map((y, i) => (
          <line key={i} x1={PADDING.left} x2={width - PADDING.right} y1={y} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
        ))}

        {series.map((s) => {
          const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x)} ${scaleY(p.y)}`).join(" ");
          return <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />;
        })}

        {hoverX !== null && (
          <line x1={scaleX(hoverX)} x2={scaleX(hoverX)} y1={PADDING.top} y2={height - PADDING.bottom} stroke="var(--text-faint)" strokeWidth={1} />
        )}

        {/* Transparent hit layer, full plot height, so the pointer doesn't have to land on a thin line */}
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hoverX !== null && (
        <div
          className="absolute top-1 pointer-events-none bg-surface border border-border-subtle rounded-lg shadow px-2.5 py-1.5 text-xs"
          style={{ left: `${(scaleX(hoverX) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="text-text-subtle mb-1">{formatX(hoverX)}</p>
          {series.map((s) => {
            const point = s.points[hoverIndex!];
            return (
              <p key={s.key} className="flex items-center gap-1.5 text-text">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}: {point ? formatY(point.y) : "—"}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: `BarChart.tsx`**

Covers single-series distribution bars (streak buckets) and grouped bars (category/difficulty breakdowns), both vertical, per the skill's "thin-bar default" spec with a 2px surface gap between bars.

```tsx
"use client";

import { useState } from "react";

export interface BarGroup {
  label: string; // x-axis category label
  values: { key: string; label: string; color: string; value: number }[];
}

interface BarChartProps {
  groups: BarGroup[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ groups, height = 200, formatValue = String }: BarChartProps) {
  const [hover, setHover] = useState<{ groupIndex: number; barIndex: number } | null>(null);
  const maxValue = Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v.value)));

  return (
    <div className="flex items-end gap-4" style={{ height: height + 24 }}>
      {groups.map((group, gi) => (
        <div key={group.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height }}>
            {group.values.map((bar, bi) => {
              const barHeight = Math.max(2, (bar.value / maxValue) * height);
              const isHovered = hover?.groupIndex === gi && hover?.barIndex === bi;
              return (
                <div
                  key={bar.key}
                  className="relative flex-1 max-w-8 rounded-t-[4px] transition-opacity"
                  style={{ height: barHeight, backgroundColor: bar.color, opacity: isHovered ? 0.8 : 1 }}
                  onPointerEnter={() => setHover({ groupIndex: gi, barIndex: bi })}
                  onPointerLeave={() => setHover(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border-subtle rounded-lg shadow px-2 py-1 text-xs text-text whitespace-nowrap pointer-events-none">
                      {bar.label}: {formatValue(bar.value)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-text-subtle truncate w-full text-center">{group.label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 7: Commit**

```bash
git add components/admin/charts
git commit -m "Add hand-built SVG chart primitives for the admin stats expansion"
```

---

### Task 3: Query layer — `lib/db/stats.ts`

**Files:**
- Create: `lib/db/stats.ts`

Every query the five tabs need, in one file (mirrors `lib/db/lessons.ts`'s existing role as "the query module for one feature area"). Every raw `count(*)`/`count(distinct ...)` is cast `::int` in SQL — **do not omit this cast**: `sessions.userId`/similar aggregate counts returned as unlabelled strings from Postgres is exactly the bug fixed in `lib/db/lessons.ts`'s sibling commit history (the sidebar's concatenated-count bug), so every new aggregate here is cast at the SQL level rather than trusted to `Number()` conversion in JS.

- [ ] **Step 1: Write the file**

```ts
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Blended-actor activity, per the design spec's identity model: an actor is
// userId if signed in, else sessionToken. Unioned across the three tables
// that record real interaction (sessions = exercise practice, daily_attempts
// = Daily EarDle, lesson_progress = Learn). streaks.updatedAt is excluded —
// it mutates in place, so it's not a "this actor did something at time T"
// event log the way the other three are.
const ACTIVITY_CTE = sql`
  activity AS (
    SELECT coalesce(user_id::text, session_token) AS actor, created_at
    FROM sessions
    UNION ALL
    SELECT coalesce(user_id::text, session_token), created_at
    FROM daily_attempts
    UNION ALL
    SELECT coalesce(user_id::text, session_token), coalesce(viewed_at, practiced_at)
    FROM lesson_progress
    WHERE coalesce(viewed_at, practiced_at) IS NOT NULL
  )
`;

function daysAgo(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 86400;
}

// ── Overview + Growth & Activity ────────────────────────────────────────

export interface DailyPoint {
  day: string; // "YYYY-MM-DD"
  value: number;
}

/** Distinct blended actors active per day, last N days (zero-filled for empty days). */
export async function getDailyActiveActors(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH ${ACTIVITY_CTE},
    days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(DISTINCT activity.actor)::int AS value
    FROM days
    LEFT JOIN activity ON to_timestamp(activity.created_at)::date = days.day
    WHERE activity.created_at IS NULL OR activity.created_at >= ${since}
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

/** Signups per day, last N days (zero-filled), from users.createdAt. */
export async function getSignupsOverTime(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(users.id)::int AS value
    FROM days
    LEFT JOIN users ON to_timestamp(users.created_at)::date = days.day
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

export interface ActiveActorCounts {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number; // dau/mau, 0-100, rounded
}

/** DAU (today) / WAU (last 7d) / MAU (last 30d) blended actor counts + stickiness ratio. */
export async function getActiveActorCounts(): Promise<ActiveActorCounts> {
  const [row] = await db.execute<{ dau: number; wau: number; mau: number }>(sql`
    WITH ${ACTIVITY_CTE}
    SELECT
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(1)})::int AS dau,
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(7)})::int AS wau,
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(30)})::int AS mau
    FROM activity
  `) as unknown as { dau: number; wau: number; mau: number }[];
  const dau = row?.dau ?? 0;
  const mau = row?.mau ?? 0;
  return { dau, wau: row?.wau ?? 0, mau, stickiness: mau > 0 ? Math.round((dau / mau) * 100) : 0 };
}

export interface StreakBucket {
  bucket: "0" | "1-2" | "3-6" | "7-13" | "14-29" | "30+";
  count: number;
}

const STREAK_BUCKET_CASE = sql`
  CASE
    WHEN current_streak = 0 THEN '0'
    WHEN current_streak BETWEEN 1 AND 2 THEN '1-2'
    WHEN current_streak BETWEEN 3 AND 6 THEN '3-6'
    WHEN current_streak BETWEEN 7 AND 13 THEN '7-13'
    WHEN current_streak BETWEEN 14 AND 29 THEN '14-29'
    ELSE '30+'
  END
`;
const STREAK_BUCKET_ORDER: StreakBucket["bucket"][] = ["0", "1-2", "3-6", "7-13", "14-29", "30+"];

/** Current-streak-length distribution for one streak kind ("exercise" or "daily"). */
export async function getStreakDistribution(kind: "exercise" | "daily"): Promise<StreakBucket[]> {
  const rows = await db.execute<{ bucket: StreakBucket["bucket"]; count: number }>(sql`
    SELECT ${STREAK_BUCKET_CASE} AS bucket, count(*)::int AS count
    FROM streaks
    WHERE kind = ${kind}
    GROUP BY bucket
  `);
  const byBucket = Object.fromEntries((rows as unknown as StreakBucket[]).map((r) => [r.bucket, r.count]));
  return STREAK_BUCKET_ORDER.map((bucket) => ({ bucket, count: byBucket[bucket] ?? 0 }));
}

export interface SignedUpVsGuest {
  signedUp: number;
  guest: number;
}

/** All-time distinct blended-actor split: how many are a real users.id vs. a guest token. */
export async function getSignedUpVsGuestSplit(): Promise<SignedUpVsGuest> {
  const rows = await db.execute<{ actor_kind: "signed_up" | "guest"; count: number }>(sql`
    WITH raw AS (
      SELECT user_id, session_token FROM sessions
      UNION ALL
      SELECT user_id, session_token FROM daily_attempts
      UNION ALL
      SELECT user_id, session_token FROM lesson_progress
    )
    SELECT
      CASE WHEN user_id IS NOT NULL THEN 'signed_up' ELSE 'guest' END AS actor_kind,
      count(DISTINCT coalesce(user_id::text, session_token))::int AS count
    FROM raw
    GROUP BY actor_kind
  `);
  const byKind = Object.fromEntries((rows as unknown as { actor_kind: string; count: number }[]).map((r) => [r.actor_kind, r.count]));
  return { signedUp: byKind.signed_up ?? 0, guest: byKind.guest ?? 0 };
}

// ── Exercise Practice ────────────────────────────────────────────────────

export interface CategorySeriesPoint {
  day: string;
  note: number;
  interval: number;
  chord: number;
  progression: number;
  scale: number;
}

/** Plays per day per category, last N days (zero-filled). One row per day, one column per category. */
export async function getPlaysOverTimeByCategory(days = 90): Promise<CategorySeriesPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<CategorySeriesPoint>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT
      days.day::text AS day,
      count(*) FILTER (WHERE exercises.category = 'note')::int AS note,
      count(*) FILTER (WHERE exercises.category = 'interval')::int AS interval,
      count(*) FILTER (WHERE exercises.category = 'chord')::int AS chord,
      count(*) FILTER (WHERE exercises.category = 'progression')::int AS progression,
      count(*) FILTER (WHERE exercises.category = 'scale')::int AS scale
    FROM days
    LEFT JOIN sessions ON to_timestamp(sessions.created_at)::date = days.day AND sessions.created_at >= ${since}
    LEFT JOIN exercises ON exercises.id = sessions.exercise_id
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as CategorySeriesPoint[];
}

export interface DifficultyBreakdown {
  difficulty: "easy" | "medium" | "hard" | "jazz";
  plays: number;
  accuracy: number; // 0-100, or -1 meaning "no plays"
}

/** All-time plays + accuracy by difficulty. */
export async function getDifficultyBreakdown(): Promise<DifficultyBreakdown[]> {
  const rows = await db.execute<{ difficulty: DifficultyBreakdown["difficulty"]; plays: number; correct: number }>(sql`
    SELECT exercises.difficulty AS difficulty, count(*)::int AS plays, sum(sessions.correct::int)::int AS correct
    FROM sessions
    JOIN exercises ON exercises.id = sessions.exercise_id
    GROUP BY exercises.difficulty
  `);
  const order: DifficultyBreakdown["difficulty"][] = ["easy", "medium", "hard", "jazz"];
  const byDiff = Object.fromEntries((rows as unknown as { difficulty: string; plays: number; correct: number }[]).map((r) => [r.difficulty, r]));
  return order.map((difficulty) => {
    const row = byDiff[difficulty];
    const plays = row?.plays ?? 0;
    const correct = row?.correct ?? 0;
    return { difficulty, plays, accuracy: plays > 0 ? Math.round((correct / plays) * 100) : -1 };
  });
}

// ── Daily EarDle ─────────────────────────────────────────────────────────

/** Daily EarDle attempts per day, last N days (zero-filled). */
export async function getDailyAttemptsOverTime(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(daily_attempts.id)::int AS value
    FROM days
    LEFT JOIN daily_attempts ON to_timestamp(daily_attempts.created_at)::date = days.day AND daily_attempts.created_at >= ${since}
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

export interface DailyWinStats {
  overallWinRate: number; // 0-100
  avgGuessesToWin: number; // rounded to 1 decimal
  byCategory: { category: string; winRate: number; attempts: number }[];
}

/** Overall + per-category Daily EarDle win rate, and average guesses-to-win. */
export async function getDailyWinStats(): Promise<DailyWinStats> {
  const [overall] = await db.execute<{ won: number; decided: number; avg_guesses: number }>(sql`
    SELECT
      count(*) FILTER (WHERE status = 'won')::int AS won,
      count(*) FILTER (WHERE status IN ('won','lost'))::int AS decided,
      avg(final_guess_count) FILTER (WHERE status = 'won')::numeric(10,1) AS avg_guesses
    FROM daily_attempts
  `) as unknown as { won: number; decided: number; avg_guesses: string | null }[];

  const byCategory = await db.execute<{ category: string; won: number; decided: number }>(sql`
    SELECT category, count(*) FILTER (WHERE status = 'won')::int AS won, count(*) FILTER (WHERE status IN ('won','lost'))::int AS decided
    FROM daily_attempts
    GROUP BY category
  `);

  const decided = overall?.decided ?? 0;
  const won = overall?.won ?? 0;
  return {
    overallWinRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
    avgGuessesToWin: overall?.avg_guesses ? Number(overall.avg_guesses) : 0,
    byCategory: (byCategory as unknown as { category: string; won: number; decided: number }[]).map((r) => ({
      category: r.category,
      winRate: r.decided > 0 ? Math.round((r.won / r.decided) * 100) : 0,
      attempts: r.decided,
    })),
  };
}

// ── Learning Platform ────────────────────────────────────────────────────

export interface LessonEngagementTotals {
  totalLessons: number;
  neverTouched: number;
  viewedOnly: number;
  completed: number; // viewed AND practiced
}

/** Completion funnel across all published lessons: never touched / viewed only / completed. */
export async function getLessonEngagementFunnel(): Promise<LessonEngagementTotals> {
  const [row] = await db.execute<{ total_lessons: number; touched: number; completed: number }>(sql`
    SELECT
      (SELECT count(*)::int FROM lessons WHERE published) AS total_lessons,
      (SELECT count(DISTINCT lesson_id)::int FROM lesson_progress) AS touched,
      (SELECT count(DISTINCT lesson_id)::int FROM lesson_progress WHERE viewed_at IS NOT NULL AND practiced_at IS NOT NULL) AS completed
  `) as unknown as { total_lessons: number; touched: number; completed: number }[];

  const totalLessons = row?.total_lessons ?? 0;
  const touched = row?.touched ?? 0;
  const completed = row?.completed ?? 0;
  return { totalLessons, neverTouched: Math.max(0, totalLessons - touched), viewedOnly: Math.max(0, touched - completed), completed };
}

export interface TopicEngagement {
  topicTitle: string;
  views: number;
  completions: number;
}

/** Per-topic lesson views + completions (distinct actor-lesson pairs), all published topics. */
export async function getTopicEngagement(): Promise<TopicEngagement[]> {
  const rows = await db.execute<{ topic_title: string; views: number; completions: number }>(sql`
    SELECT
      topics.title AS topic_title,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL)::int AS views,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL AND lesson_progress.practiced_at IS NOT NULL)::int AS completions
    FROM topics
    JOIN lessons ON lessons.topic_id = topics.id AND lessons.published
    LEFT JOIN lesson_progress ON lesson_progress.lesson_id = lessons.id
    GROUP BY topics.id, topics.title
    ORDER BY topics.sort_order
  `);
  return rows as unknown as TopicEngagement[];
}

export interface LessonEngagementRow {
  lessonId: number;
  title: string;
  topicTitle: string;
  views: number;
  completions: number;
}

/** Top 10 most-engaged lessons by view count (ties broken by completions). */
export async function getTopLessons(limit = 10): Promise<LessonEngagementRow[]> {
  const rows = await db.execute<{ lesson_id: number; title: string; topic_title: string; views: number; completions: number }>(sql`
    SELECT
      lessons.id AS lesson_id,
      lessons.title AS title,
      topics.title AS topic_title,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL)::int AS views,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL AND lesson_progress.practiced_at IS NOT NULL)::int AS completions
    FROM lessons
    JOIN topics ON topics.id = lessons.topic_id
    LEFT JOIN lesson_progress ON lesson_progress.lesson_id = lessons.id
    WHERE lessons.published
    GROUP BY lessons.id, lessons.title, topics.title
    ORDER BY views DESC, completions DESC
    LIMIT ${limit}
  `);
  return (rows as unknown as { lesson_id: number; title: string; topic_title: string; views: number; completions: number }[]).map((r) => ({
    lessonId: r.lesson_id,
    title: r.title,
    topicTitle: r.topic_title,
    views: r.views,
    completions: r.completions,
  }));
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 3: Spot-check every query against real data**

Local Postgres runs via Docker (`eardle-db-1`). For each function above, run the equivalent raw query directly and sanity-check the shape and values look right before trusting it in UI — this project has no test suite, so this manual spot-check is the actual verification step (matching how the rest of this codebase's stats queries have always been verified). Example for `getActiveActorCounts`:

```bash
docker exec eardle-db-1 psql -U eardle -d eardle -c "
WITH activity AS (
  SELECT coalesce(user_id::text, session_token) AS actor, created_at FROM sessions
  UNION ALL
  SELECT coalesce(user_id::text, session_token), created_at FROM daily_attempts
  UNION ALL
  SELECT coalesce(user_id::text, session_token), coalesce(viewed_at, practiced_at) FROM lesson_progress WHERE coalesce(viewed_at, practiced_at) IS NOT NULL
)
SELECT
  count(DISTINCT actor) FILTER (WHERE created_at >= extract(epoch from now() - interval '1 day'))::int AS dau,
  count(DISTINCT actor) FILTER (WHERE created_at >= extract(epoch from now() - interval '7 day'))::int AS wau,
  count(DISTINCT actor) FILTER (WHERE created_at >= extract(epoch from now() - interval '30 day'))::int AS mau
FROM activity;
"
```

Repeat the same pattern (paste the query body, substitute `now() - interval 'N day'` for the JS `daysAgo()` calls) for every function in the file. Confirm: no query errors, no obviously-wrong values (e.g. a percentage over 100, a negative count), and that `db.execute()`'s return shape in the actual dev server matches what the code assumes — add a temporary `console.log(JSON.stringify(rows))` in one function, hit its call site once via the dev server, confirm the array is the rows directly (not wrapped in a `.rows` property, which is how `postgres-js` behaves in Drizzle — this project already uses this driver, so this should hold, but confirm rather than assume), then remove the log.

- [ ] **Step 4: Commit**

```bash
git add lib/db/stats.ts
git commit -m "Add query layer for the admin stats expansion"
```

---

### Task 4: Tab shell + page rewiring

**Files:**
- Create: `components/admin/stats/StatsTabs.tsx`
- Modify: `app/admin/(protected)/stats/page.tsx`

This task wires the shell only — the five tab *content* components are still empty placeholders returning `null`, filled in by Tasks 5–9. This keeps each task independently testable (the page renders and the tab-switcher works before any chart exists).

- [ ] **Step 1: `StatsTabs.tsx`**

```tsx
"use client";

import { useState } from "react";
import clsx from "clsx";

const TABS = ["Overview", "Growth & Activity", "Exercise Practice", "Daily EarDle", "Learning Platform"] as const;
type Tab = (typeof TABS)[number];

interface StatsTabsProps {
  overview: React.ReactNode;
  growth: React.ReactNode;
  exercisePractice: React.ReactNode;
  dailyEardle: React.ReactNode;
  learningPlatform: React.ReactNode;
}

export function StatsTabs({ overview, growth, exercisePractice, dailyEardle, learningPlatform }: StatsTabsProps) {
  const [active, setActive] = useState<Tab>("Overview");
  const content: Record<Tab, React.ReactNode> = {
    Overview: overview,
    "Growth & Activity": growth,
    "Exercise Practice": exercisePractice,
    "Daily EarDle": dailyEardle,
    "Learning Platform": learningPlatform,
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border-subtle mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition",
              active === tab
                ? "border-indigo-600 text-text"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
```

- [ ] **Step 2: Empty placeholder tab components**

Create each of these five files with the same trivial shape (Tasks 5–9 replace the body):

`components/admin/stats/OverviewTab.tsx`:
```tsx
export function OverviewTab() {
  return <p className="text-text-faint text-sm">Coming in Task 5.</p>;
}
```

Repeat identically for `GrowthTab.tsx` (export `GrowthTab`), `ExercisePracticeTab.tsx` (export `ExercisePracticeTab`), `DailyEardleTab.tsx` (export `DailyEardleTab`), `LearningPlatformTab.tsx` (export `LearningPlatformTab`) — each with its task number in the placeholder text (6, 7, 8, 9 respectively).

- [ ] **Step 3: Rewrite `app/admin/(protected)/stats/page.tsx`**

```tsx
import { StatsTabs } from "@/components/admin/stats/StatsTabs";
import { OverviewTab } from "@/components/admin/stats/OverviewTab";
import { GrowthTab } from "@/components/admin/stats/GrowthTab";
import { ExercisePracticeTab } from "@/components/admin/stats/ExercisePracticeTab";
import { DailyEardleTab } from "@/components/admin/stats/DailyEardleTab";
import { LearningPlatformTab } from "@/components/admin/stats/LearningPlatformTab";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-bold text-text mb-6">Usage Stats</h1>
      <StatsTabs
        overview={<OverviewTab />}
        growth={<GrowthTab />}
        exercisePractice={<ExercisePracticeTab />}
        dailyEardle={<DailyEardleTab />}
        learningPlatform={<LearningPlatformTab />}
      />
    </div>
  );
}
```

(Each tab component becomes `async` and does its own data-fetching once Tasks 5–9 fill it in — kept as plain server components rendered *inside* the client `StatsTabs` shell via the children-as-props pattern, so only the tab-switching interaction is client-side, not the data fetching.)

- [ ] **Step 4: Typecheck and manually verify the shell**

Run: `npx tsc --noEmit` — expect no errors.
Start the dev server (`npm run dev`), log in as admin, visit `/admin/stats`, click through all five tabs. Expected: each tab shows its "Coming in Task N" placeholder, switching is instant, no console errors.

- [ ] **Step 5: Commit**

```bash
git add components/admin/stats app/admin/\(protected\)/stats/page.tsx
git commit -m "Add tab shell for the expanded admin stats page"
```

---

### Task 5: Overview tab

**Files:**
- Modify: `components/admin/stats/OverviewTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import {
  getDailyActiveActors,
  getActiveActorCounts,
} from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
    </div>
  );
}

export async function OverviewTab() {
  const [
    [totalRow],
    [todayRow],
    [signedUpRow],
    [accuracyRow],
    dailyActives,
    activeCounts,
  ] = await Promise.all([
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM sessions`),
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM sessions WHERE created_at >= ${Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 86400)}`),
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM users`),
    db.execute<{ total: number; correct: number }>(sql`SELECT count(*)::int AS total, sum(correct::int)::int AS correct FROM sessions`),
    getDailyActiveActors(90),
    getActiveActorCounts(),
  ]) as unknown as [
    { count: number }[],
    { count: number }[],
    { count: number }[],
    { total: number; correct: number }[],
    Awaited<ReturnType<typeof getDailyActiveActors>>,
    Awaited<ReturnType<typeof getActiveActorCounts>>,
  ];

  const totalPlays = totalRow?.count ?? 0;
  const todayPlays = todayRow?.count ?? 0;
  const signedUpUsers = signedUpRow?.count ?? 0;
  const overallAccuracy = accuracyRow?.total ? Math.round(((accuracyRow.correct ?? 0) / accuracyRow.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Plays" value={totalPlays.toLocaleString()} />
        <StatCard label="Plays Today" value={todayPlays.toLocaleString()} />
        <StatCard label="Signed-Up Users" value={signedUpUsers.toLocaleString()} />
        <StatCard label="Active Today" value={activeCounts.dau.toLocaleString()} />
        <StatCard label="Overall Accuracy" value={totalPlays > 0 ? `${overallAccuracy}%` : "—"} />
        <StatCard label="Stickiness" value={`${activeCounts.stickiness}%`} sub="DAU / MAU" />
      </div>

      <ChartCard title="Daily Active Users" description="Blended signed-up + guest actors, last 90 days">
        <LineChart
          series={[{ key: "dau", label: "Active users", color: "var(--chart-accent)", points: dailyActives.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]}
        />
      </ChartCard>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Visual check**

Dev server running, visit `/admin/stats`, Overview tab. Expected: six stat cards with real numbers, one line chart below with a visible trend line and working hover tooltip.

- [ ] **Step 4: Commit**

```bash
git add components/admin/stats/OverviewTab.tsx
git commit -m "Implement the admin stats Overview tab"
```

---

### Task 6: Growth & Activity tab

**Files:**
- Modify: `components/admin/stats/GrowthTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import {
  getSignupsOverTime,
  getDailyActiveActors,
  getActiveActorCounts,
  getStreakDistribution,
  getSignedUpVsGuestSplit,
} from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

export async function GrowthTab() {
  const [signups, dailyActives, activeCounts, exerciseStreaks, signedUpVsGuest] = await Promise.all([
    getSignupsOverTime(90),
    getDailyActiveActors(90),
    getActiveActorCounts(),
    getStreakDistribution("exercise"),
    getSignedUpVsGuestSplit(),
  ]);

  return (
    <div className="space-y-6">
      <ChartCard title="Signups Over Time" description="New accounts per day, last 90 days">
        <LineChart series={[{ key: "signups", label: "Signups", color: "var(--chart-accent)", points: signups.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <ChartCard title="Daily Active Users" description="Blended signed-up + guest actors, last 90 days">
        <LineChart series={[{ key: "dau", label: "Active users", color: "var(--chart-accent)", points: dailyActives.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Activity</h3>
          <QuickStat label="Daily Active Users" value={activeCounts.dau.toLocaleString()} />
          <QuickStat label="Weekly Active Users" value={activeCounts.wau.toLocaleString()} />
          <QuickStat label="Monthly Active Users" value={activeCounts.mau.toLocaleString()} />
          <QuickStat label="Stickiness (DAU/MAU)" value={`${activeCounts.stickiness}%`} />
        </div>
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Signed-Up vs. Guest</h3>
          <QuickStat label="Signed-Up Actors (all-time)" value={signedUpVsGuest.signedUp.toLocaleString()} />
          <QuickStat label="Guest Actors (all-time)" value={signedUpVsGuest.guest.toLocaleString()} />
        </div>
      </div>

      <ChartCard
        title="Exercise Streak Distribution"
        description="How many actors currently have each streak length"
        tableView={
          <TableView
            columns={[{ key: "bucket", label: "Streak length" }, { key: "count", label: "Actors" }]}
            rows={exerciseStreaks.map((b) => ({ bucket: `${b.bucket} days`, count: b.count }))}
          />
        }
      >
        <BarChart
          groups={exerciseStreaks.map((b) => ({
            label: `${b.bucket}d`,
            values: [{ key: b.bucket, label: `${b.bucket} days`, color: "var(--chart-accent)", value: b.count }],
          }))}
        />
      </ChartCard>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Visual check**

Growth & Activity tab: two line charts, two stat panels, one bar chart with a working table-view toggle.

- [ ] **Step 4: Commit**

```bash
git add components/admin/stats/GrowthTab.tsx
git commit -m "Implement the admin stats Growth & Activity tab"
```

---

### Task 7: Exercise Practice tab

**Files:**
- Modify: `components/admin/stats/ExercisePracticeTab.tsx`

Reuses the current page's existing by-category table and top-10 table (carried over from the old `stats/page.tsx`, unchanged in query logic — only moved), plus the two new charts from the spec.

- [ ] **Step 1: Implement**

```tsx
import { db } from "@/lib/db";
import { sessions, exercises } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { CATEGORY_META } from "@/types/exercise";
import type { Category } from "@/types/exercise";
import { getPlaysOverTimeByCategory, getDifficultyBreakdown } from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart, type LineSeries } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";
import { Legend } from "@/components/admin/charts/Legend";

const CATEGORY_ORDER: Category[] = ["note", "interval", "chord", "progression", "scale"];
// Chart draw order is NOT CATEGORY_ORDER — see the plan's "Chart color tokens"
// section for why (this is the validated CVD-safe adjacency order).
const CATEGORY_CHART_ORDER: Category[] = ["scale", "chord", "interval", "progression", "note"];
const CATEGORY_CHART_COLOR: Record<Category, string> = {
  scale: "var(--chart-cat-scale)",
  chord: "var(--chart-cat-chord)",
  interval: "var(--chart-cat-interval)",
  progression: "var(--chart-cat-progression)",
  note: "var(--chart-cat-note)",
};

export async function ExercisePracticeTab() {
  const [categoryRows, topExercises, playsOverTime, difficultyBreakdown] = await Promise.all([
    db
      .select({ category: exercises.category, plays: sql<number>`count(*)::int`, correct: sql<number>`sum(${sessions.correct}::int)::int` })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.category),
    db
      .select({ id: exercises.id, title: exercises.title, category: exercises.category, plays: sql<number>`count(*)::int`, correct: sql<number>`sum(${sessions.correct}::int)::int` })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.id, exercises.title, exercises.category)
      .orderBy(sql`count(*) desc`)
      .limit(10),
    getPlaysOverTimeByCategory(90),
    getDifficultyBreakdown(),
  ]);

  const catMap = Object.fromEntries(categoryRows.map((r) => [r.category, r]));

  const categoryLines: LineSeries[] = CATEGORY_CHART_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_META[cat].label,
    color: CATEGORY_CHART_COLOR[cat],
    points: playsOverTime.map((p) => ({ x: Date.parse(p.day) / 1000, y: p[cat] })),
  }));

  return (
    <div className="space-y-6">
      <ChartCard
        title="Plays Over Time by Category"
        description="Last 90 days"
        tableView={
          <TableView
            columns={[{ key: "day", label: "Day" }, ...CATEGORY_CHART_ORDER.map((c) => ({ key: c, label: CATEGORY_META[c].label }))]}
            rows={playsOverTime}
          />
        }
      >
        <LineChart series={categoryLines} />
        <Legend items={categoryLines.map((s) => ({ label: s.label, color: s.color }))} />
      </ChartCard>

      <ChartCard
        title="Difficulty Breakdown"
        description="All-time plays and accuracy by difficulty"
        tableView={
          <TableView
            columns={[{ key: "difficulty", label: "Difficulty" }, { key: "plays", label: "Plays" }, { key: "accuracy", label: "Accuracy" }]}
            rows={difficultyBreakdown.map((d) => ({ difficulty: d.difficulty, plays: d.plays, accuracy: d.accuracy >= 0 ? `${d.accuracy}%` : "—" }))}
          />
        }
      >
        <BarChart
          groups={difficultyBreakdown.map((d) => ({
            label: d.difficulty,
            values: [{ key: d.difficulty, label: d.difficulty, color: `var(--chart-diff-${d.difficulty})`, value: d.plays }],
          }))}
        />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">By Category</h2>
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-text-subtle">
                <th className="text-left pb-2">Category</th>
                <th className="text-right pb-2">Plays</th>
                <th className="text-right pb-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((cat) => {
                const row = catMap[cat];
                const plays = row ? Number(row.plays) : 0;
                const correct = row ? Number(row.correct ?? 0) : 0;
                const acc = plays > 0 ? Math.round((correct / plays) * 100) : 0;
                const meta = CATEGORY_META[cat];
                return (
                  <tr key={cat} className="border-t border-border-subtle/60">
                    <td className="py-2 text-xs text-text-secondary">{meta.emoji} {meta.label}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays > 0 ? `${acc}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top 10 Most Played</h2>
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-text-subtle">
                <th className="text-left pb-2 w-6">#</th>
                <th className="text-left pb-2">Exercise</th>
                <th className="text-right pb-2">Plays</th>
              </tr>
            </thead>
            <tbody>
              {topExercises.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-xs text-text-faint">No exercise plays recorded yet</td></tr>
              ) : (
                topExercises.map((ex, i) => (
                  <tr key={ex.id} className="border-t border-border-subtle/60">
                    <td className="py-2 text-xs text-text-faint">{i + 1}</td>
                    <td className="py-2 text-xs text-text-secondary">{ex.title}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{Number(ex.plays).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Visual check**

Exercise Practice tab: category trend chart with legend showing scale/chord/interval/progression/note (in that order, not CATEGORY_ORDER), difficulty bar chart, both existing tables carried over correctly.

- [ ] **Step 4: Commit**

```bash
git add components/admin/stats/ExercisePracticeTab.tsx
git commit -m "Implement the admin stats Exercise Practice tab"
```

---

### Task 8: Daily EarDle tab

**Files:**
- Modify: `components/admin/stats/DailyEardleTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import { getDailyAttemptsOverTime, getDailyWinStats, getStreakDistribution } from "@/lib/db/stats";
import { CATEGORY_META } from "@/types/exercise";
import type { Category } from "@/types/exercise";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

export async function DailyEardleTab() {
  const [attemptsOverTime, winStats, dailyStreaks] = await Promise.all([
    getDailyAttemptsOverTime(90),
    getDailyWinStats(),
    getStreakDistribution("daily"),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Overall Win Rate" value={`${winStats.overallWinRate}%`} />
        <StatCard label="Avg. Guesses to Win" value={winStats.avgGuessesToWin.toFixed(1)} />
        <StatCard label="Total Attempts" value={winStats.byCategory.reduce((s, c) => s + c.attempts, 0).toLocaleString()} />
      </div>

      <ChartCard title="Daily EarDle Attempts" description="Last 90 days">
        <LineChart series={[{ key: "attempts", label: "Attempts", color: "var(--chart-accent)", points: attemptsOverTime.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <ChartCard
        title="Win Rate by Category"
        tableView={
          <TableView
            columns={[{ key: "category", label: "Category" }, { key: "winRate", label: "Win rate" }, { key: "attempts", label: "Attempts" }]}
            rows={winStats.byCategory.map((c) => ({ category: CATEGORY_META[c.category as Category]?.label ?? c.category, winRate: `${c.winRate}%`, attempts: c.attempts }))}
          />
        }
      >
        <BarChart
          groups={winStats.byCategory.map((c) => ({
            label: CATEGORY_META[c.category as Category]?.label ?? c.category,
            values: [{ key: c.category, label: "Win rate", color: "var(--chart-good)", value: c.winRate }],
          }))}
          formatValue={(v) => `${v}%`}
        />
      </ChartCard>

      <ChartCard
        title="Daily EarDle Streak Distribution"
        tableView={
          <TableView
            columns={[{ key: "bucket", label: "Streak length" }, { key: "count", label: "Actors" }]}
            rows={dailyStreaks.map((b) => ({ bucket: `${b.bucket} days`, count: b.count }))}
          />
        }
      >
        <BarChart
          groups={dailyStreaks.map((b) => ({
            label: `${b.bucket}d`,
            values: [{ key: b.bucket, label: `${b.bucket} days`, color: "var(--chart-accent)", value: b.count }],
          }))}
        />
      </ChartCard>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Visual check**

Daily EarDle tab: three stat cards, attempts trend line, win-rate-by-category bars, streak distribution bars.

- [ ] **Step 4: Commit**

```bash
git add components/admin/stats/DailyEardleTab.tsx
git commit -m "Implement the admin stats Daily EarDle tab"
```

---

### Task 9: Learning Platform tab

**Files:**
- Modify: `components/admin/stats/LearningPlatformTab.tsx`

Per the design spec's open item: the plan resolves it here — build the funnel + per-topic + top-lessons views (all well-supported by the data regardless of date spread), and skip a dedicated lessons-over-time *trend chart* specifically, since Task 3's data check found `lesson_progress` currently spans about 3 weeks locally — too short a window for a 90-day trend line to say anything useful yet, and the funnel/topic/top-lessons views already answer "how much is Learn being used" without needing that chart. This can be added later once there's enough history for it to be worth a chart of its own.

- [ ] **Step 1: Implement**

```tsx
import { getLessonEngagementFunnel, getTopicEngagement, getTopLessons } from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

export async function LearningPlatformTab() {
  const [funnel, topicEngagement, topLessons] = await Promise.all([
    getLessonEngagementFunnel(),
    getTopicEngagement(),
    getTopLessons(10),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Published Lessons" value={funnel.totalLessons.toLocaleString()} />
        <StatCard label="Viewed (not completed)" value={funnel.viewedOnly.toLocaleString()} />
        <StatCard label="Completed" value={funnel.completed.toLocaleString()} />
      </div>

      <ChartCard
        title="Completion Funnel"
        description="Never touched → viewed only → viewed & practiced"
        tableView={
          <TableView
            columns={[{ key: "stage", label: "Stage" }, { key: "lessons", label: "Lessons" }]}
            rows={[
              { stage: "Never touched", lessons: funnel.neverTouched },
              { stage: "Viewed only", lessons: funnel.viewedOnly },
              { stage: "Completed", lessons: funnel.completed },
            ]}
          />
        }
      >
        <BarChart
          groups={[
            { label: "Never touched", values: [{ key: "never", label: "Never touched", color: "var(--border-subtle)", value: funnel.neverTouched }] },
            { label: "Viewed only", values: [{ key: "viewed", label: "Viewed only", color: "var(--chart-diff-medium)", value: funnel.viewedOnly }] },
            { label: "Completed", values: [{ key: "completed", label: "Completed", color: "var(--chart-good)", value: funnel.completed }] },
          ]}
        />
      </ChartCard>

      <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">By Topic</h2>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-text-subtle">
              <th className="text-left pb-2">Topic</th>
              <th className="text-right pb-2">Views</th>
              <th className="text-right pb-2">Completions</th>
            </tr>
          </thead>
          <tbody>
            {topicEngagement.map((t) => (
              <tr key={t.topicTitle} className="border-t border-border-subtle/60">
                <td className="py-2 text-xs text-text-secondary">{t.topicTitle}</td>
                <td className="py-2 text-right text-xs text-text-muted">{t.views.toLocaleString()}</td>
                <td className="py-2 text-right text-xs text-text-muted">{t.completions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top 10 Most Engaged Lessons</h2>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-text-subtle">
              <th className="text-left pb-2 w-6">#</th>
              <th className="text-left pb-2">Lesson</th>
              <th className="text-left pb-2 hidden sm:table-cell">Topic</th>
              <th className="text-right pb-2">Views</th>
              <th className="text-right pb-2">Completions</th>
            </tr>
          </thead>
          <tbody>
            {topLessons.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-text-faint">No lesson activity recorded yet</td></tr>
            ) : (
              topLessons.map((lesson, i) => (
                <tr key={lesson.lessonId} className="border-t border-border-subtle/60">
                  <td className="py-2 text-xs text-text-faint">{i + 1}</td>
                  <td className="py-2 text-xs text-text-secondary">{lesson.title}</td>
                  <td className="py-2 text-xs text-text-muted hidden sm:table-cell">{lesson.topicTitle}</td>
                  <td className="py-2 text-right text-xs text-text-muted">{lesson.views.toLocaleString()}</td>
                  <td className="py-2 text-right text-xs text-text-muted">{lesson.completions.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 3: Visual check**

Learning Platform tab: three stat cards, funnel bar chart, by-topic table, top-10-lessons table.

- [ ] **Step 4: Commit**

```bash
git add components/admin/stats/LearningPlatformTab.tsx
git commit -m "Implement the admin stats Learning Platform tab"
```

---

### Task 10: Finishing checkpoint

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck and build**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run build` — expect success, no new warnings beyond the pre-existing "middleware" deprecation notice.

- [ ] **Step 2: Console check**

With the dev server running and logged in as admin, visit `/admin/stats`, click through all five tabs, hover every chart at least once (to exercise the tooltip code paths), toggle every table-view button. Read the browser console for errors or React hydration warnings. Fix any before continuing.

- [ ] **Step 3: Visual checkpoint — desktop and mobile, light and dark**

Per this project's standing rule (see `docs/superpowers/plans/2026-08-17-admin-public-css-merge.md` for the exact pattern that caught real bugs last time): screenshot `/admin/stats` at desktop width and at mobile width (~390px), in both light and dark mode (toggle via the navbar moon/sun icon) — 4 screenshots per tab minimum for the Overview and one other data-heavy tab (Exercise Practice), spot-checks for the rest. Look specifically for: chart text/legend contrast against `bg-surface-2` cards in both themes, bar/line colors readable against gridlines, tooltip positioning not clipped at card edges, mobile layout not overflowing (the `BarChart`/`LineChart` components use `viewBox` scaling, but the surrounding grid layouts — e.g. the 6-card Overview stat grid — need a real narrow-viewport check). Fix anything found before calling this done, the same way the CSS merge task did.

- [ ] **Step 4: Accessibility audit**

Using `chrome-devtools-mcp`'s `lighthouse_audit` (`mode: snapshot`, `device: desktop`) on `/admin/stats` while logged in as admin. Fix any FAIL findings the same way the CSS merge task did (that pass caught and fixed a systemic color-pairing mistake and a double-dimmed opacity bug — check this page's new chart color usage particularly carefully, since it's new code the same class of mistake could recur in).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "Finish admin stats expansion: checkpoint fixes"
```

(Only if Steps 2–4 found anything to fix — if the checkpoint was clean, there's nothing to commit here.)

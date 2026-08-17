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
  /** Set when this chart is rendered alongside a ChartCard `tableView` twin —
   *  hides the SVG from assistive tech so screen readers land on the
   *  accessible table instead of this redundant visual layer. Not wired up
   *  by any caller yet; later tab-implementation tasks will pass it. */
  hasTableTwin?: boolean;
}

const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };

function defaultFormatX(x: number) {
  return new Date(x * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LineChart({ series, height = 200, formatX = defaultFormatX, formatY = String, hasTableTwin = false }: LineChartProps) {
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

  function handleFocus() {
    setHoverIndex(0);
  }

  function handleBlur() {
    setHoverIndex(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGRectElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setHoverIndex((current) => {
      const base = current ?? 0;
      const next = e.key === "ArrowLeft" ? base - 1 : base + 1;
      return Math.min(Math.max(next, 0), xTicks.length - 1);
    });
  }

  const hoverX = hoverIndex !== null ? xTicks[hoverIndex] : null;

  // Gridlines: 4 horizontal hairlines, evenly spaced, per the skill's
  // "recessive grid" spec — solid, one shade off the surface, never dashed.
  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => PADDING.top + plotH * (1 - f));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} aria-hidden={hasTableTwin ? "true" : undefined}>
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
          tabIndex={0}
          role="slider"
          aria-label="Chart data — use arrow keys to explore"
          aria-valuemin={0}
          aria-valuemax={xTicks.length - 1}
          aria-valuenow={hoverIndex ?? 0}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
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

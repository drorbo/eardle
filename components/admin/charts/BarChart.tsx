"use client";

import { useState } from "react";

export interface BarGroup {
  label: string; // x-axis category label
  values: { key: string; label: string; color: string; value: number }[];
}

interface BarChartProps {
  groups: BarGroup[];
  height?: number;
  /** Escape hatch for a genuinely custom formatter. Prefer `format` below —
   *  a plain string literal is safe for a server component to pass across
   *  the RSC boundary, whereas a function prop like this one is not (Next.js
   *  rejects functions passed from a Server Component into a "use client"
   *  component at runtime). */
  formatValue?: (v: number) => string;
  /** Which built-in formatter to derive when `formatValue` isn't given. */
  format?: "number" | "percent";
  /** Set when this chart is rendered alongside a ChartCard `tableView` twin —
   *  hides the bars from assistive tech so screen readers land on the
   *  accessible table instead of this redundant visual layer. Not wired up
   *  by any caller yet; later tab-implementation tasks will pass it. */
  hasTableTwin?: boolean;
}

export function BarChart({ groups, height = 200, formatValue, format = "number", hasTableTwin = false }: BarChartProps) {
  const [hover, setHover] = useState<{ groupIndex: number; barIndex: number } | null>(null);
  const resolvedFormatValue = formatValue ?? (format === "percent" ? (v: number) => `${v}%` : String);
  // never divide by zero when every value is 0; assumes non-negative values
  // (every metric on this page — counts, rates — has a natural zero floor)
  const maxValue = Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v.value)));

  return (
    <div className="flex items-end gap-4" style={{ height: height + 24 }} aria-hidden={hasTableTwin ? "true" : undefined}>
      {groups.map((group, gi) => (
        <div key={group.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height }}>
            {group.values.map((bar, bi) => {
              // floor of 2px so a zero/near-zero bar stays visible and hoverable
              const barHeight = Math.max(2, (bar.value / maxValue) * height);
              const isHovered = hover?.groupIndex === gi && hover?.barIndex === bi;
              return (
                <div
                  key={bar.key}
                  className="relative flex-1 max-w-8 rounded-t-[4px] transition-opacity"
                  style={{ height: barHeight, backgroundColor: bar.color, opacity: isHovered ? 0.8 : 1 }}
                  tabIndex={0}
                  role="img"
                  aria-label={`${bar.label}: ${resolvedFormatValue(bar.value)}`}
                  onPointerEnter={() => setHover({ groupIndex: gi, barIndex: bi })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ groupIndex: gi, barIndex: bi })}
                  onBlur={() => setHover(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface border border-border-subtle rounded-lg shadow px-2 py-1 text-xs text-text whitespace-nowrap pointer-events-none">
                      {bar.label}: {resolvedFormatValue(bar.value)}
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

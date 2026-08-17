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

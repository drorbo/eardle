interface Row {
  label: string;
  value: number;
  highlight?: boolean;
}

interface Props {
  rows: Row[];
  showAsPercent?: boolean;
}

export function GuessDistributionChart({ rows, showAsPercent }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-1.5 w-full">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm">
          <span className="w-6 text-text-muted shrink-0 font-mono">{r.label}</span>
          <div className="flex-1 bg-surface-2 rounded h-5 overflow-hidden">
            <div
              className={`h-full rounded flex items-center justify-end px-1.5 text-[11px] font-semibold text-white transition-all duration-500 ${
                r.highlight ? "bg-indigo-500" : "bg-gray-500"
              }`}
              style={{ width: `${r.value > 0 ? Math.max(6, Math.round((r.value / max) * 100)) : 0}%` }}
            >
              {r.value > 0 && (showAsPercent ? `${r.value}%` : r.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

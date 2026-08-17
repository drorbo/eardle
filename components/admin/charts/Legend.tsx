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

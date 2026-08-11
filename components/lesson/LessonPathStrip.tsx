import Link from "next/link";

/** Compact "where am I in the path" indicator shown near the top of every
 *  lesson page — position is purely about reading order (n of total), not
 *  per-user completion, so this stays a plain server component. */
export function LessonPathStrip({ n, total, section }: { n: number; total: number; section: string }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <Link href="/learn" className="block mb-6 group">
      <div className="flex items-center justify-between gap-3 text-xs text-text-subtle mb-1.5">
        <span className="group-hover:text-text-secondary transition truncate">
          Lesson {n} of {total} · {section}
        </span>
        <span className="text-text-faint group-hover:text-text-subtle transition whitespace-nowrap">
          View path →
        </span>
      </div>
      <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

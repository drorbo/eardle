import type { LessonStatus } from "@/hooks/useLessonProgress";

export function StatusDot({ status }: { status?: LessonStatus }) {
  if (status?.completed) return <span className="text-green-500">✓</span>;
  if (status?.viewed || status?.practiced) return <span className="text-amber-500">●</span>;
  return <span className="text-text-faint">○</span>;
}

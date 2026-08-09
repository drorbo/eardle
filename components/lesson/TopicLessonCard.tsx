import Link from "next/link";
import { StatusDot } from "@/components/lesson/StatusDot";
import type { LessonStatus } from "@/hooks/useLessonProgress";
import type { LessonSummary } from "@/types/lesson";

interface Props {
  lesson: LessonSummary;
  status?: LessonStatus;
}

export function TopicLessonCard({ lesson, status }: Props) {
  return (
    <Link
      href={`/learn/${lesson.topicSlug}/${lesson.slug}`}
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-text truncate">{lesson.title}</span>
      </span>
      <span className="text-text-faint text-sm flex-shrink-0">→</span>
    </Link>
  );
}

import Link from "next/link";
import { StatusDot } from "@/components/lesson/StatusDot";
import type { LessonStatus } from "@/hooks/useLessonProgress";
import type { LessonSummary } from "@/types/lesson";

interface Props {
  lesson: LessonSummary;
  status?: LessonStatus;
  description?: string | null;
}

export function TopicLessonCard({ lesson, status, description }: Props) {
  return (
    <Link
      href={`/learn/${lesson.topicSlug}/${lesson.slug}`}
      className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition hover:scale-[1.01] active:scale-[0.99]"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={status} />
          <span className="text-sm font-medium text-text truncate">{lesson.title}</span>
        </span>
        <span className="text-text-faint text-sm flex-shrink-0">→</span>
      </span>
      {description && (
        <span className="text-xs text-text-muted leading-snug line-clamp-2">{description}</span>
      )}
    </Link>
  );
}

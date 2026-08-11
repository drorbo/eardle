"use client";

import { useState } from "react";
import Link from "next/link";
import { MarkLessonFinishedButton } from "@/components/lesson/MarkLessonFinishedButton";

interface Props {
  href: string;
  topicTitle: string;
  lessonTitle: string;
  lessonId: number;
}

/** The "you got here via a lesson" indicator on the exercise page. Starts
 *  collapsed to a single compact row — the full card (topic name + Mark as
 *  finished) ate too much vertical space above the actual exercise on
 *  mobile, pushing the choices below the fold. */
export function LessonPracticeBanner({ href, topicTitle, lessonTitle, lessonId }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-4 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-border-subtle hover:border-border transition text-left"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span aria-hidden>📖</span>
          <span className="text-sm font-semibold text-text truncate">{lessonTitle}</span>
        </span>
        <span className="text-text-faint text-xs shrink-0">Details ▾</span>
      </button>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-surface border border-border-subtle">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-faint">Practicing for a lesson</p>
          <p className="text-xs text-text-subtle truncate">{topicTitle}</p>
          <p className="text-sm font-semibold text-text truncate">{lessonTitle}</p>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 text-text-faint hover:text-text-subtle text-xs transition"
        >
          ▴ Hide
        </button>
      </div>
      <div className="mt-3">
        <MarkLessonFinishedButton lessonId={lessonId} />
      </div>
    </div>
  );
}

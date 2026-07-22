"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGuestToken, useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";
import type { LessonSummary } from "@/types/lesson";

interface Props {
  lessonId: number;
  topicId: number;
  prev: LessonSummary | null;
  next: LessonSummary | null;
}

export function LessonProgressPanel({ lessonId, topicId, prev, next }: Props) {
  const { progress } = useLessonProgress();
  const [resetting, setResetting] = useState(false);

  // Mark viewed on every visit — the API only sets the timestamp once, so
  // this is a harmless no-op after the first time.
  useEffect(() => {
    fetch("/api/lessons/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, sessionToken: getGuestToken(), kind: "viewed" }),
    }).catch(() => {});
  }, [lessonId]);

  async function markUncompleted(scope: "lesson" | "topic") {
    setResetting(true);
    try {
      await fetch("/api/lessons/progress/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          scope === "lesson"
            ? { lessonId, sessionToken: getGuestToken() }
            : { topicId, sessionToken: getGuestToken() }
        ),
      });
      location.reload();
    } catch {
      setResetting(false);
    }
  }

  const current = progress[lessonId];
  const canReset = current?.viewed || current?.practiced;

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <span className="flex items-center gap-2 text-text-subtle">
          <StatusDot status={current} />
          {current?.completed ? "Completed" : current?.viewed || current?.practiced ? "In progress" : "Not started"}
        </span>
        {canReset && (
          <span className="flex items-center gap-3">
            <button
              onClick={() => markUncompleted("lesson")}
              disabled={resetting}
              className="text-xs text-text-faint hover:text-text-subtle transition underline underline-offset-2 disabled:opacity-50"
            >
              Mark lesson as uncompleted
            </button>
            <button
              onClick={() => markUncompleted("topic")}
              disabled={resetting}
              className="text-xs text-text-faint hover:text-text-subtle transition underline underline-offset-2 disabled:opacity-50"
            >
              Mark topic as uncompleted
            </button>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-6">
        {prev ? (
          <Link
            href={`/learn/${prev.topicSlug}/${prev.slug}`}
            className="flex items-center gap-2 text-sm text-text-subtle hover:text-text-secondary transition"
          >
            <StatusDot status={progress[prev.id]} /> ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.topicSlug}/${next.slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-text hover:text-indigo-400 transition"
          >
            <StatusDot status={progress[next.id]} /> {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

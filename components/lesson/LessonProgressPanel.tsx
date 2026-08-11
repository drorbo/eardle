"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { getOrCreateGuestToken } from "@/lib/guestSession";
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
  const [busy, setBusy] = useState(false);

  // Mark viewed on every visit — the API only sets the timestamp once, so
  // this is a harmless no-op after the first time.
  useEffect(() => {
    fetch("/api/lessons/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, sessionToken: getOrCreateGuestToken(), kind: "viewed" }),
    }).catch(() => {});
  }, [lessonId]);

  async function resetProgress(scope: "lesson" | "topic") {
    setBusy(true);
    try {
      await fetch("/api/lessons/progress/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          scope === "lesson" ? { lessonId, sessionToken: getOrCreateGuestToken() } : { topicId, sessionToken: getOrCreateGuestToken() }
        ),
      });
      location.reload();
    } catch {
      setBusy(false);
    }
  }

  // A lesson is "completed" once it's both viewed and practiced — viewed
  // fires automatically above, practiced normally fires after a full lap of
  // the linked practice package (see PracticeCompletionTracker). This button
  // is the manual override for lessons finished a different way (no linked
  // practice, or the user just wants to flag it done by hand).
  async function markFinished() {
    setBusy(true);
    try {
      await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, sessionToken: getOrCreateGuestToken(), kind: "practiced" }),
      });
      location.reload();
    } catch {
      setBusy(false);
    }
  }

  // Undoes "completed" back to "in progress" — clears only practicedAt, not
  // viewedAt, so the lesson doesn't fall all the way back to "not started".
  async function markInProgress() {
    setBusy(true);
    try {
      await fetch("/api/lessons/progress/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, sessionToken: getOrCreateGuestToken(), field: "practiced" }),
      });
      location.reload();
    } catch {
      setBusy(false);
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

        <span className="flex items-center gap-2 flex-wrap">
          {!current?.completed && (
            <button
              onClick={markFinished}
              disabled={busy}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition disabled:opacity-50"
            >
              ✓ Mark as finished
            </button>
          )}
          {current?.completed && (
            <button
              onClick={markInProgress}
              disabled={busy}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-400/60 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition disabled:opacity-50"
            >
              ↺ Mark as in progress
            </button>
          )}
          {canReset && (
            <>
              <button
                onClick={() => resetProgress("lesson")}
                disabled={busy}
                className="text-xs text-text-faint hover:text-text-subtle transition underline underline-offset-2 disabled:opacity-50"
              >
                Reset progress
              </button>
              <button
                onClick={() => resetProgress("topic")}
                disabled={busy}
                className="text-xs text-text-faint hover:text-text-subtle transition underline underline-offset-2 disabled:opacity-50"
              >
                Reset topic progress
              </button>
            </>
          )}
        </span>
      </div>

      <div className="flex items-stretch gap-3 border-t border-border-subtle pt-6">
        {prev ? (
          <Link
            href={`/learn/${prev.topicSlug}/${prev.slug}`}
            className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-2 hover:border-border transition"
          >
            <StatusDot status={progress[prev.id]} />
            <span className="flex flex-col min-w-0 text-left">
              <span className="text-[10px] uppercase tracking-wide text-text-faint">Previous</span>
              <span className="text-sm font-semibold text-text truncate">← {prev.title}</span>
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/learn/${next.topicSlug}/${next.slug}`}
            className="flex-1 min-w-0 flex items-center justify-end gap-2 px-4 py-3 rounded-xl border border-border-subtle bg-surface hover:bg-surface-2 hover:border-border transition"
          >
            <span className="flex flex-col min-w-0 text-right">
              <span className="text-[10px] uppercase tracking-wide text-text-faint">Next</span>
              <span className="text-sm font-semibold text-text truncate">{next.title} →</span>
            </span>
            <StatusDot status={progress[next.id]} />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}

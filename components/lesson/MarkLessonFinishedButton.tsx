"use client";

import { useState } from "react";
import { getGuestToken } from "@/hooks/useLessonProgress";

/** Lets a user flag the lesson they're practicing for as finished, right
 *  from the exercise page — for lessons with no practice cycle to auto-
 *  complete against (or someone who just wants to mark it done by hand).
 *  Sets both viewed and practiced so the lesson reads as fully completed
 *  regardless of what state it was in before. */
export function MarkLessonFinishedButton({ lessonId }: { lessonId: number }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function markFinished() {
    setState("busy");
    try {
      const token = getGuestToken();
      await Promise.all(
        (["viewed", "practiced"] as const).map((kind) =>
          fetch("/api/lessons/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId, sessionToken: token, kind }),
          })
        )
      );
      setState("done");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <span className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
        ✓ Lesson marked finished
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={markFinished}
      disabled={state === "busy"}
      className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition disabled:opacity-50"
    >
      ✓ Mark lesson as finished
    </button>
  );
}

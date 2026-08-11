"use client";

import { useEffect } from "react";
import { getOrCreateGuestToken } from "@/lib/guestSession";

// Rendered (server-side gated) only on the exact exercise page load that
// completes one full cycle through a lesson's linked practice package — see
// the cycleJustCompleted computation in [category]/[id]/page.tsx.
export function PracticeCompletionTracker({ lessonId }: { lessonId: number }) {
  useEffect(() => {
    fetch("/api/lessons/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, sessionToken: getOrCreateGuestToken(), kind: "practiced" }),
    }).catch(() => {});
  }, [lessonId]);

  return null;
}

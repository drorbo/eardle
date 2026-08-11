"use client";

import { useEffect, useState } from "react";
import { getGuestToken } from "@/lib/guestSession";

export interface LessonStatus {
  viewed: boolean;
  practiced: boolean;
  completed: boolean;
}

export type LessonProgressMap = Record<number, LessonStatus>;

// Re-exported for existing call sites that import getGuestToken from here —
// the real implementation now lives in lib/guestSession.ts alongside the
// mint-and-persist variant, so both variants can't drift apart again.
export { getGuestToken };

export function useLessonProgress() {
  const [progress, setProgress] = useState<LessonProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = getGuestToken();
    fetch(`/api/lessons/progress${token ? `?token=${encodeURIComponent(token)}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setProgress(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { progress, loaded };
}

"use client";

import { useEffect, useState } from "react";

export interface LessonStatus {
  viewed: boolean;
  practiced: boolean;
  completed: boolean;
}

export type LessonProgressMap = Record<number, LessonStatus>;

export function getGuestToken(): string | null {
  try {
    return localStorage.getItem("eardle_session");
  } catch {
    return null;
  }
}

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

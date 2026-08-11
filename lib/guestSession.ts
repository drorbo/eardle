// Guest identity: a random UUID persisted in localStorage, used everywhere an
// unauthenticated visitor needs a stable identity for progress/streaks/daily
// puzzle attempts (see docs/lessons-planning/codebase-architecture.md's
// "Identity pattern to reuse"). One implementation, reused by every call
// site — previously duplicated three times (ExercisePlayerWrapper.tsx,
// useDailyPuzzle.ts, and a read-only-only copy in useLessonProgress.ts that
// never minted a token, the root cause of a bug where a guest's first-ever
// interaction being a lesson page silently failed to record any progress —
// see the 2026-08-11 audit).
const KEY = "eardle_session";

/** Mint-and-persist: use before any write that needs a real identity. */
export function getOrCreateGuestToken(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    try {
      localStorage.setItem(KEY, fresh);
    } catch {
      // Quota exceeded / private browsing — proceed with an ephemeral token
      // rather than failing the action outright.
    }
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

/** Read-only: use when there's nothing to do if no guest identity exists yet
 *  (e.g. checking existing progress — no token minted means nothing to find). */
export function getGuestToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

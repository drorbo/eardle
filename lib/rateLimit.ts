const attempts = new Map<string, { count: number; resetAt: number }>();

// Single-instance, in-memory sliding-window limiter. Fine for the current
// single-container deployment; swap for a shared store (e.g. Redis) if this
// app is ever horizontally scaled.
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (attempts.size > 10000) {
    for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
  }
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

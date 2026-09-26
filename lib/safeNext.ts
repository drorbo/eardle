/**
 * A same-site path that is safe to send someone back to after they sign in, or null.
 *
 * Only a path on this site is accepted (starts with a single "/"), so a `?next=` parameter can never be turned into an
 * open redirect to another site. Used by /signin and /signup; Jam Gym's "Sign in with eardle" relies on it to come back
 * to /jam-gym/authorize after the person has signed in (see docs/jam-gym-integration.md).
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    if (new URL(value, "http://same.site").origin !== "http://same.site") return null;
  } catch {
    return null;
  }
  return value;
}

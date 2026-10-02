import { db } from "./db";
import { users } from "./db/schema";
import { eq, sql } from "drizzle-orm";

export type GoogleProfile = { sub?: string; email?: string; name?: string; picture?: string };

/**
 * Find or create the `users` row for a Google sign-in, for lib/auth.ts's `jwt` callback. Pulled out into its own
 * function so this one policy decision can be tested directly against a real database, without driving a full
 * OAuth round trip through NextAuth.
 *
 * Matches ONLY by Google id, never by email. An email match alone used to attach a new Google sign-in to whatever
 * existing row already had that email — but an email address on a `users` row is not proof of ownership, since
 * `app/api/user/register` lets anyone create a password account under any email without verifying it. That let an
 * attacker pre-register a victim's real address with a password only the attacker knows; the real victim's first
 * "Continue with Google" with that address would then have silently attached to the attacker's row, handing the
 * attacker the account — including everything in it — from then on. See the 2026-09 audit, finding M-4.
 *
 * The practical effect of matching by Google id alone: someone who already has a password account and later uses
 * "Continue with Google" with the same email, without the two ever having been linked, gets a second, separate
 * account rather than a merge. There is no in-app "link your Google account" action today; if merging on request is
 * ever wanted, build one that requires being signed in with the password first (proving ownership of that account),
 * rather than restoring an email-based match here.
 *
 * One consequence of "separate account": `email` has a plain, case-sensitive uniqueness constraint of its own
 * (`users.email.unique()` — predates this function, relied on elsewhere, not changed here), so a *second* row with
 * that exact address cannot be inserted at all. When Google's address is already claimed by a different, unlinked
 * row, the new account is created with no email on it rather than erroring the sign-in or reusing someone else's
 * claim to it: the person can still use the app and set a nickname, and can set an email once `app/api/user/profile`
 * supports changing it (it does not today).
 */
export async function resolveGoogleUser(profile: GoogleProfile) {
  const googleId = profile.sub ?? "";
  // Google's own email is already normalised, but store it the same lower-cased way as every other email in this
  // table (app/api/user/register, lib/auth.ts's Credentials provider), so a row is never missed on casing alone.
  const email = profile.email ? profile.email.trim().toLowerCase() : null;

  const existing = await db.query.users.findFirst({ where: eq(users.googleId, googleId) });
  if (existing) return existing;

  const taken = email ? await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${email}` }) : undefined;

  const [created] = await db.insert(users).values({
    email: taken ? null : email,
    googleId,
    name: profile.name ?? null,
    avatarUrl: profile.picture ?? null,
  }).returning();
  return created;
}

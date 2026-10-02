// Run with: npm run test:google-account   (needs DATABASE_URL pointing at a disposable Postgres — see below)
//
// This exercises a real database on purpose: the policy in lib/googleAccount.ts is "match by Google id, never by
// email", and the whole point of that policy is a database-level question (does a second row get created, does an
// existing row get reused) that a mock would just assert back at itself.
import test from "node:test";
import assert from "node:assert/strict";
import { hashSync } from "bcryptjs";
import { db, client } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { resolveGoogleUser } from "./googleAccount";

test.after(() => client.end());

test("a Google sign-in for a brand new address creates a row with no password", async () => {
  const email = `new-${Date.now()}@example.com`;
  const row = await resolveGoogleUser({ sub: `g-${Date.now()}-a`, email, name: "New Person" });
  assert.equal(row.email, email);
  assert.equal(row.passwordHash, null);
  assert.ok(row.googleId);
});

test("signing in again with the same Google id returns the same row, not a new one", async () => {
  const sub = `g-${Date.now()}-b`;
  const first = await resolveGoogleUser({ sub, email: `repeat-${Date.now()}@example.com`, name: "Repeat" });
  const second = await resolveGoogleUser({ sub, email: first.email ?? undefined, name: "Repeat" });
  assert.equal(second.id, first.id);
  const count = await db.select().from(users).where(eq(users.googleId, sub));
  assert.equal(count.length, 1, "only one row for this Google id");
});

test("a Google sign-in never attaches to an existing password account that shares its email — it gets a second, separate account (the 2026-09 audit, finding M-4)", async () => {
  const email = `shared-${Date.now()}@example.com`;
  const [passwordAccount] = await db.insert(users).values({
    email,
    passwordHash: hashSync("whatever-the-attacker-chose", 12),
    nickname: "Pre-registered by someone else",
  }).returning();
  assert.equal(passwordAccount.googleId, null);

  // the real owner of that address signs in with Google for the first time
  const googleRow = await resolveGoogleUser({ sub: `g-${Date.now()}-c`, email, name: "Real Owner" });

  assert.notEqual(googleRow.id, passwordAccount.id, "a different row, not the password account");
  assert.equal(googleRow.passwordHash, null, "the new row has no password at all, let alone the attacker's");
  assert.ok(googleRow.googleId, "the sign-in still succeeds — it is not left half-created");
  // `users.email` has its own plain uniqueness constraint (unrelated to this fix) that would reject a second row
  // with the identical address, so the new account simply has no email rather than erroring or reusing the claim
  assert.equal(googleRow.email, null);

  // the password account is completely untouched: same password hash, still unlinked, still holds the email
  const stillThere = await db.query.users.findFirst({ where: eq(users.id, passwordAccount.id) });
  assert.equal(stillThere?.passwordHash, passwordAccount.passwordHash);
  assert.equal(stillThere?.googleId, null);
  assert.equal(stillThere?.email, email);
});

test("the Google id is matched exactly as sent; email is normalised to lower case either way", async () => {
  const sub = `g-${Date.now()}-d`;
  const email = `Mixed.Case-${Date.now()}@Example.com`;
  const created = await resolveGoogleUser({ sub, email, name: "Casing" });
  assert.equal(created.email, email.toLowerCase());
  const found = await resolveGoogleUser({ sub, email: email.toLowerCase() });
  assert.equal(found.id, created.id);
});

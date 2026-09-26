// Run with: npm run test:sso   (uses Node's built-in test runner through tsx)
import test from "node:test";
import assert from "node:assert/strict";
import { createJamGymToken, isValidState, jamGymBaseUrl, jamGymCallbackUrl } from "./jamGymSso";
import { safeNext } from "./safeNext";

test("the token is byte-for-byte what Jam Gym's own test pins (test/eardle-signin.test.js in the jam-gym repo)", () => {
  const token = createJamGymToken("pinned-secret", { sub: 42, name: "Nir", state: "pinnedstate1234567", iat: 1_700_000_000 });
  assert.equal(
    token,
    "v1.eyJhdWQiOiJqYW0tZ3ltIiwic3ViIjoiNDIiLCJuYW1lIjoiTmlyIiwic3RhdGUiOiJwaW5uZWRzdGF0ZTEyMzQ1NjciLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDEyMH0.XGApcCp_QidCUS2dKyT5qOTUpnJk7AHudZZ_lhFADZ0",
  );
});

test("the name is optional, and the lifetime is short", () => {
  const token = createJamGymToken("s", { sub: "7", state: "abcdefghijklmnop", iat: 1000 });
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  assert.deepEqual(payload, { aud: "jam-gym", sub: "7", state: "abcdefghijklmnop", iat: 1000, exp: 1120 });
});

test("only a well-formed state is accepted", () => {
  assert.ok(isValidState("A".repeat(32)));
  for (const bad of [undefined, "", "short", "has space in it aaaaaaaa", "a".repeat(65), "x/../yyyyyyyyyyyyyyyy", 5]) assert.ok(!isValidState(bad), String(bad));
});

test("the return address comes from configuration, defaults to production, and carries the token as a query value", () => {
  delete process.env.JAMGYM_URL;
  assert.equal(jamGymBaseUrl(), "https://jam-gym.eardle.com");
  assert.equal(jamGymCallbackUrl("v1.a.b"), "https://jam-gym.eardle.com/api/auth/eardle/callback?token=v1.a.b");
  process.env.JAMGYM_URL = "http://localhost:5173/";
  assert.equal(jamGymBaseUrl(), "http://localhost:5173");
  delete process.env.JAMGYM_URL;
});

test("?next= only ever means a path on this site", () => {
  assert.equal(safeNext("/jam-gym/authorize?state=abc"), "/jam-gym/authorize?state=abc");
  assert.equal(safeNext("/dashboard"), "/dashboard");
  for (const bad of [null, undefined, "", "dashboard", "//evil.example", "https://evil.example", "/\\evil.example", "/\nx", "javascript:alert(1)", "/" + "a".repeat(400)]) {
    assert.equal(safeNext(bad), null, String(bad));
  }
});

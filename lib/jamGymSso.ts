import { createHmac } from "node:crypto";

/**
 * "Sign in with eardle" for Jam Gym (https://jam-gym.eardle.com), the sibling project on this server.
 *
 * eardle owns the accounts. Jam Gym never sees a password or an email: after eardle has signed someone in, the page
 * /jam-gym/authorize hands the browser back to Jam Gym with a short-lived signed token that says "this is eardle user N".
 * Full description, the deploy steps and the security reasoning: docs/jam-gym-integration.md.
 *
 * The token format is shared with Jam Gym's server/sso.js (in the jam-gym repo); the two must stay identical:
 *
 *   token   = "v1." + base64url(JSON payload) + "." + base64url(HMAC-SHA256(secret, "v1." + base64url(JSON payload)))
 *   payload = { aud: "jam-gym", sub: "<eardle user id>", name?: "<nickname>", state: "<from Jam Gym>", iat, exp }  (seconds)
 *
 * The secret is JAMGYM_SSO_SECRET here and EARDLE_SSO_SECRET in Jam Gym: the same value. Nothing is issued without it.
 */

const TOKEN_LIFETIME_SECONDS = 120;
const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

/** Where Jam Gym receives the token. Fixed by configuration, never taken from the request, so it cannot be redirected elsewhere. */
export function jamGymBaseUrl(): string {
  return (process.env.JAMGYM_URL || "https://jam-gym.eardle.com").replace(/\/+$/, "");
}

/** The random state Jam Gym put in the person's browser before sending them here. */
export function isValidState(state: unknown): state is string {
  return typeof state === "string" && /^[A-Za-z0-9]{16,64}$/.test(state);
}

export function createJamGymToken(
  secret: string,
  { sub, name, state, iat = Math.floor(Date.now() / 1000), ttl = TOKEN_LIFETIME_SECONDS }: { sub: string | number; name?: string | null; state: string; iat?: number; ttl?: number },
): string {
  const payload = { aud: "jam-gym", sub: String(sub), ...(name ? { name } : {}), state, iat, exp: iat + ttl };
  const body = `v1.${b64(JSON.stringify(payload))}`;
  return `${body}.${b64(createHmac("sha256", secret).update(body).digest())}`;
}

export function jamGymCallbackUrl(token: string): string {
  return `${jamGymBaseUrl()}/api/auth/eardle/callback?token=${encodeURIComponent(token)}`;
}

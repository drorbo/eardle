# Jam Gym is part of eardle: accounts ("Sign in with eardle")

**Read this before changing anything about eardle accounts, the sign-in pages, `NEXTAUTH_SECRET`, cookies, or the
`users` table.** Jam Gym (https://jam-gym.eardle.com) is a sibling project on the same server and it now uses eardle
accounts. It is a separate app with its own database, but *who a person is* is decided here.

- Jam Gym repo: https://github.com/drorbo/jam-gym, locally `C:\Users\Public\Documents\jam gym` (a neighbour folder of this repo).
- Its side of this integration: `docs/eardle-accounts.md` in that repo. Its server layout: `docs/deployment.md` there.
- The server-level heads-up (nginx, TLS, Docker, volumes): `JAM-GYM-ON-THIS-SERVER.md` in the root of this repo.

## What Jam Gym is, and how accounts fit

Jam Gym is a backing-band practice tool (type a chord progression, pick jazz/blues/rock, a band loops it). People can save
tracks, publish them and like other people's. Without an account, Jam Gym gives each browser an anonymous identity (a random
secret in a cookie, plus a recovery code). **Signing in with eardle is optional**: it links that identity to an eardle
account so the library follows the person to any device and survives cleared cookies.

## The decision: two databases, one login

Jam Gym keeps its own SQLite database (tracks, likes, presets). It does **not** read eardle's Postgres, and eardle does not
read Jam Gym's. The only thing that crosses between them is a signed statement, made by eardle, saying *"this browser is
eardle user 42, nickname Miles"*. Jam Gym stores `('eardle', '42')` next to its own user row. That is all.

Why not a shared database or a shared cookie: Jam Gym keeps working if eardle is down; one site's bug cannot log everyone
out of the other; no Jam Gym data lives in eardle's Postgres; and no password or email ever reaches Jam Gym.

## The flow

```
 browser                  jam-gym.eardle.com                       eardle.com
    |  click "Sign in with eardle"                                     |
    |------------------------------->|                                 |
    |   GET /api/auth/eardle/start   |  makes random state,            |
    |                                |  Set-Cookie jg_sso=state        |
    |<-------------------------------|  302 -> eardle.com/jam-gym/authorize?state=...
    |---------------------------------------------------------------->|
    |                                                                  |  signed in? no -> /signin?next=/jam-gym/authorize?state=...
    |                                                                  |  (sign in / sign up, then back here)
    |                                                                  |  yes -> token = HMAC-signed { sub: user id, name: nickname, state, 2 min }
    |<----------------------------------------------------------------|  302 -> jam-gym.eardle.com/api/auth/eardle/callback?token=...
    |------------------------------->|  checks signature, expiry, and that state == its cookie
    |   GET /api/auth/eardle/callback|  links / opens the eardle account, clears jg_sso
    |<-------------------------------|  302 -> /?eardle=ok
```

## Every edit made to eardle for this (all in the eardle repo)

| File | Change |
| --- | --- |
| `app/jam-gym/authorize/page.tsx` | **New.** The route `/jam-gym/authorize?state=...`. If the visitor has an eardle session, redirects to Jam Gym's callback with a signed token; if not, redirects to `/signin?next=...`; refuses admin sessions; `notFound()` when `JAMGYM_SSO_SECRET` is unset (integration off). |
| `lib/jamGymSso.ts` | **New.** Creates the token (`createJamGymToken`), validates the `state` format (`isValidState`), builds the callback URL from `JAMGYM_URL` (`jamGymCallbackUrl`). The format is mirrored by `server/sso.js` in the jam-gym repo. |
| `lib/jamGymSso.test.ts` | **New.** `npm run test:sso`. Includes a *pinned token*: the exact same string is asserted in the jam-gym repo's `test/eardle-signin.test.js`, so the two implementations cannot drift apart without a test failing on one side. |
| `lib/safeNext.ts` | **New.** `safeNext()` accepts only a same-site path for `?next=` (no `//host`, no scheme, no backslash, no control characters). |
| `app/signin/page.tsx`, `app/signup/page.tsx` | After a successful sign-in / sign-up, go to `?next=` (via `safeNext`, with a full page load) instead of always `/dashboard`. The links between the two pages carry `next` along. **Google caveat:** with a `next`, the Google callback goes straight there, so the guest-progress migration that `/dashboard?migrate=1` does is skipped for that one sign-in. |
| `docker-compose.yml` | Passes `JAMGYM_SSO_SECRET` and `JAMGYM_URL` to the `app` container (both optional; empty secret = integration off). |
| `.env.example` | Documents the two variables. |
| `package.json` | Adds `"test:sso"`. |
| `docs/jam-gym-integration.md` (this file), `AGENTS.md`, `README.md`, `JAM-GYM-ON-THIS-SERVER.md`, `docs/deployment.md` | Documentation, so a future agent knows Jam Gym is part of eardle. |

**Not changed:** `lib/auth.ts` (providers, callbacks, cookie names), the `users` table and every migration, `middleware.ts`,
the session strategy (still JWT), `NEXTAUTH_SECRET`. There is no schema change in eardle.

## Configuration

| Variable | Where | Meaning |
| --- | --- | --- |
| `JAMGYM_SSO_SECRET` | eardle `.env` on the server | The shared secret. Must equal `EARDLE_SSO_SECRET` in Jam Gym. **Empty or unset switches the integration off** (`/jam-gym/authorize` answers 404). Never reuse `NEXTAUTH_SECRET`. |
| `JAMGYM_URL` | eardle `.env` (optional) | Where the token is delivered. Default `https://jam-gym.eardle.com`. It is configuration, never read from the request, so nobody can make eardle send a token to another site. |

The secret lives in two `.env` files on the server (`~/drorbo/eardle/.env` and `~/drorbo/jam-gym/.env`), created by
`scripts/setup-eardle-sso.sh` in the jam-gym repo. It is never committed and never printed.

## Deploying it (order matters)

1. **eardle first**, with the secret in its `.env`: `bash scripts/deploy-prod.sh` (see `docs/deployment.md`). The authorize page must exist before Jam Gym starts sending people to it.
2. **Then Jam Gym**: `bash scripts/ship.sh` in the jam-gym repo. The "Sign in with eardle" link appears only when Jam Gym has the secret.
3. One-time secret creation on the server (idempotent): `bash scripts/setup-eardle-sso.sh` from the jam-gym repo. It does nothing if both files already agree.

Rolling back: remove `JAMGYM_SSO_SECRET` from Jam Gym's `.env` and re-run `docker compose up -d web` there: the link disappears and
already-linked people keep their libraries (they simply cannot sign in on new devices until it returns).

## Security model (why it is built this way)

- **The token proves one thing**: eardle vouches that the browser that started this flow is eardle user `sub`. It is HMAC-SHA256 signed with the shared secret, expires after 2 minutes (Jam Gym refuses anything claiming more than 10), and has `aud: "jam-gym"`.
- **State binds the token to the browser that asked.** Jam Gym puts a random state in an HttpOnly cookie and passes it to eardle; the token carries it back; Jam Gym requires the two to match and then clears the cookie, so a token cannot be replayed or planted into someone else's browser (login CSRF).
- **No email, no password hash, no Google id** ever leaves eardle. The token has the numeric user id and the nickname. Jam Gym uses the nickname as a display name only if the person still has a default name.
- **Admins are refused.** `admin_users` is a separate table whose ids overlap with `users` ids, so an admin session must never be turned into a user id. `authorize/page.tsx` only accepts `role === "user"`.
- **No open redirect.** The return URL is fixed by `JAMGYM_URL`; `?next=` is restricted by `safeNext`.
- The token appears in a URL once (the callback), so it can be seen in nginx access logs for Jam Gym. That is why it is short-lived and bound to a state cookie.
- **Rotating the secret**: change it in both `.env` files, `docker compose up -d` both apps. Only sign-ins in progress are affected; existing Jam Gym sessions do not use the secret.

## What Jam Gym does with an eardle sign-in (summary; details in its `docs/eardle-accounts.md`)

- A browser with an anonymous library that signs in with an eardle account **not yet seen** links its own library to that account.
- An eardle account **already linked** opens its library; the browser's anonymous library (if any) is merged into it, nothing lost, likes not double counted.
- A second device signs in independently (its own session); "Sign out" ends only that device.
- Jam Gym's own moderation (bans, hide, delete) stays per site; an eardle ban would not carry over unless implemented on purpose.

## Known limits and things a future change must respect

- **Never reuse or renumber `users.id`** in eardle: Jam Gym identifies an account by that id alone (`serial`, so reuse does not happen today). If `users` rows are ever deleted, their Jam Gym libraries stay behind, unreachable but not hijackable. If you add account deletion, decide whether it should also call Jam Gym.
- Changing an eardle nickname does not update the name in Jam Gym (copied once at first link; the person can rename in Jam Gym).
- If you change what `auth()` returns (`session.user.id` / `role` / `nickname`), keep `authorize/page.tsx` in step.
- If you change the token format, change both repos in the same session and update the pinned token in both tests.
- Cookies are still host-only (`eardle.com`), on purpose: nothing here shares a session cookie with the subdomain.

## Local development

Run both apps and point them at each other (any free ports):

```bash
# eardle (needs Postgres as in README "Local development")
JAMGYM_SSO_SECRET=dev-secret JAMGYM_URL=http://localhost:5173 npm run dev
# jam-gym (in its folder)
EARDLE_SSO_SECRET=dev-secret EARDLE_URL=http://localhost:3000 npm start
```

Then open http://localhost:5173, sidebar → Tracks → "Sign in with eardle".

## History

- 2026-09-26: added (Jam Gym: "Sign in with eardle", schema 3 with a `sessions` table; eardle: authorize page, `?next=` on sign-in/up).

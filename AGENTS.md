<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Jam Gym is part of eardle

`jam-gym.eardle.com` is a sibling app on this server (its repo: the neighbour folder `jam gym`, GitHub `drorbo/jam-gym`)
and it uses **eardle accounts** through "Sign in with eardle". If you touch sign-in/sign-up, `lib/auth.ts`, the `users` table,
`NEXTAUTH_SECRET`, cookies, or anything under `app/jam-gym/`, first read **`docs/jam-gym-integration.md`**: it lists every
eardle file that exists for Jam Gym, the token format shared with the other repo, the env vars (`JAMGYM_SSO_SECRET`,
`JAMGYM_URL`), the deploy order (eardle first) and the rules a change must respect. Server-level facts (nginx, TLS, Docker,
volumes, commands that would hurt Jam Gym) are in `JAM-GYM-ON-THIS-SERVER.md`. Run `npm run test:sso` after touching any of it.

# Development workflow

Derived from a full git-history audit (2026-08-11) of how this project's features have actually been built — see the "Dev process audit" project memory for the full report.

- **Spec + plan before code, for any design-heavy feature** — anything touching 3+ files or with a real visual/UX decision to make. Write `docs/superpowers/specs/<date>-<feature>-design.md` and `docs/superpowers/plans/<date>-<feature>.md` first, resolving open questions with the user directly, before implementing. The one feature in this project's history that skipped this step needed more follow-up correction rounds than any other.
- **Before presenting any CSS/layout/component change as finished, run a checkpoint**: screenshot the result at a mobile width (~390px) and a desktop width, read browser console messages for errors or React hydration warnings, and — `chrome-devtools-mcp` is installed for this — run a `lighthouse_audit` accessibility pass on any new or changed page. Fix anything the checkpoint catches before showing the result, not after being told about it.
- **Color and small type sizes should come from a shared source, not be reinvented per feature.** Reuse `lib/design/palette.ts`'s `HUES` table for any "pick N distinct colors for a grouping" UI instead of hand-writing a new Tailwind gradient/border tuple per hue.

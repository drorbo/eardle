# Admin stats panel expansion — design spec

**Date:** 2026-08-17
**Why:** the admin stats page (`app/admin/(protected)/stats/page.tsx`) currently shows totals, a by-category table, and a top-10 list — nowhere near enough to answer the site owner's actual question: is the user base growing, are people sticking around, and which parts of the product (practice categories, Daily EarDle, the Learn feature) are actually getting used. This spec plans a full replacement built around that goal.

## Data sources

No new tracking is being added. Everything below is computed from existing tables:

- `sessions` — one row per exercise-practice attempt (`exerciseId`, `userId` nullable, `sessionToken`, `correct`, `createdAt`). Join `exercises` for category/difficulty.
- `users` — `createdAt` is the exact signup timestamp.
- `dailyAttempts` — one row per Daily EarDle puzzle attempt, with `category`, `difficulty`, `exerciseType`, `topic` denormalized, `status` (`won`/`lost`/`in_progress`), `finalGuessCount`, `createdAt`.
- `streaks` — `currentStreak`/`longestStreak` per actor, split by `kind` (`exercise` | `daily`).
- `lessonProgress` — `viewedAt`/`practicedAt` per actor per lesson. Join `lessons`/`topics` for topic-level rollups.

**Explicitly not added:** generic page-view tracking (no event fires on visiting `/piano`, `/profile`, etc.) — out of scope per the "stats page, not a new analytics system" decision. Category/puzzle/lesson engagement is fully answerable without it.

**No admin-activity exclusion.** The admin panel itself never writes to any of these tables (confirmed: nothing under `/admin/*`, including the exercise-form "▶ Preview" button, touches `sessions`/`dailyAttempts`/`lessonProgress` — Preview just plays audio locally). Production's database is separate from any local/dev test data, so no filtering is needed.

## Identity model

An **actor** is `userId` if signed in, else `sessionToken` (guest). This mirrors the dual-identity pattern already used by `streaks`/`dailyAttempts`/`lessonProgress` (partial unique indexes on one or the other, never both).

- **Growth/activity/retention charts blend both** — a guest counts the same as a signed-up user for "how many people are using the site" purposes, per the site owner's explicit call.
- **Signup-rate charts are the one exception** — kept separate and driven purely by `users.createdAt`, since that's the only exactly-reliable identity signal.
- **Caveat (accepted, not solved):** a guest's identity is a browser-local token. Clearing storage or switching devices creates a new token, so returning-guest activity will sometimes look like a new actor. Retention/DAU numbers are directionally correct, not exact. No mitigation planned — flagged so the numbers aren't over-trusted later.
- **"First seen" for a blended actor** (used for growth-over-time charts) = `min(createdAt)` across `sessions`, `dailyAttempts`, and `lessonProgress` rows for that actor. `streaks.updatedAt` is excluded from this calculation since it mutates in place and isn't a first-seen signal.

## Regularity/retention approach (v1 scope)

Two cheap, complementary measures — cohort retention curves explicitly deferred:

1. **Streak-length distribution** — bucket current streaks (0 / 1–2 / 3–6 / 7–13 / 14–29 / 30+ days) using the `streaks` table directly. Answers "how many people are on a roll right now."
2. **DAU / WAU / MAU + stickiness ratio (DAU/MAU %)** — standard active-user counts over trailing 1/7/30-day windows, based on blended actor activity across `sessions` + `dailyAttempts` + `lessonProgress`.

## Page structure

Five tabs (not one long scroll — five is enough thematic ground to justify it, matching the pattern the audit already recommended for this project's UI). No global date-range picker for v1 — each chart uses a fixed, sensible default window (documented per-chart below); a picker can be added later once it's clear which ranges actually get reached for.

### Tab 1 — Overview
Glance-and-go: a handful of headline numbers plus one trend chart, not a dump of everything.
- Cards: Total Plays (all-time), Plays Today, Signed-Up Users (all-time), Daily Active Users (today), Overall Accuracy (all-time), Stickiness (DAU/MAU, most recent day)
- Hero chart: Daily Active Actors (blended), last 90 days

### Tab 2 — Growth & Activity
- Signups over time — daily-bucketed, last 90 days, from `users.createdAt`
- Daily Active Actors over time (blended) — fuller version of the Overview hero chart, last 90 days
- DAU / WAU / MAU numbers + stickiness ratio (most recent complete day/week/month)
- Streak-length distribution — `kind = "exercise"` only (the Daily EarDle streak distribution lives in Tab 4 instead, to keep each tab's regularity signal specific to its own feature rather than duplicated)
- Signed-up vs. guest split (all-time distinct actor counts) — context for how much of the base is anonymous

### Tab 3 — Exercise Practice
- By-category plays + accuracy (existing table, kept)
- Top 10 most-played exercises (existing, kept)
- New: plays-over-time by category — last 90 days, one series per category
- New: difficulty breakdown (easy/medium/hard/jazz) — plays + accuracy, not broken out anywhere today

### Tab 4 — Daily EarDle
Currently has zero presence in admin stats.
- Attempts over time, last 90 days
- Overall win rate (won / (won + lost), `in_progress` excluded), and win rate by category
- Average guesses-to-win (from `finalGuessCount` where `status = "won"`)
- Streak-length distribution for `kind = "daily"`

### Tab 5 — Learning Platform
- Lessons viewed vs. practiced — all-time totals, plus over-time if the data supports a clean trend (see open item below)
- Completion funnel: never touched → viewed only → viewed & practiced ("completed")
- Per-topic engagement — views/completions grouped by topic
- Most/least engaged lessons — top-N table, same shape as Tab 3's top-10 exercises

## Visual design

Charts follow the `dataviz` skill's guidance at implementation time (palette, mark choices, light/dark theming) — not decided in this spec. Existing `StatCard`/`QuickStat` primitives from the current stats page are reused for headline numbers; tabs use the same visual token system the admin panel was just merged onto (`bg-surface`, etc.), no new design language.

## Explicitly deferred

- Cohort retention curves (grouping actors by first-seen week, tracking % still active in later weeks) — richer than DAU/WAU/MAU but meaningfully more query/UI work. Revisit once the simpler measures are live and it's clear more depth is wanted.
- Generic page-view tracking (which routes get visited, not just which features get used) — a new tracking system, not a stats-page task.
- A global date-range picker — fixed windows are enough for v1.
- Any admin-activity exclusion — confirmed unnecessary.

## Open item for the implementation plan

Whether "lessons viewed/practiced over time" (Tab 5) gets a real trend chart or stays an all-time total depends on how much historical spread the `lessonProgress` data actually has (the Learn feature is recent) — the query-writing phase should check actual row counts/date range before committing to a time-series chart there versus just totals.

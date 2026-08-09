# Learn Overview Redesign — Design Spec

## Problem

The `/learn` page ("Learning Platform" — 30 topics / 31 lessons) currently
renders as 30 stacked `<h2>` + plain-link-list sections on one page. No
visual hierarchy, no map/path feel, and no strong "start here" signal for
a first-time visitor beyond a small "continue where you left off" banner
that only appears once progress exists. The matching `LearnSidebar` is a
deeply nested collapsible tree with the same problem in miniature.

Lesson *content* pages (`/learn/[topicSlug]/[lessonSlug]`) are **not** in
scope — they already interleave short text blocks with playable audio
examples, tips, and "common mistake" callouts, matching the pedagogy
research already captured in `docs/lessons-planning/`. This spec covers
the `/learn` overview page and its supporting nav components only.

## Research inputs

Existing research in `docs/lessons-planning/` was read and reused rather
than re-derived:
- `platform-examples.md` — structural survey of musictheory.net, teoria.com,
  Musicca, Hooktheory, EarMaster, Complete Ear Trainer. Cross-platform
  pattern: most sites use a "browse anything" topic library rather than
  hard-gated chapters (EarMaster/Complete Ear Trainer being the gated
  exceptions). This design follows the browse-anything model.
- `curriculum-outline.md` — the 6-tier pedagogical sequence already baked
  into `lessons.sortOrder` in the DB (verified directly: `sortOrder` 0-29
  already matches the tier order exactly).
- `pedagogy-notes.md` — confirms lesson *content* format (short prose +
  inline audio) is already aligned with best practice; not touched here.
- `content-storage-options.md` — confirms lesson storage (DB rows + admin
  UI, block-based body schema) was already decided; not revisited.

## Verified current state (read directly from code/DB, 2026-08-09)

- `topics` / `lessons` tables: 30 topics, 31 published lessons.
- `lessons.sortOrder` already encodes the full suggested-path order.
- `getTopicsWithLessons()` derives each topic's `category` (`NavCategoryId`
  = the 5 `Category` values from `types/exercise.ts` + `"fundamentals"`)
  from its first lesson's `practiceCategory`.
- `useLessonProgress()` returns `{ [lessonId]: { viewed, practiced,
  completed } }` for the current identity (userId or guest session token).
- `LearnOverviewClient.tsx`'s existing "continue" logic — first lesson in
  `sortOrder` where `!progress[lesson.id]?.viewed` — already resolves to
  lesson 1 for a brand-new user with empty progress. The gap is purely
  presentational (small banner, generic copy), not logical.
- Category distribution (published lessons): fundamentals 2, note 2,
  interval 5, chord 8, progression 7, scale 7.

## Design

### 1. Hero banner (three states, no new tracking)

Computed from data that already exists:
1. **Nothing viewed yet** → prominent "New here? Start with the
   fundamentals →" CTA linking to lesson 1 (first in `sortOrder`).
2. **Partial progress** → today's "Continue where you left off → [lesson
   title]" logic, same computation, restyled larger/bolder.
3. **Everything viewed** → no CTA-shaped hero; a small "You've explored
   every lesson — jump back in anytime" note instead.

### 2. Category tile grid

Six tiles: Fundamentals 🧱 + the five `CATEGORY_META` categories (Note,
Interval, Chord, Progression, Scale), styled consistently with the
existing `HomeActionCard`/`CategoryCard` visual language (gradient
background, rounded corners, full-card link/click target, hover scale) —
sized for a `grid-cols-2 sm:grid-cols-3` layout rather than the home
page's 3 huge cards.

Each tile shows a completion fraction (e.g. "2/2 done"), computed
client-side: count of that category's lessons with `progress[id].completed
=== true` out of total lessons in the category.

Tapping a tile **expands it in place** (accordion — same interaction the
sidebar already uses, not a new pattern) to reveal that category's topics,
each topic's lessons rendered as small cards (title, `StatusDot`, optional
short description) instead of the current plain stacked `<Link>` rows.
No new route is introduced (avoids any collision risk with the existing
`/[category]` exercise-browse routes and avoids a second page to maintain).

### 3. Shared category metadata

`LearnSidebar.tsx` currently hardcodes a `CATEGORY_ORDER` array (id,
label, emoji) inline. Extract this into one shared constant —
`lib/learn/categoryMeta.ts` — adding a color for `"fundamentals"` (a 6th
hue distinct from the five `CATEGORY_META` colors already in use for
Note/Interval/Chord/Progression/Scale; exact value tuned visually during
implementation, likely a cool neutral like slate to read as "foundational"
rather than another saturated topic color). Both `LearnSidebar` and the
new tile grid read from this one constant.

### 4. Sidebar

Structurally unchanged — still useful as a quick-jump aid while reading a
lesson. Two small edits only: read from the new shared `categoryMeta`
constant instead of its local array, and trim the explanatory copy line
("Grouped by category below...") since the main page now visibly does the
same grouping, avoiding redundant/confusing copy.

### 5. Mobile

Tiles: `grid-cols-2` on mobile, matching the existing `CategoryCard` grid
convention on `/practice`. Hero banner: full-width above the tile grid.
Expanded category content pushes the page down inline (no modal) — same
behavior as the existing mobile `<details>` sidebar disclosure.

### 6. Explicitly not changing

- `/learn/[topicSlug]/[lessonSlug]` URLs and rendering (`LessonBlocks`,
  audio example blocks, tip/mistake/summary blocks).
- No lesson gating/locking introduced. Every lesson stays freely
  clickable — consistent with today's "Builds on X" prerequisite link
  being informational only, and with the browse-anything model the
  platform research favored.
- `useLessonProgress`, `/api/lessons/progress`, `StatusDot` semantics
  (`viewed`/`practiced`/`completed`) — read as-is, only aggregated
  client-side for tile fractions. No API or schema changes.
- Admin lesson editor (`app/admin/(protected)/lessons/...`) — untouched.

## Files touched

- `components/lesson/LearnOverviewClient.tsx` — rewritten (hero + tile
  grid + accordion, replacing the flat stacked-sections rendering).
- `components/lesson/CategoryTile.tsx` — new.
- `components/lesson/TopicLessonCard.tsx` — new (replaces the plain
  `<Link>` row inside an expanded category).
- `lib/learn/categoryMeta.ts` — new shared constant.
- `components/lesson/LearnSidebar.tsx` — small edit (shared constant,
  trimmed copy).

No changes to `types/lesson.ts`, `lib/db/lessons.ts`, `lib/db/schema.ts`,
the lesson detail page, `LessonBlocks.tsx`, or any API route.

## Verification

1. `npm run dev`, visit `/learn` as a signed-out guest with no prior
   progress — confirm the "New here? Start with the fundamentals" hero
   appears and links to lesson 1.
2. Complete/view a few lessons across different categories — confirm the
   hero switches to "Continue where you left off" pointing at the correct
   next lesson, and tile fractions update accordingly.
3. Tap each of the 6 tiles — confirm it expands in place to show that
   category's topics/lessons as cards, with correct `StatusDot` states,
   and collapses again on a second tap.
4. Confirm clicking a lesson card still navigates to the existing
   `/learn/[topicSlug]/[lessonSlug]` route and that page is unchanged.
5. Confirm the sidebar (desktop persistent column + mobile `<details>`
   disclosure) still works, still auto-expands the active lesson's
   category, and reads from the shared `categoryMeta` constant.
6. Resize to a mobile viewport — confirm the 2-column tile grid, full-width
   hero, and inline (non-modal) expansion all look correct.
7. Spot-check `/practice` and the home page (`/`) to confirm neither
   regressed (shared `CATEGORY_META`/`CategoryCard` untouched).

# Eardle Codebase Architecture Reference

Written for the "educational lessons platform" planning effort. Documents current state only — no design decisions here. Verified directly against source as of this session; not from memory.

## 1. Stack & Conventions

- **Next.js 16.2.9**, App Router, Turbopack dev server. TypeScript throughout.
- **Drizzle ORM 0.45** + **PostgreSQL** (via `postgres` npm driver, not `pg`). Schema: `lib/db/schema.ts`. Migrations: `lib/db/migrations/` (drizzle-kit, config in `drizzle.config.ts`).
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.*` file. All config lives in `app/globals.css`.
- **NextAuth v5 beta** (`lib/auth.ts`) — JWT sessions, Credentials + Google OAuth providers.
- **Tone.js 15** for audio, **vexflow 5** for staff notation rendering.
- `package.json` scripts: `dev` (`next dev`), `build`, `start` (`npx tsx scripts/init-db.ts && next start` — seeds DB if empty, upserts admin user), `lint`.

### Theme token system (added this session — mandatory for any new UI)

`app/globals.css` defines semantic CSS custom properties, light values in `:root`, dark overrides in `.dark`, exposed as Tailwind utilities via `@theme inline`:

```css
:root {
  --bg: #a78bfa;              /* page background */
  --surface: #ffffff;         /* card/panel background, elevation 1 */
  --surface-2: #c4b5fd;       /* elevation 2 / hover fill / inset panels */
  --border-subtle: #8b5cf6;
  --border: #7c3aed;
  --text: #1e1b2e;            /* primary text */
  --text-secondary: #2e1065;
  --text-muted: #3f2a6e;
  --text-subtle: #4c3480;
  --text-faint: #6845a3;
  --accent-banner-bg: #c4b5fd;
  --accent-banner-border: #a78bfa;
  --accent-banner-text: #3730a3;
  --accent-hover-bg: #c4b5fd;
}
.dark { /* same keys, violet-950/900/800 family dark values */ }
```

Generated utility classes: `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border-subtle`, `border-border`, `text-text`, `text-text-secondary`, `text-text-muted`, `text-text-subtle`, `text-text-faint`, `bg-accent-banner-bg`, `border-accent-banner-border`, `text-accent-banner-text`, `bg-accent-hover-bg`.

Also: `.surface-elevated` (box-shadow lift for light mode, `none` in dark — dark mode signals elevation via lighter `--surface`/`--surface-2` instead), `.field-label`/`.field-input` (theme-aware form classes for **public** pages).

**`.label`/`.input` (no `field-` prefix) are legacy classes shared with the admin panel — hardcoded `text-gray-400`/`bg-gray-800`/etc, NOT theme-aware. Do not repoint these; admin still uses them deliberately (see §3).**

Toggle mechanism: `components/ThemeProvider.tsx` (context + `useTheme()` hook, `localStorage["eardle-theme"]`, toggles `.dark` class on `<html>`), nested inside `components/Providers.tsx` alongside `SessionProvider`. `app/layout.tsx` injects a pre-hydration inline script (wrapped in a `dangerouslySetInnerHTML` `<div>`, not a literal `<script>` JSX element — this specific Next/React version warns on literal `<script>` elements rendered through the component tree) that reads the stored theme and applies `.dark` before first paint. Default is light on first visit (not OS `prefers-color-scheme`).

## 2. Exercise System

### Categories & config shapes (`types/exercise.ts`)

```ts
type Category = "note" | "interval" | "chord" | "progression" | "scale";
type Difficulty = "easy" | "medium" | "hard" | "jazz";
type ChordFamily = "major" | "minor" | "dominant" | "altered" | "suspended" | "diminished";

interface NoteConfig { note: string; topic?: string; }               // pitch class only, e.g. "C#" — octave picked at play time
interface IntervalConfig { semitones: number; playMode: "harmonic" | "melodic"; topic?: string; }
interface ChordConfig { type: ChordType; family?: ChordFamily; topic?: string; inversion?: number; } // inversion: 0=root,1/2/3=inversions; undefined→voicings apply instead
interface ProgressionConfig { key: string; chords: string[][]; romanNumerals: string[]; tempo: number; topic?: string; }
interface ScaleConfig { type: ScaleType; topic?: string; }

interface Exercise {
  id: number; category: Category; title: string; prompt: string; difficulty: Difficulty;
  config: ExerciseConfig; choices: string[]; answer: string; explanation: string | null;
  createdAt: number; updatedAt: number; // unix seconds
}
```

`CATEGORY_META` (label/description/emoji/color per category) and `CATEGORY_TOPICS` (per-category topic list with id/label/color, used for practice filtering) are also in this file — drive both the Navbar category icons and the category browse page's "By Topic" section.

`ChordType`/`ScaleType` are keys of `CHORD_TYPES`/`SCALE_TYPES` in `lib/audio/theory.ts` (huge maps of semitone-interval arrays — ~35 chord types from triads through altered jazz extensions, ~20 scale types covering major modes, minor variants, pentatonic/blues, melodic minor modes, symmetric scales).

### DB schema (`lib/db/schema.ts`)

```
exercises:      id, category(enum), title, prompt, difficulty(enum), config(json text),
                choices(json text), answer, explanation(nullable), createdAt, updatedAt
users:          id, email(unique), passwordHash, googleId(unique), name, nickname, avatarUrl, createdAt
sessions:       id, sessionToken, exerciseId→exercises(cascade), userId→users(set null), answered, correct, createdAt
feedback:       id, userId→users(set null), name, email, message, createdAt
adminUsers:     id, email(unique), passwordHash
dailyPuzzles:   id, puzzleDate(unique "YYYY-MM-DD"), category, difficulty, exerciseId→exercises(restrict),
                exerciseSnapshot(json — immutable copy of title/prompt/config/choices/answer), performanceParams(json),
                source(enum "pool", default), createdAt
dailyAttempts:  id, puzzleId→dailyPuzzles(cascade), userId→users(set null), sessionToken, category, difficulty,
                exerciseId→exercises(restrict), exerciseType(nullable), topic(nullable), guesses(json array, default "[]"),
                status(enum in_progress/won/lost, default in_progress), finalGuessCount, finishedAt, createdAt, updatedAt
                — partial unique indexes: one row per (puzzleId,userId) where userId not null,
                  one row per (puzzleId,sessionToken) where userId is null
streaks:        id, userId→users(cascade, nullable), sessionToken, kind(enum exercise/daily),
                currentStreak, longestStreak, updatedAt
                — same dual-identity partial-unique-index pattern as dailyAttempts
```

**Identity pattern to reuse**: guest users get a random UUID stored in `localStorage["eardle_session"]` (created lazily, e.g. `ExercisePlayerWrapper.tsx`'s `getOrCreateSessionToken()`). Every progress-tracking table keys off **either** `userId` (signed in) **or** `sessionToken` (guest) via partial unique indexes — never requires both. `/api/user/migrate-progress` re-parents guest rows to a userId after sign-in/sign-up. This is the established pattern for anything needing "progress persists across visits, works for guests too" (directly relevant to lesson progress tracking).

### Exercise rendering pipeline

- `components/exercise/ExercisePlayer.tsx` — main player: play button, per-category controls (interval play-mode buttons, scale/progression speed control, chord bass/arpeggio buttons, piano/synth instrument toggle), streak badge, choice grid, feedback banner, staff notation reveal after answering, keyboard shortcuts (Space=play, 1-9=select, Enter/N=next).
- `components/exercise/ChoiceGrid.tsx` — renders `choices: string[]` as buttons, colors by correct/wrong/tried-wrong state, handles flat/sharp enharmonic display labels for note choices.
- `components/exercise/PlayButton.tsx`, `FeedbackBanner.tsx` — presentational.
- `components/exercise/{Chord,Interval,Scale,Progression}Staff.tsx` — each lazy-loads `vexflow`, renders on a literal `bg-white` wrapper (deliberately NOT theme-tokenized — sheet music needs real white paper in both themes).
- `components/exercise/ErrorBoundary.tsx` — wraps the player.

### Routing (`app/(exercises)/[category]/...`)

- `[category]/page.tsx` — browse page: "By Difficulty" list + "By Topic" grid (topic tiles use fixed solid Tailwind colors from `CATEGORY_TOPICS`, not theme tokens — legible on any background) + links to Custom Package.
- `[category]/[id]/page.tsx` — server component, loads one exercise row, computes `nextHref` (browse mode = random same-category exercise; practice mode = back to `/practice` redirect endpoint with accumulated exclude-list). **Also**: when `ids` search param has 2+ ids (custom package session), re-queries all those exercises' `answer` values and overwrites `exercise.choices` with the deduped set — so package practice quizzes only among what the user actually picked, not the category's full default choice list. Renders `SharePackageButton` next to a "Practice Mode" badge when `ids` is present.
- `[category]/[id]/ExercisePlayerWrapper.tsx` — client wrapper: session token, choice-shuffling (skipped for note/interval — their order is semantically meaningful), streak fetch, `eardle_result_${id}` localStorage write on answer.
- `[category]/practice/page.tsx` — pure redirect logic, no UI of its own except two edge-case screens (topic-set-no-difficulty sub-picker; no-exercises-found). Picks a random exercise matching `{difficulty, topic}` OR `{ids}` (custom package pool fully overrides difficulty/topic filtering), excluding an accumulating `exclude` id list threaded through the URL; resets the exclude list once the pool is exhausted (cycles).
- `[category]/practice/custom/page.tsx` + `components/exercise/CustomPackagePicker.tsx` — "Custom Package" picker. Loads ALL exercises for the category, groups into `PickerItem`s by difficulty (collapsing duplicate seed rows sharing identical title+config into one checkbox with multiple underlying ids), sorted alphabetically within each difficulty group. Selection state is a `Set<number>` of exercise ids. **"Share Package" feature (this session)**: `?ids=1,2,3` on this page URL pre-populates the selection (filtered against ids that actually exist for this category — stale ids silently dropped); a "🔗 Share Package" button copies `{origin}/{category}/practice/custom?ids=...` to clipboard with a transient "✅ Copied!" state. "Start Practicing" navigates to `/practice?ids=...`.
- `components/exercise/SharePackageButton.tsx` — same share-link pattern, rendered on the exercise page itself during an active package session (not just the picker).

**Key takeaway for lessons integration**: a "package" is *entirely* representable as `category + ids[]` in a URL querystring — no DB entity backs it. Any lesson wanting to link to "practice this specific set" can just build/store that URL shape directly; no new schema needed for that alone.

## 3. Admin Panel

- Route group `app/admin/(protected)/` — layout.tsx queries category/topic counts, renders `AdminSidebar` + children. `app/admin/login/page.tsx` sits outside the protected group.
- **Auth guard**: `middleware.ts` checks for a NextAuth session cookie by name (`authjs.session-token` / `__Secure-authjs.session-token` / `next-auth.session-token`) — deliberately NOT calling `auth()`, because `bcryptjs` can't run on the Edge runtime middleware executes in. This is presence-only (doesn't verify role=admin); actual admin-only enforcement happens in the page/API layer via `auth()` + role check.
- Pages: `(protected)/page.tsx` (dashboard), `exercises/page.tsx` (table, `AdminExerciseBrowser`/`ExerciseTable`), `exercises/new/page.tsx`, `exercises/[id]/edit/page.tsx` (both use `ExerciseForm`), `feedback/page.tsx` (`AdminFeedbackBrowser`), `stats/page.tsx`.
- `components/admin/ExerciseForm.tsx` — single form for all 5 categories; swaps in a per-category `ConfigFields/{Note,Interval,Chord,Progression,Scale}Config.tsx` component; has `DEFAULT_CHOICES`/`DEFAULT_PROMPTS`/`DEFAULT_CONFIGS` per category baked in as constants; "▶ Preview" button plays audio directly via `audioEngine` + `randomRoot()` (same engine exercises use). Choices edited as newline-separated textarea.
- `components/admin/VoicingInspector.tsx`, `StaffNotation.tsx` — chord voicing preview / notation preview helpers used within `ConfigFields/ChordConfig.tsx`.
- **Admin panel styling was explicitly excluded from this session's theme rework** — still 100% hardcoded dark (`bg-gray-950`, `bg-gray-900`, `text-gray-400`, etc.), uses the legacy `.label`/`.input` CSS classes. It does NOT react to the light/dark toggle at all. Any new admin UI for lesson management needs an explicit decision: match this legacy dark-only style for consistency with existing admin pages, or bring it into the new token system (which would mean admin becomes the first theme-aware admin UI, diverging from the rest of `/admin`).
- No content/CMS-style admin exists anywhere yet — exercises are the only admin-editable content type today.

## 4. Audio Engine

- **Singleton**: `lib/audio/engine.ts` exports `audioEngine` (null on server, instantiated once per tab on client). Wraps a Tone.js `Sampler` (Salamander Grand Piano, samples fetched from `https://tonejs.github.io/audio/salamander/`, no bundled audio) and a `PolySynth` as a second selectable instrument ("piano" | "synth").
- Lazy sample loading (`loadSamples()`/`warm()`) can start pre-gesture (decode doesn't need an active AudioContext); actual sound output (`ensureStarted()`) is gesture-gated per browser autoplay policy, called from within any `play*()`.
- Public methods: `playNote(note, duration?)`, `playInterval(noteA, noteB, mode)`, `playNotes(notes[])`, `playChord(root, type, voicing?)`, `playProgression(chords[][], tempo, tempoMult?)`, `playArpeggio(notes[], noteGap?)`, `playScale(root, type, noteGap?)`, `stop()`. All scheduling done via `Tone.getContext().setTimeout` with pending-timeout tracking so `stop()`/`_cancelPending()` can truly silence a multi-note sequence mid-playback.
- `lib/audio/theory.ts` — pure music-theory functions, no Tone.js dependency: `buildChord(root, type)`, `buildScale(root, type)`, `addSemitones(note, semitones)` (diatonically-correct respelling, not just chromatic), `randomRoot(minOctave?, maxOctave?)`, `randomOctaveNote(name, minOctave?, maxOctave?)`, `applyVoicing(notes, voicingId)` (close/open/spread/wide), `applyInversion(notes, n)`, `getVoicings(type)`, `randomVoicing(type)`, `parseNote(str)`. `CHORD_TYPES`/`SCALE_TYPES` are the canonical semitone-interval source of truth.
- `hooks/useAudio.ts` — the React hook every player uses: exposes `play(exercise, playModeOverride?, speedLevel?, forcedParams?, chordMode?)`, `stop`, `isPlaying`, `isLoadingSamples`, `playedNotes`, `lastPlayedMode`, `instrument`, `setInstrument`. Handles per-exercise-instance caching of randomized root/voicing/delta (via `exerciseIdRef`/`randomizedRef`) so replaying the same exercise instance sounds identical, but a new exercise gets fresh randomization. Category-specific playback branches for note/interval/chord/progression/scale live here.

**For lesson "play this example" buttons**: reuse `audioEngine` methods directly for simple one-off illustrative playback (e.g. `audioEngine.playChord("C4", "major")` to demonstrate a C major triad) — don't need the full `useAudio` hook/exercise-object machinery unless the example needs the same replay-caching/instrument-switching behavior a real exercise gets. `lib/audio/theory.ts`'s `buildChord`/`buildScale`/`addSemitones` are what any lesson diagram or written example would use to compute actual note names to display/play.

## 5. UI Components & Patterns

- `components/ui/Navbar.tsx` — persistent client component, sticky top, beta banner, desktop icon row (category icons + Daily + utility/auth icons including the theme toggle) with `NavIcon`/`NavIconButton` reusable primitives (icon + hover tooltip), separate mobile hamburger dropdown. Reads `CATEGORY_META` to render category icons/links dynamically — a new top-level nav section (e.g. "Lessons") would be added here following the same `NavIcon` pattern, not hardcoded per-category.
- `components/ui/Modal.tsx` — generic modal shell (backdrop, centered panel, optional `topLeft` slot, close button, Escape-to-close), used by `StatsModal` etc. Reusable for any lesson-related modal (e.g. a lesson completion celebration).
- `components/ui/CategoryCard.tsx` — gradient-tile card for the 5 exercise categories on the homepage, color keyed off `CATEGORY_META[category].color` through a hue-remapping table (this session remapped the literal indigo/violet/purple/fuchsia/pink hue names to visually-distinct blue/teal/amber/rose/emerald so they don't blend into the now-purple page background).
- `components/ui/DailyHeroCard.tsx` — the Daily EarDle homepage promo card, distinct orange/gold gradient (deliberately different from both the page purple and the category card hues) — useful precedent for how to visually promote a new "Lessons" section on the homepage without clashing.
- `components/ui/InfoTooltip.tsx` — click/hover tooltip (used for "i" info icons), reusable for inline lesson glossary-style tooltips.
- `components/Providers.tsx` — root client provider nesting (`SessionProvider` → `ThemeProvider`).

## 6. Navigation Conventions & Daily EarDle Precedent

- App Router route group `app/(exercises)/` groups the 5 practice-flow routes without adding a URL segment.
- `CATEGORY_META`/`CATEGORY_TOPICS` (types/exercise.ts) are the single source of truth driving: Navbar category icons, homepage `CategoryCard`s, category browse page difficulty/topic sections. A parallel `LESSON_META`-style constant (if lessons get their own top-level categories/subjects) would likely want the same "one object drives nav + browse + everything" pattern.
- **Daily EarDle** (`app/daily/`) is the closest existing precedent for "a whole separate feature bolted onto the exercise system": it has its own top-level route, its own Navbar icon + streak badge, its own DB tables (`dailyPuzzles`/`dailyAttempts`) that *reference* `exercises` rather than duplicating exercise data, its own stats modal, and reuses `useAudio`/`ChoiceGrid`/staff components from the regular exercise system rather than reimplementing them. A "Lessons" feature would likely follow the same shape: new top-level route + Navbar entry, new tables that reference (not duplicate) `exercises` for practice links, reuse of existing player/audio/UI components.

## 7. Auth & Progress Tracking

- NextAuth v5, JWT strategy, Credentials (bcrypt-hashed passwords, checked against both `adminUsers` and `users` tables) + Google OAuth (auto-creates/links a `users` row on first sign-in). Session callback exposes `id`, `role` ("admin"|"user"), `nickname`, `avatarUrl` on `session.user`.
- Guest identity: `localStorage["eardle_session"]` UUID, minted lazily, never overwritten if one already exists.
- Progress persistence today: `sessions` table (one row per exercise answer, correct/incorrect), `streaks` table (current/longest streak per `kind` — "exercise" or "daily" — per identity). `/api/streaks` (GET) returns both kinds' current/longest for whichever identity (userId if signed in, else token param). `/api/user/stats` presumably aggregates `sessions` by category (not read this session, but referenced from `app/dashboard/page.tsx` — verify before relying on its exact shape if building lesson-progress aggregation alongside it).
- `/api/user/migrate-progress` — re-parents guest-token rows to a `userId` after sign-in/sign-up, called from `signin`/`signup` pages and `dashboard` on load. This is the mechanism any new "lesson progress" table must also plug into if it wants guest progress to survive a later sign-up.

## Open Questions Flagged for the Design Phase (not decisions — just noted gaps)

- No existing content-authoring system (Markdown/MDX/CMS) exists anywhere in this codebase — lessons content storage is a fully greenfield decision.
- `app/api/user/stats/route.ts` was not read this session — verify its exact response shape before building lesson-progress dashboards that might want to sit alongside it.
- No i18n/SEO metadata patterns beyond the basic `metadata` export in `app/layout.tsx` were inspected in depth — worth a closer look if lessons need strong SEO (public educational content is often a bigger SEO surface than a practice tool).

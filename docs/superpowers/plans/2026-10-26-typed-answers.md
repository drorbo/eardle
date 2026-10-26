# Typed Answers Implementation Plan

> **For agentic workers:** Execute task-by-task; steps use checkbox syntax.

**Goal:** In practice mode on hard/jazz exercises, let the user type the answer (no option list) with a live "recognized as" chip.

**Architecture:** A pure normalizer (`lib/answers/normalize.ts` + data-only `aliases.ts`) resolves typed text to a canonical answer label against the category vocabulary passed from the server page. A `TypedAnswer` client component renders input + chip; `ExercisePlayer` gates it and feeds the resolved label into the existing `handleSelect`.

**Tech Stack:** Next.js 16 / React 19, TypeScript, `tsx --test` (node:test), Tailwind v4.

Spec: `docs/superpowers/specs/2026-10-26-typed-answers-design.md`

---

### Task 1: Matcher (TDD)

**Files:** Create `lib/answers/normalize.ts`, `lib/answers/aliases.ts`, `lib/answers/normalize.test.ts`; modify `package.json` (`test:answers`).

- [ ] Write `normalize.test.ts` first: fixtures = a snapshot of the real hard/jazz/easy answer vocabularies per category; tests for self-resolution of every label, per-category common spellings (`maj7`, `Cmaj7`, `dom7`, `7`, `m7b5`, `ø`, `7#9`, `dom7#9`, `m9` vs `M9`, `db`, `ii v i`, `iim7b5 V7b9 im7`, `dorian`, `D dorian`, inversion phrases), typo → `suggest` (`Dorain`), and `none` for nonsense; `m9` must never resolve to Major 9th.
- [ ] Run `npm run test:answers` — expect failures (module missing).
- [ ] Implement `aliases.ts` (per category: canonical label → raw spellings) and `normalize.ts` (`prep` → `keyOf` → vocabulary/alias map → dom-prefix variants → root-prefix → inversion parser → progression tokenizer → Levenshtein suggest).
- [ ] Run tests until green; `npx tsc --noEmit`.
- [ ] Commit.

### Task 2: Server wiring

**Files:** modify `app/(exercises)/[category]/[id]/page.tsx`, `ExercisePlayerWrapper.tsx`.

- [ ] In `page.tsx`, `SELECT DISTINCT answer FROM exercises WHERE category = X` → `answerVocabulary`; pass to wrapper → player.
- [ ] `npx tsc --noEmit`.

### Task 3: UI

**Files:** create `components/exercise/TypedAnswer.tsx`; modify `components/exercise/ExercisePlayer.tsx`.

- [ ] `TypedAnswer`: `<form>`; input (`autocapitalize/autocorrect off`, `spellCheck=false`, `enterKeyHint="send"`, aria-label); `aria-live="polite"` chip with the four states; Submit button disabled unless `match`/`suggest`; Enter submits resolved label.
- [ ] `ExercisePlayer`: `typedEligible = isPracticeMode && (hard|jazz) && answerVocabulary`; `answerMode` state from `localStorage["eardle-answer-mode"]`; segmented `Buttons | Type` control above the grid (hidden once answered); in `type` mode and not answered render `TypedAnswer` instead of `ChoiceGrid`; after answering always render the grid. Disabled while `idle`; focus input on `ready` when `(pointer: fine)`.
- [ ] `tsc` + eslint on touched files (no new errors).

### Task 4: Checkpoint (project rule)

- [ ] `npm run dev` (Docker Postgres up). For each category on hard/jazz, practice mode: type correct, wrong-but-valid, typo, nonsense; confirm `/api/sessions` body carries the canonical label, no request for unrecognized input, compare grid appears after.
- [ ] Mobile 390px + desktop screenshots; console clean; Lighthouse accessibility.
- [ ] Hand to user to test locally; deploy only on their confirmation.

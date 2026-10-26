# Compare Answers — Implementation Plan

Spec: `docs/superpowers/specs/2026-10-26-compare-answers-design.md`

Read `node_modules/next/dist/docs/` for route handler conventions before step 5.

1. **Resolver** — `lib/exercises/choiceVariants.ts`
   - `getChoiceVariants(exercise)`: query same-category exercises with `answer IN choices`; pick per label: same difficulty first, then lowest id; the correct answer maps to `exercise.config`. Export `ChoiceVariants` type. Pure picker function separated from the query so it's unit-testable.
   - `lib/exercises/choiceVariants.test.ts` (`tsx --test`, pattern as `lib/googleAccount.test.ts`) for the picker; add `test:variants` script.

2. **Playback** — `hooks/useAudio.ts`
   - Add `playVariant(exercise, config, speedLevel)`; return it from the hook, plus `previewingKey`-style state if needed for the playing highlight.
   - Per-category table in the spec; voicing fallback via `getVoicings`.
   - Must not mutate `randomizedRef` / `playedNotes`.

3. **Grid** — `components/exercise/ChoiceGrid.tsx`
   - New optional props: `previewable?: Set<string> | string[]`, `onPreview?`, `previewing?`.
   - When `onPreview` is set and `answer` is set: click → `onPreview`, show ▶, keep 44px height and colors.

4. **Practice player** — `ExercisePlayer.tsx`, `ExercisePlayerWrapper.tsx`, `[id]/page.tsx`
   - `page.tsx`: `getChoiceVariants` → prop → Wrapper → Player.
   - Player: after answered, pass `onPreview` (calls `playVariant`), stop calling `handleSelect` after answered, 1–9 keys preview when answered, caption "Tap any option to hear it".

5. **Daily** — `app/api/daily/variants/route.ts`, `hooks/useDailyPuzzle.ts`, `app/daily/DailyPuzzlePlayer.tsx`
   - Route: identify caller like `/api/daily/guess`; 403 unless attempt status is won/lost; return `getChoiceVariants(snapshot)`.
   - Hook/player: fetch once when `finished`; pass `onPreview` using `state.performanceParams` as the forced params.

6. **Checkpoint (project rule)**
   - `npx tsc --noEmit`, `npm run lint`, `npm run test:variants`.
   - Browser, `npm run dev`: for each category answer wrong, tap every option; confirm audio, no console/hydration errors; confirm no extra `/api/sessions` POST after answering.
   - Daily: confirm `/api/daily/variants` 403s before finishing and that the pre-finish payload is unchanged.
   - Screenshots at ~390px and desktop; Lighthouse accessibility pass on an exercise page and `/daily`.

Docs: no deploy-order constraints (no schema change, no Jam Gym / auth files touched).

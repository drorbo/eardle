# Admin panel / public site CSS token merge — implementation plan

See design spec: `docs/superpowers/specs/2026-08-17-admin-public-css-merge-design.md` for the full class mapping table and decisions. This plan just splits the ~20 files into independent batches (no shared state between them beyond the mapping table itself) and defines the finishing steps.

## Batches (independently executable, apply the spec's mapping table exactly — no new design decisions)

**A — Shell** (rendered on every admin page, do first so later screenshots reflect it):
- `app/admin/login/page.tsx`
- `app/admin/(protected)/layout.tsx`
- `components/admin/AdminSidebar.tsx`
- `app/admin/(protected)/stats/page.tsx`

**B — Exercise browse/detail/table:**
- `components/admin/AdminExerciseBrowser.tsx`
- `components/admin/ExerciseDetail.tsx`
- `components/admin/ExerciseTable.tsx` (includes the `DIFFICULTY_COLORS` → `HUES` swap)
- `app/admin/(protected)/exercises/page.tsx` (check for own styling beyond the wrapper; likely minimal)

**C — Exercise form + config fields:**
- `components/admin/ExerciseForm.tsx`
- `components/admin/ConfigFields/ChordConfig.tsx`
- `components/admin/ConfigFields/ScaleConfig.tsx`
- `components/admin/ConfigFields/IntervalConfig.tsx`
- `components/admin/ConfigFields/NoteConfig.tsx`
- `components/admin/ConfigFields/ProgressionConfig.tsx`
- `components/admin/VoicingInspector.tsx`
- `components/admin/StaffNotation.tsx`
- `app/admin/(protected)/exercises/new/page.tsx`
- `app/admin/(protected)/exercises/[id]/edit/page.tsx`

**D — Feedback:**
- `components/admin/AdminFeedbackBrowser.tsx`
- `app/admin/(protected)/feedback/page.tsx`

## Finishing steps (after all batches land)

1. `grep -rn "\.label\b\|\bclassName.*\binput\b" app/admin components/admin` (and similar) to confirm no `.label`/`.input` references remain anywhere.
2. Delete the `.label`/`.input` utility classes and their "do not theme" comment from `app/globals.css`.
3. `npx tsc --noEmit` — must pass clean.
4. `npm run build` — must succeed (catches any Tailwind class typos the type checker can't).
5. Checkpoint: screenshot `/admin/exercises` (or another representative admin page) at mobile (~390px) and desktop width, in both light and dark mode; read browser console for errors/hydration warnings; run `lighthouse_audit` a11y pass.
6. Commit.

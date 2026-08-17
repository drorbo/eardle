# Admin panel / public site CSS token merge — design spec

**Date:** 2026-08-17
**Why:** the 2026-08-11 dev-process audit flagged the admin panel as "deliberately excluded from the CSS token system... a permanent, documented-but-unresolved visual fork" (hardcoded `bg-gray-900`-style classes + separate `.label`/`.input` vs the public `.field-label`/`.field-input`). A follow-up survey (2026-08-17) found the fork is actually *mid-migration*: the Lessons subtree (`app/admin/(protected)/lessons/**`, `LessonForm.tsx`, `BlockEditor.tsx`, `TopicManager.tsx`, `DeleteButton.tsx`) already uses the public token system; the Exercises subtree + admin shell (login, layout, sidebar, stats, feedback, exercise browser/table/detail/form, all 5 `ConfigFields/*`, `VoicingInspector`, `StaffNotation`) still hardcodes a dark-only gray palette — roughly 150-220 className edit sites across ~20 files.

**Decision (confirmed with user):** full merge. The admin panel adopts the public site's actual theme-aware tokens — same `bg-bg`/`bg-surface`/`bg-surface-2`/`border-border(-subtle)`/`text-text*` classes from `app/globals.css`, same `.field-label`/`.field-input`. Admin becomes light/dark-theme-aware like every other page, instead of permanently dark. The already-migrated Lessons subtree is the reference implementation — new work should match its conventions exactly, not invent new ones.

## Class mapping

| Old (hardcoded) | New (token) | Notes |
|---|---|---|
| `bg-gray-950` | `bg-bg` | page background (layout shell) |
| `bg-gray-900`, `bg-gray-900/50` | `bg-surface`, `bg-surface/50` | card/panel surface, table row hover |
| `bg-gray-800`, `/30` `/50` `/60` | `bg-surface-2` (+ same opacity) | secondary surface, input bg, toolbar controls |
| `bg-gray-700` (secondary "active" state, not primary nav) | `bg-surface-2` | e.g. Stats/Feedback active sidebar item, category-active-without-topic state |
| `text-white` | `text-text` | primary text |
| `text-gray-300` | `text-text-secondary` | |
| `text-gray-400` | `text-text-muted` | |
| `text-gray-500` | `text-text-subtle` | |
| `text-gray-600` | `text-text-faint` | |
| `border-gray-800`, `border-gray-800/40` `/50` | `border-border-subtle` (+ same opacity) | dividers, card borders |
| `border-gray-700` | `border-border` | stronger dividers, where used |
| `.label` / `.input` | `.field-label` / `.field-input` | delete the old utility classes from `globals.css` once no file references them |

**Keep as-is (already the established cross-site accent, matches the Lessons subtree precedent — do not re-theme):**
- `bg-indigo-600 hover:bg-indigo-500 text-white` — primary buttons, primary active nav item (All Exercises / Lessons tabs)
- `text-indigo-400 hover:text-indigo-300` / `text-indigo-500 hover:text-indigo-400` — links, "+ New" actions
- `bg-indigo-600/50 text-indigo-200` — active-topic tint in sidebar
- `focus:ring-indigo-500` — already baked into `.field-input`

**Difficulty badges** (`ExerciseTable.tsx`'s `DIFFICULTY_COLORS`, and the matching badge in `ExerciseDetail.tsx`/`ExerciseForm.tsx` if present): replace the hand-written map — which has a pre-existing bug where `hard` and `jazz` both render amber — with `lib/design/palette.ts`'s `HUES`, per the AGENTS.md rule that grouping colors must come from that shared table:

```ts
const DIFFICULTY_HUE: Record<Difficulty, Hue> = {
  easy: "emerald",
  medium: "amber",
  hard: "rose",
  jazz: "fuchsia",
};
// badge className: clsx("px-2 py-0.5 rounded-full text-xs font-medium capitalize", HUES[DIFFICULTY_HUE[difficulty]].tint, HUES[DIFFICULTY_HUE[difficulty]].ringText)
```

**Danger (delete buttons, error states):** no danger token exists in the site yet. Standardize on the same light/dark red pairing already used elsewhere in the app (`ChoiceGrid`/`StatsGrid`'s wrong-answer styling) rather than inventing a third variant: `bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/50 dark:hover:bg-red-800 dark:text-red-300`.

**Success (correct-answer highlight in `ExerciseDetail`):** same reasoning — reuse the existing `bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400` pairing already established by `ChoiceGrid`, not a new one.

## Out of scope

- The public `app/(exercises)/[category]/page.tsx` difficulty-dot colors (raw green/yellow/red/amber, not using `HUES` either) — a separate, pre-existing instance of the same anti-pattern, not part of the admin/public fork this task targets. Noted for a future cleanup pass, not fixed here.
- `app/admin/(protected)/page.tsx` and the pure data-fetch wrapper shells (`exercises/page.tsx`, `feedback/page.tsx` bodies) — negligible/no own styling, skip.
- Any visual redesign beyond a 1:1 token substitution — this is a merge, not a restyle. Layout, spacing, and copy stay identical.

## Verification

After implementation: `tsc --noEmit`, then the standard checkpoint (screenshot an admin page at mobile ~390px and desktop width, in both light and dark mode since admin is now theme-aware for the first time; console check for errors/hydration warnings; `lighthouse_audit` a11y pass).

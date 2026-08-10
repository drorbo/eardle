# Lesson Playback Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the lesson playback panel (staff + piano keyboard) from a sticky-top panel with a hardcoded offset to a fixed-bottom dock, always expanding on every play so it's visible regardless of scroll position, per `docs/superpowers/specs/2026-08-10-lesson-playback-dock-design.md`.

**Architecture:** Single-component positioning/behavior rewrite of `LessonPlaybackPanel.tsx` (fixed instead of sticky, CSS grid-rows height animation, simplified always-expand-on-play effect, flipped chevron) plus one small padding addition on the lesson page so the always-visible collapsed bar never permanently covers page content. `useTheoryPlayback`, `Staff`, and `PianoKeyboard` are unchanged.

**Tech Stack:** Next.js 16 App Router, TypeScript, React, Tailwind CSS v4 (arbitrary-value utilities for the grid-rows animation and `env(safe-area-inset-bottom)`). **No test runner exists in this repo** — this plan uses `npx tsc --noEmit` after each file change instead of a test-first cycle, and ends with `npm run build` plus manual browser verification.

---

## File Structure

- `components/lesson/LessonPlaybackPanel.tsx` — **rewritten**. Same component, same props (`{ playback: TheoryPlayback }`), same three states (nothing played yet / collapsed with a label / expanded with staff+keyboard) — only the positioning, expand-trigger logic, animation, and chevron direction change.
- `app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx` — **small edit**. One class added to the existing content wrapper div.

No changes to `hooks/useTheoryPlayback.ts`, `components/theory/Staff.tsx`, `components/theory/PianoKeyboard.tsx`, `components/lesson/LessonBlocks.tsx` (still renders `<LessonPlaybackPanel playback={playback} />` exactly as today — not touched by this plan), or any other file.

---

### Task 1: Reposition and simplify `LessonPlaybackPanel`

**Files:**
- Modify: `components/lesson/LessonPlaybackPanel.tsx` (full rewrite, current file is 65 lines)

- [ ] **Step 1: Replace the file contents**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { TheoryPlayback } from "@/hooks/useTheoryPlayback";
import { PianoKeyboard } from "@/components/theory/PianoKeyboard";
import { Staff } from "@/components/theory/Staff";
import { selectClef } from "@/lib/audio/lessonPlayback";

export function LessonPlaybackPanel({ playback }: { playback: TheoryPlayback }) {
  const [expanded, setExpanded] = useState(false);

  const { activeExample, resolvedEvents, activeNoteKeys, playNoteDirect } = playback;

  // Expand on every play, not just the first — the piano must be visible
  // whenever an example is playing, no matter where the user has scrolled
  // to. This fires every time because useTheoryPlayback's request() sets a
  // brand-new activeExample object on every call (even a replay of the
  // same example), so this effect's dependency always changes.
  useEffect(() => {
    if (activeExample) setExpanded(true);
  }, [activeExample]);

  const announcement = activeExample ? `Playing: ${activeExample.label}` : "";
  const visibleNotes = resolvedEvents.flatMap((e) => e.notes);
  const clef = selectClef(resolvedEvents);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle surface-elevated overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0">
      <div aria-live="polite" className="sr-only">{announcement}</div>

      <div className="flex items-center justify-between gap-2 px-3 py-0.5">
        {!expanded && (
          <p className="text-xs text-text-subtle truncate min-w-0">
            {activeExample ? activeExample.label : "Tap ▶ Play below to see it here"}
          </p>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse keyboard and staff" : "Expand keyboard and staff"}
          aria-expanded={expanded}
          className="flex-shrink-0 ml-auto w-6 h-6 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition flex items-center justify-center text-base"
        >
          {/* Bottom-anchored dock expands upward, so collapsed points up
              (⌃, "tap to open upward") and rotates to point down when
              expanded (inviting you to close it back down) — opposite of
              the old top panel's down-by-default chevron. */}
          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>⌃</span>
        </button>
      </div>

      {/* CSS grid-rows height animation: 0fr collapses the row to zero
          height (with the inner overflow-hidden clipping its content),
          1fr expands it to the content's natural height. Content stays
          mounted at all times (not conditionally rendered) so the
          transition has something to animate to/from — this is what
          makes the grid-rows technique work without measuring pixel
          heights in JS. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-1 space-y-0.5 border-t border-border-subtle pt-0.5">
            {resolvedEvents.length > 0 ? (
              <Staff events={resolvedEvents} activeNoteKeys={activeNoteKeys} onNoteClick={playNoteDirect} clef={clef} />
            ) : (
              <p className="text-xs text-text-subtle text-center py-2">
                Tap a ▶ Play button below to see it here.
              </p>
            )}

            <PianoKeyboard activeNotes={activeNoteKeys} onKeyPlay={playNoteDirect} visibleNotes={visibleNotes} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/lesson/LessonPlaybackPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/lesson/LessonPlaybackPanel.tsx
git commit -m "Reposition lesson playback panel as a fixed bottom dock"
```

---

### Task 2: Reserve space so the dock never permanently covers page content

**Files:**
- Modify: `app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx:48`

- [ ] **Step 1: Add bottom padding to the content wrapper**

Change:
```tsx
  return (
    <div className="max-w-2xl">
```
to:
```tsx
  return (
    <div className="max-w-2xl pb-20">
```

This reserves enough space below the practice CTA / prev-next links (rendered by `LessonProgressPanel` at the bottom of this same file) that the collapsed dock — which is `fixed` and therefore removed from normal document flow — never permanently sits on top of them. The dock's *expanded* state is allowed to temporarily overlay content while in use; only the always-visible collapsed bar needs guaranteed clearance.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx"
git commit -m "Reserve bottom padding on lesson pages for the fixed playback dock"
```

---

### Task 3: Full build + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Full production type-check + build**

Run: `npm run build`
Expected: build succeeds with no type or lint errors in either touched file.

- [ ] **Step 2: Confirm/start the dev server**

Run: `netstat -ano | findstr ":3000"` — if a `next dev` process is already listening (likely, from earlier work this session), reuse it. Otherwise run `npm run dev`.

- [ ] **Step 3: Browser walkthrough**

Using the Chrome browser tool, open any lesson with multiple audio examples spread through its body (e.g. `/learn/scale-degrees-movable-do/hearing-scale-degrees`, or any lesson with 3+ `AudioExamplePlayable` blocks) and confirm each item from the spec's Verification section:

1. On page load, the dock appears as a slim collapsed bar at the bottom (full-width on a normal browser window — desktop-width behavior; see Step 5 for the narrow-viewport check), showing "Tap ▶ Play below to see it here".
2. Scroll to the very bottom of the lesson (past the practice CTA / prev-next links) without tapping anything: confirm nothing is hidden behind the collapsed dock — the practice CTA and prev/next links are fully visible and clickable above it.
3. Tap a Play pill near the *bottom* of the lesson without scrolling up: confirm the dock expands (staff + keyboard become visible) without needing to scroll — it's already on-screen since it's fixed to the viewport.
4. Manually collapse the dock via the chevron (now pointing up, ⌃, when collapsed), then tap a *different* Play pill: confirm it re-expands (not just the first play — every play).
5. Watch the expand/collapse transition: confirm it animates smoothly (grows/shrinks over ~300ms) rather than snapping instantly.
6. Resize to a mobile width (or note if the environment's resize tool is unreliable, per this session's earlier experience) and reload: confirm the dock spans full width flush with the bottom edge, with rounded top corners only.
7. At desktop width, confirm the dock renders as a ~384px (`w-96`) rounded card offset from the bottom-right corner, not full width.
8. Confirm the piano keyboard's own internal horizontal scroll (dragging/scrolling to reach different octaves) still works inside the narrower desktop card.

- [ ] **Step 4: Fix anything found, re-verify, then final commit if any fixes were needed**

If Step 3 surfaces any issue, fix it, re-run `npx tsc --noEmit`, re-check the specific broken item in the browser, then:
```bash
git add -A
git commit -m "Fix issues found during playback dock browser verification"
```
(Skip this step entirely if Step 3 found nothing to fix.)

---

## Self-Review Notes

- **Spec coverage:** Fixed positioning (mobile full-width / desktop floating card) → Task 1. Always-expand-on-every-play simplification → Task 1 (removes `hasAutoExpandedRef` entirely). Grid-rows open/close animation → Task 1. Flipped chevron → Task 1. Bottom padding so collapsed dock never covers content → Task 2. z-index below navbar's `z-50` → Task 1 uses `z-40`. "Nothing else changes" guardrail (`useTheoryPlayback`, `Staff`, `PianoKeyboard`, `LessonBlocks`) → verified by construction, no task touches those files.
- **No placeholders:** both tasks show complete, exact code/diffs — nothing deferred.
- **Type consistency:** `LessonPlaybackPanel`'s props (`{ playback: TheoryPlayback }`) and the `playback` object's destructured fields (`activeExample`, `resolvedEvents`, `activeNoteKeys`, `playNoteDirect`) are unchanged from the current file — confirmed against `hooks/useTheoryPlayback.ts`'s actual return shape (`activeExample, resolvedEvents, activeNoteKeys, isPlaying, request, stop, playNoteDirect`) read directly from source this session, not from memory. No new props introduced, so `LessonBlocks.tsx`'s existing `<LessonPlaybackPanel playback={playback} />` call needs no change.

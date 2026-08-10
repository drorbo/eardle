# Lesson Playback Dock Repositioning — Design Spec

## Problem

`components/lesson/LessonPlaybackPanel.tsx` (the collapsible staff+piano panel
on lesson pages) is `sticky top-[6rem]` — pinned near the top of the
viewport. Two problems:

1. The `6rem` offset is a hardcoded guess at navbar (64px) + beta-banner
   height, not derived from either — it can drift out of alignment (e.g. if
   the beta banner wraps to two lines on a narrow phone).
2. Expanded, it's ~250-300px tall (staff notation + a piano keyboard with
   96px-tall keys). Because it's stuck at the *top*, once expanded it
   permanently occupies a large chunk of the screen — especially on mobile —
   for as long as the user keeps scrolling through the lesson, sitting
   between the navbar and the text they're trying to read.

## Decision

Move it to a fixed dock anchored to the *bottom* of the viewport instead of
the top, so expanding it grows upward over empty space rather than pushing
into the reading area. Only `LessonPlaybackPanel.tsx` changes — no new
components, no changes to `useTheoryPlayback`, `Staff`, or `PianoKeyboard`.

## Design

### Positioning

`position: fixed` replaces `sticky`. No dependency on navbar/banner height
at all — that whole class of drift goes away.

- Mobile (below `sm`): `fixed inset-x-0 bottom-0`, full width, top corners
  only rounded (flush against the bottom edge), `padding-bottom:
  env(safe-area-inset-bottom)` so it clears the home-indicator area on
  notched phones.
- Desktop (`sm:` and up): `sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96`,
  a compact floating card, fully rounded. Same component, same behavior —
  positioning is responsive classes only, not a second implementation.

Because `position: fixed` positions relative to the viewport regardless of
where the element sits in the DOM, the component stays exactly where it is
today in `LessonBlocks.tsx` — no portal, no state lifted up.

### Always expands on play, regardless of scroll position

Requirement: the piano must be visible whenever an example is played, no
matter where the user has scrolled to. Fixed positioning already guarantees
the *dock* is always on-screen; this covers making sure it's *expanded*
(not just the collapsed label bar) every time playback starts.

Simplification vs. today's code: replace the "auto-expand once, then
manual-only forever after" logic (a `hasAutoExpandedRef` guard) with an
unconditional expand on every new play:

```ts
useEffect(() => {
  if (activeExample) setExpanded(true);
}, [activeExample]);
```

This is simpler than what exists today, not more complex — one effect, no
ref. It works because `useTheoryPlayback`'s `request()` calls
`setActiveExample({ playable, label })` with a fresh object on every call
(verified in `hooks/useTheoryPlayback.ts:50`), including replays of the same
example — so the effect fires on every play, not just the first. The manual
collapse toggle (chevron button) is unchanged: the user can still collapse
it between plays; the next play re-expands it.

### Open/close animation

Today's expand/collapse has no transition — the content snaps in/out
instantly, which is part of what reads as "messy." Animate height via a CSS
grid-rows technique (`grid-template-rows: 0fr` → `1fr` on a wrapping div,
`overflow-hidden` on its child), which animates smoothly to the content's
natural height without hardcoding a pixel value. One wrapper div, two
Tailwind classes toggled — no JS height measurement, no animation library.

Because the dock is bottom-anchored, growing it moves the *top* edge up
while the bottom edge stays put — reads as "grows upward" for free, no
extra positioning logic needed.

### Chevron direction

Today: points down by default, rotates to point up when expanded (correct
for a panel that expanded *downward* from the top). Flipped for a
bottom-anchored dock that expands *upward*: collapsed shows ⌃ (invites
opening upward), expanded shows ⌄ (invites closing back down). Same
single-element rotate-on-toggle implementation as today, just swapped glyph
and rotation direction.

### Reserving space so content is always reachable

`fixed` elements are removed from document flow, so the always-visible
collapsed bar (shown even before any Play tap, same as today's "Tap ▶ Play
below to see it here" hint) could otherwise permanently sit on top of the
last thing on the page (practice CTA, prev/next lesson links). Add bottom
padding to the lesson page's content wrapper
(`app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx`), sized to the
collapsed bar's height, so every page's content is fully scrollable past
it. The *expanded* state is allowed to temporarily overlay content while
actively in use (same as a mobile keyboard covering a screen while
typing) — no padding reserved for that taller state.

### z-index

Keep it below the navbar's `z-50` (e.g. `z-40`) — no scenario on this page
where they'd visually compete, but keeps the layering predictable if that
changes later.

## Explicitly not changing

- `useTheoryPlayback.ts` — no changes; `activeExample`'s existing
  fresh-object-per-call behavior is relied on, not modified.
- `Staff.tsx` / `PianoKeyboard.tsx` — rendered exactly as today, just inside
  a differently-positioned container.
- Where `LessonPlaybackPanel` sits in the component tree (still inside
  `LessonBlocks.tsx`, still rendered once per lesson page).
- No backdrop/modal behavior — the dock is non-modal; the page remains
  scrollable and interactive while it's expanded, dismissed only via the
  chevron (consistent with today).

## Files touched

- `components/lesson/LessonPlaybackPanel.tsx` — positioning, animation,
  chevron direction, simplified expand logic.
- `app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx` — bottom padding on
  the content wrapper.

No changes to `hooks/useTheoryPlayback.ts`, `components/theory/Staff.tsx`,
`components/theory/PianoKeyboard.tsx`, or any other file.

## Verification

1. `npm run dev`, open a lesson with multiple audio examples spread through
   the body.
2. Scroll to the very bottom of the lesson, tap a Play pill near the
   bottom — confirm the dock appears/expands and is fully visible without
   scrolling.
3. Scroll back to the top, tap a different Play pill — confirm the dock
   expands again (not just the first time).
4. Manually collapse the dock via the chevron, then tap another Play pill —
   confirm it re-expands.
5. Confirm the collapse/expand transition animates smoothly (no instant
   snap) on both directions.
6. Scroll to the bottom of the lesson (past the practice CTA / prev-next
   links) with the dock collapsed — confirm nothing is hidden behind it.
7. Resize to a mobile width — confirm the dock is full-width, flush with
   the bottom edge, and doesn't visually collide with the browser's own
   bottom chrome/home-indicator area.
8. Resize to a desktop width — confirm the dock renders as a ~384px
   floating card in the bottom-right corner, not full width.
9. Spot-check that the piano keyboard's own internal horizontal scrolling
   (to reach different octaves) still works inside the narrower desktop
   card width.

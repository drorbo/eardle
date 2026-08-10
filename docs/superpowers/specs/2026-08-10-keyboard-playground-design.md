# Keyboard Playground (`/piano`) — Design Spec

## Problem

Users have no way to freely experiment with piano sounds outside of a
specific exercise or lesson. A standalone practice keyboard would also
double as a reusable building block for future exercises.

## Decision

New page at `/piano`, "Keyboard Playground". Built by extending the
existing `components/theory/PianoKeyboard.tsx` (already used by the lesson
playback dock) with a small set of optional, backward-compatible props,
rather than forking a second keyboard implementation.

## Design

### `PianoKeyboard.tsx` extensions

Three new optional props, each defaulting to today's exact behavior so the
lesson playback dock (its only current caller) is completely unaffected:

- `keyScale?: number` (default `1`) — multiplies the module's
  `WHITE_KEY_W`/`BLACK_KEY_W`/`WHITE_KEY_H`/`BLACK_KEY_H` constants. Drives
  the zoom slider.
- `showLabels?: boolean` (default `true`) — wraps the existing note-letter
  `<span>` per key in a conditional. Drives the labels toggle.
- `scrollRef?: React.RefObject<HTMLDivElement | null>` — merged onto the
  same div the component already refs internally (`containerRef`) via a
  callback ref: `(el) => { containerRef.current = el; if (scrollRef)
  scrollRef.current = el; }`. Lets a parent read `scrollWidth`/
  `clientWidth`/`scrollLeft` and call `.scrollTo()`. Drives the pan slider.

Any future exercise wanting a bigger/smaller keyboard, unlabeled keys, or
programmatic pan can reuse these same props — no new component to learn.

### Route & components

- `app/piano/page.tsx` — server component, exports `metadata`, no data
  fetching (this page has no DB dependency). Renders `<KeyboardPlayground
  />`.
- `components/piano/KeyboardPlayground.tsx` — client component owning all
  state: zoom level, pan percentage, `showLabels`, `wide` (rotated mode).
  Renders the keyboard, controls, and (mobile only) the rotate button.

### Audio

Calls `audioEngine.playNote(note)` directly on key press, with a local
flash-highlight (`Map<string, "neutral">` set on press, cleared via
`setTimeout` after ~300ms) — the same lightweight pattern already used for
free-play clicks in `hooks/useTheoryPlayback.ts`'s `playNoteDirect`,
reimplemented locally (~10 lines) rather than importing that whole hook,
which also carries unrelated example-sequencing/staff-notation state this
page doesn't need. Deliberately not shared, to avoid coupling the free-play
keyboard to the lesson-example system.

### Key range

`A0`–`C8` — the full 88-key range of a real piano, since the pan slider's
whole point is having real range to move across.

### Pan slider

`<input type="range">`, 0–100, mapped to `scrollLeft = (value/100) ×
(scrollWidth − clientWidth)`, applied via `scrollRef.current.scrollTo({
left, behavior: "auto" })` (instant — smooth-scrolling during continuous
slider drag would lag). Synced **both ways**: a `scroll` listener on the
container updates the slider's own state when the user drags the keyboard
directly (the keyboard's existing native drag-to-scroll), so the two
controls never show conflicting positions.

### Zoom slider

`<input type="range">`, roughly 0.5×–2.5×, default `1×` (matches today's
fixed size exactly). After a zoom change, once the DOM has the new key
sizes, re-apply the *current pan percentage* against the new `scrollWidth`
(a `useEffect` keyed on the zoom value) so zooming doesn't jump the visible
window to an unrelated part of the keyboard.

### Labels toggle

A switch bound to `showLabels`, passed straight through to `PianoKeyboard`.

### "Rotate for wide view" (mobile only, `sm:hidden`)

A manual CSS trick, not the Screen Orientation API (unreliable — no iOS
Safari support, and Android generally requires fullscreen for it to work
at all). Tapping it applies to the keyboard view:

```css
position: fixed; top: 0; left: 0;
width: 100vh; height: 100vw;
transform-origin: top left;
transform: rotate(90deg) translateY(-100%);
```

This pre-rotates the content so it reads correctly once the user
physically turns their phone 90° — the button doesn't rotate anything by
itself. (Whether it's `rotate(90deg)` or `rotate(-90deg)` will be verified
empirically in the browser during implementation rather than assumed.) In
this mode: title and all controls (pan/zoom/labels) are hidden, replaced
by a single small "Back to portrait" button. Hidden entirely at `sm:` and
up, since rotating 90° on an already-wide desktop window doesn't make
sense — pan/zoom sliders remain available on desktop, just not this
button.

### Entry points

1. **Navbar icon** — new piano-key SVG icon following the existing
   `NavIcon` pattern (`components/ui/Navbar.tsx`), added to both the
   desktop icon row (alongside Daily/Learn/Practice) and the mobile
   dropdown list. Persistent access from any page.
2. **Small home-page link** — *not* a 4th `HomeActionCard` (the existing
   3-card grid is deliberately height-locked on mobile — `h-[calc(100dvh-
   65px)]` with `overflow-hidden` — to fit exactly on one screen without
   scrolling, a specific prior tuning that must not be disturbed). Instead:
   - **Desktop**: a small text link under the existing tagline ("Press
     play, listen carefully, then pick your answer."), same subtle
     styling (`text-text-faint text-sm`): "🎹 Just want to noodle around?
     Try the Keyboard Playground →".
   - **Mobile**: the same link, placed *after* the height-locked hero
     section (outside the `overflow-hidden`/fixed-height container), in
     normal document flow. It requires a small scroll to reach on mobile —
     intentional, since it's explicitly secondary; the 3 primary actions
     remain exactly as immediately visible as they are today. Confirmed
     with the user as acceptable in exchange for not touching the
     existing 3-card tuning.

## Explicitly not changing

- `hooks/useTheoryPlayback.ts`, `components/lesson/LessonPlaybackPanel.tsx`
  — untouched; `PianoKeyboard`'s new props all default to current
  behavior, so its existing caller needs no changes at all.
- The 3-card `HomeActionCard` grid itself (sizing, count, mobile height
  logic) — untouched, only a new element appended after it.
- No new audio engine code — reuses `audioEngine.playNote()` as-is.

## Files touched

- `components/theory/PianoKeyboard.tsx` — add the three optional props.
- `app/piano/page.tsx` — new.
- `components/piano/KeyboardPlayground.tsx` — new.
- `components/ui/Navbar.tsx` — new icon + nav entries (desktop + mobile).
- `app/page.tsx` — small link added, desktop and mobile placements.

No DB/schema/API changes; no changes to any exercise or lesson code paths.

## Verification

1. `npm run dev`, visit `/piano` — confirm a full A0–C8 keyboard renders,
   playable by click/tap and drag (existing `PianoKeyboard` behavior,
   unaffected by the new props at their defaults).
2. Drag the pan slider — confirm the keyboard scrolls accordingly; then
   manually drag the keyboard itself — confirm the pan slider's thumb
   updates to match.
3. Drag the zoom slider — confirm key size changes and the visible window
   stays roughly anchored (doesn't jump to an unrelated octave).
4. Toggle labels off/on — confirm note letters disappear/reappear on all
   keys (white and black).
5. On a mobile viewport, tap "Rotate for wide view" — confirm the
   controls/title hide, only "Back to portrait" remains, and the layout
   is ready to read correctly once the viewport is physically rotated.
   Tap "Back to portrait" — confirm it returns to the normal layout.
6. Confirm the rotate button does not appear at `sm:` and above.
7. Confirm the new Navbar icon appears (desktop row + mobile dropdown),
   links to `/piano`, and shows an active state while on that page.
8. Confirm the home page's 3 cards still fit on a mobile screen without
   scrolling (unchanged), and that the new small link appears just below
   them, reachable with a small scroll. Confirm the desktop version of the
   link appears under the existing tagline.
9. Visit a lesson page with playable examples — confirm the playback dock
   keyboard is pixel-identical to before (new `PianoKeyboard` props at
   their defaults change nothing there).

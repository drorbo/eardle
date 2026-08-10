# Keyboard Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new `/piano` "Keyboard Playground" page — a free-play piano with pan/zoom sliders, a labels toggle, and a manual wide-view rotation for mobile — per `docs/superpowers/specs/2026-08-10-keyboard-playground-design.md`.

**Architecture:** Extend the existing shared `PianoKeyboard` component with three optional, backward-compatible props (zoom, label visibility, external scroll ref) rather than forking a second keyboard. Build the new page as a single client component consuming those props, plus two small integration points (a Navbar icon, a home-page link).

**Tech Stack:** Next.js 16 App Router, TypeScript, React, Tailwind CSS v4. **No test runner exists in this repo** — this plan uses `npx tsc --noEmit` after each file change instead of a test-first cycle, and ends with `npm run build` plus manual browser verification.

---

## File Structure

- `components/theory/PianoKeyboard.tsx` — **modified**. Adds `keyScale`, `showLabels`, `scrollRef` optional props, each defaulting to today's exact behavior.
- `components/piano/KeyboardPlayground.tsx` — **new**. Owns all page state (zoom, pan, labels, wide mode) and renders the keyboard + controls.
- `app/piano/page.tsx` — **new**. Server component shell, exports `metadata`, renders `<KeyboardPlayground />`.
- `components/ui/Navbar.tsx` — **modified**. New `PianoIcon` + a `NavIcon` entry (desktop row) and a matching `Link` (mobile dropdown).
- `app/page.tsx` — **modified**. Small link added after the tagline (desktop) and after the height-locked hero section (mobile).

No DB/schema/API changes. `hooks/useTheoryPlayback.ts` and `components/lesson/LessonPlaybackPanel.tsx` are not touched — verifying they still work unchanged is part of Task 6.

---

### Task 1: Extend `PianoKeyboard` with zoom, label-visibility, and scroll-ref props

**Files:**
- Modify: `components/theory/PianoKeyboard.tsx` (full rewrite, current file is 232 lines)

- [ ] **Step 1: Replace the file contents**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { parseNote } from "@/lib/audio/theory";
import { getDegreeColor } from "./palette";
import type { Degree } from "@/lib/audio/lessonPlayback";
import { useTheme } from "@/components/ThemeProvider";

// Narrow-and-tall, proportioned closer to a real piano key (~1:4 width:length)
// rather than a squat button — total footprint still stays compact since the
// width shrinks along with it.
const WHITE_KEY_W = 24;
const BLACK_KEY_W = 14;
const WHITE_KEY_H = 96;
const BLACK_KEY_H = 58;

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const IS_BLACK = new Set([1, 3, 6, 8, 10]); // semitone-in-octave for C#,D#,F#,G#,A#

function midiToNote(midi: number): string {
  const name = CHROMATIC[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

interface KeySlot {
  midi: number;
  defaultNote: string;
  isBlack: boolean;
}

function buildKeys(lowMidi: number, highMidi: number): KeySlot[] {
  const keys: KeySlot[] = [];
  for (let midi = lowMidi; midi <= highMidi; midi++) {
    keys.push({ midi, defaultNote: midiToNote(midi), isBlack: IS_BLACK.has(((midi % 12) + 12) % 12) });
  }
  return keys;
}

export interface PianoKeyboardProps {
  activeNotes: Map<string, Degree>;
  onKeyPlay: (note: string) => void;
  visibleNotes?: string[];
  lowNote?: string;
  highNote?: string;
  className?: string;
  /** Multiplies the base key width/height. Default 1 matches today's fixed
   *  size exactly — existing callers are unaffected. */
  keyScale?: number;
  /** Whether to render the note-letter label on each key. Default true
   *  matches today's behavior. */
  showLabels?: boolean;
  /** Optional external ref onto the same scrollable container the
   *  component already tracks internally, so a parent can read
   *  scrollWidth/clientWidth/scrollLeft and call scrollTo() itself
   *  (e.g. to drive a pan slider). */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function PianoKeyboard({
  activeNotes,
  onKeyPlay,
  visibleNotes,
  lowNote = "C2",
  highNote = "C7",
  className = "",
  keyScale = 1,
  showLabels = true,
  scrollRef,
}: PianoKeyboardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastDragNoteRef = useRef<string | null>(null);

  const whiteKeyW = WHITE_KEY_W * keyScale;
  const blackKeyW = BLACK_KEY_W * keyScale;
  const whiteKeyH = WHITE_KEY_H * keyScale;
  const blackKeyH = BLACK_KEY_H * keyScale;

  const lowMidi = parseNote(lowNote).midi;
  const highMidi = parseNote(highNote).midi;
  const keys = useMemo(() => buildKeys(lowMidi, highMidi), [lowMidi, highMidi]);
  const whiteKeys = useMemo(() => keys.filter((k) => !k.isBlack), [keys]);

  // Highlighted keys are looked up by MIDI (not string equality) — an active
  // note may be spelled "Eb4" while this key's slot default is "D#4"; same
  // pitch, same physical key.
  const activeByMidi = useMemo(() => {
    const map = new Map<number, { note: string; degree: Degree }>();
    activeNotes.forEach((degree, note) => {
      try {
        map.set(parseNote(note).midi, { note, degree });
      } catch {
        // ignore malformed note strings
      }
    });
    return map;
  }, [activeNotes]);

  // Auto-center on the midpoint of the active example's pitch range whenever
  // it changes — centering on the lowest note instead (as this used to)
  // pins an ascending scale's root to the left edge and pushes the rest of
  // the scale off-screen to the right.
  useEffect(() => {
    if (!visibleNotes || visibleNotes.length === 0 || !containerRef.current) return;
    let minMidi = Infinity;
    let maxMidi = -Infinity;
    for (const n of visibleNotes) {
      try {
        const midi = parseNote(n).midi;
        if (midi < minMidi) minMidi = midi;
        if (midi > maxMidi) maxMidi = midi;
      } catch { /* ignore */ }
    }
    if (!Number.isFinite(minMidi) || !Number.isFinite(maxMidi)) return;
    const targetMidi = Math.round((minMidi + maxMidi) / 2);
    const el = containerRef.current.querySelector<HTMLElement>(`[data-midi="${targetMidi}"]`);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ inline: "center", block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNotes?.join(",")]);

  const playFromPoint = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const note = el?.closest<HTMLElement>("[data-note]")?.dataset.note;
    if (note && note !== lastDragNoteRef.current) {
      lastDragNoteRef.current = note;
      onKeyPlay(note);
    }
  }, [onKeyPlay]);

  function handlePointerDown(note: string) {
    draggingRef.current = true;
    lastDragNoteRef.current = note;
    onKeyPlay(note);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      playFromPoint(e.clientX, e.clientY);
    }
    function onUp() {
      draggingRef.current = false;
      lastDragNoteRef.current = null;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [playFromPoint]);

  let whiteIndex = -1;

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        if (scrollRef) scrollRef.current = el;
      }}
      role="group"
      aria-label="Piano keyboard"
      className={`w-full overflow-x-auto no-scrollbar rounded-xl ${className}`}
    >
      <div className="relative" style={{ height: whiteKeyH, width: whiteKeys.length * whiteKeyW }}>
        {keys.map((k) => {
          if (k.isBlack) return null;
          whiteIndex++;
          const active = activeByMidi.get(k.midi);
          const color = active ? getDegreeColor(active.degree, isDark) : null;
          const label = active?.note.replace(/\d$/, "") ?? k.defaultNote.replace(/\d$/, "");
          return (
            <button
              key={k.midi}
              type="button"
              data-note={k.defaultNote}
              data-midi={k.midi}
              aria-label={`Play ${k.defaultNote}`}
              aria-pressed={!!active}
              onPointerDown={() => handlePointerDown(k.defaultNote)}
              style={{
                left: whiteIndex * whiteKeyW,
                width: whiteKeyW,
                height: whiteKeyH,
                backgroundColor: color?.bg,
                touchAction: "none",
              }}
              className={`absolute top-0 flex items-end justify-center pb-1 rounded-b-lg border select-none
                transition-transform duration-150
                ${active ? "motion-safe:scale-[0.98] border-transparent" : "bg-white dark:bg-slate-200 border-border-subtle hover:bg-surface-2"}`}
            >
              {showLabels && (
                <span
                  className="text-[9px] leading-none font-medium"
                  style={{ color: color?.text ?? undefined }}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}

        {(() => {
          let wIdx = -1;
          return keys.map((k) => {
            if (!k.isBlack) { wIdx++; return null; }
            // wIdx currently equals the index of the white key immediately
            // before this black key (count of white keys seen so far).
            const precedingWhiteIndex = wIdx;
            const active = activeByMidi.get(k.midi);
            const color = active ? getDegreeColor(active.degree, isDark) : null;
            const label = active?.note.replace(/\d$/, "") ?? k.defaultNote.replace(/\d$/, "");
            return (
              <button
                key={k.midi}
                type="button"
                data-note={k.defaultNote}
                data-midi={k.midi}
                aria-label={`Play ${k.defaultNote}`}
                aria-pressed={!!active}
                onPointerDown={() => handlePointerDown(k.defaultNote)}
                style={{
                  left: (precedingWhiteIndex + 1) * whiteKeyW - blackKeyW / 2,
                  width: blackKeyW,
                  height: blackKeyH,
                  backgroundColor: color?.bg ?? undefined,
                  touchAction: "none",
                  zIndex: 2,
                }}
                className={`absolute top-0 flex items-end justify-center pb-1 rounded-b-md select-none
                  transition-transform duration-150
                  ${active ? "motion-safe:scale-[0.96]" : "bg-slate-900 dark:bg-slate-950 hover:bg-slate-800"}`}
              >
                {showLabels && (
                  <span
                    className="text-[7px] leading-none font-medium"
                    style={{ color: color?.text ?? "#e2e8f0" }}
                  >
                    {label}
                  </span>
                )}
              </button>
            );
          });
        })()}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/theory/PianoKeyboard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/theory/PianoKeyboard.tsx
git commit -m "Add optional zoom, label-visibility, and scroll-ref props to PianoKeyboard"
```

---

### Task 2: `KeyboardPlayground` component

**Files:**
- Create: `components/piano/KeyboardPlayground.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PianoKeyboard } from "@/components/theory/PianoKeyboard";
import { audioEngine } from "@/lib/audio/engine";
import type { Degree } from "@/lib/audio/lessonPlayback";

const FLASH_MS = 300;
// Stable array reference — PianoKeyboard's auto-center effect keys on
// `visibleNotes?.join(",")`, so passing the same array every render means
// it only centers once, on mount, and never fights the pan slider or a
// manual drag afterward.
const CENTER_NOTE = ["C4"];

export function KeyboardPlayground() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(50); // 0-100, percent of scrollable width
  const [showLabels, setShowLabels] = useState(true);
  const [wide, setWide] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Map<string, Degree>>(new Map());

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards the scroll listener from re-reading a scroll position that this
  // component itself just set programmatically (pan slider or post-zoom
  // re-centering), so a programmatic move never gets misread as a manual
  // drag and bounced back into `pan` a second time.
  const syncingRef = useRef(false);

  const handleKeyPlay = useCallback((note: string) => {
    if (!audioEngine) return;
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    audioEngine.playNote(note);
    setActiveNotes(new Map([[note, "neutral"]]));
    flashTimeoutRef.current = setTimeout(() => setActiveNotes(new Map()), FLASH_MS);
  }, []);

  function applyPan(value: number) {
    setPan(value);
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    syncingRef.current = true;
    el.scrollTo({ left: (value / 100) * max, behavior: "auto" });
    requestAnimationFrame(() => { syncingRef.current = false; });
  }

  // Manually dragging the keyboard itself (native drag-to-scroll) keeps the
  // pan slider in sync, so the two controls never disagree about position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (syncingRef.current) return;
      const max = el!.scrollWidth - el!.clientWidth;
      setPan(max > 0 ? Math.round((el!.scrollLeft / max) * 100) : 0);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Re-apply the current pan percentage after a zoom change (once the DOM
  // has the new key sizes), so zooming doesn't jump the visible window to
  // an unrelated part of the keyboard.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    syncingRef.current = true;
    el.scrollTo({ left: (pan / 100) * max, behavior: "auto" });
    requestAnimationFrame(() => { syncingRef.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      audioEngine?.stop();
    };
  }, []);

  const keyboard = (
    <PianoKeyboard
      activeNotes={activeNotes}
      onKeyPlay={handleKeyPlay}
      visibleNotes={CENTER_NOTE}
      lowNote="A0"
      highNote="C8"
      keyScale={zoom}
      showLabels={showLabels}
      scrollRef={scrollRef}
    />
  );

  if (wide) {
    return (
      <div className="fixed inset-0 z-50 bg-bg overflow-hidden">
        <div
          className="fixed top-0 left-0 origin-top-left [transform:rotate(90deg)_translateY(-100%)]"
          style={{ width: "100vh", height: "100vw" }}
        >
          <div className="h-full flex flex-col justify-center gap-4 px-6">
            {keyboard}
            <button
              type="button"
              onClick={() => setWide(false)}
              className="self-start px-4 py-2 rounded-xl bg-surface border border-border-subtle text-text text-sm font-semibold hover:bg-surface-2 transition"
            >
              ← Back to portrait
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">🎹 Keyboard Playground</h1>
        <p className="text-text-muted text-sm">
          Tap, drag, or scroll to play. No exercises, no scoring — just experiment.
        </p>
      </div>

      {keyboard}

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs text-text-subtle mb-1">Move left / right</label>
          <input
            type="range"
            min={0}
            max={100}
            value={pan}
            onChange={(e) => applyPan(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-text-subtle mb-1">Zoom</label>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center justify-between text-sm text-text">
          <span>Show key names</span>
          <button
            type="button"
            role="switch"
            aria-checked={showLabels}
            onClick={() => setShowLabels((v) => !v)}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              showLabels ? "bg-indigo-600" : "bg-surface-2 border border-border-subtle"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                showLabels ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>

        <button
          type="button"
          onClick={() => setWide(true)}
          className="sm:hidden w-full px-4 py-2 rounded-xl bg-surface border border-border-subtle text-text text-sm font-semibold hover:bg-surface-2 transition"
        >
          ⤢ Rotate for wide view
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/piano/KeyboardPlayground.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/piano/KeyboardPlayground.tsx
git commit -m "Add KeyboardPlayground component"
```

---

### Task 3: `/piano` route

**Files:**
- Create: `app/piano/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { Metadata } from "next";
import { KeyboardPlayground } from "@/components/piano/KeyboardPlayground";

export const metadata: Metadata = {
  title: "Keyboard Playground — Eardle",
  description: "A free-play piano keyboard to experiment with sounds — no exercises, no scoring.",
};

export default function PianoPage() {
  return <KeyboardPlayground />;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/piano/page.tsx
git commit -m "Add /piano route"
```

---

### Task 4: Navbar entry point

**Files:**
- Modify: `components/ui/Navbar.tsx:33-40` (new icon), `:243-263` (desktop row), `:373-379` (mobile dropdown)

- [ ] **Step 1: Add the `PianoIcon` component**

Change (after the `LearnIcon` function, before `FeedbackIcon`):
```tsx
function LearnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}
```
to:
```tsx
function LearnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function PianoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M8 5v8M12 5v8M16 5v8" />
    </svg>
  );
}
```

- [ ] **Step 2: Add the desktop icon row entry**

Change:
```tsx
            <NavIcon
              href="/practice"
              label="Practice"
              active={pathname === "/practice" || Object.keys(CATEGORY_META).some((key) => pathname.startsWith(`/${key}`))}
              icon={<PracticeIcon className="w-5 h-5" />}
            />
          </div>
        </div>
```
to:
```tsx
            <NavIcon
              href="/practice"
              label="Practice"
              active={pathname === "/practice" || Object.keys(CATEGORY_META).some((key) => pathname.startsWith(`/${key}`))}
              icon={<PracticeIcon className="w-5 h-5" />}
            />
            <NavIcon
              href="/piano"
              label="Keyboard Playground"
              active={pathname === "/piano"}
              icon={<PianoIcon className="w-5 h-5" />}
            />
          </div>
        </div>
```

- [ ] **Step 3: Add the mobile dropdown entry**

Change:
```tsx
          <Link
            href="/practice"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎯</span>
            Practice
          </Link>

          <div className="border-t border-border-subtle mt-2 pt-2 space-y-1">
```
to:
```tsx
          <Link
            href="/practice"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎯</span>
            Practice
          </Link>
          <Link
            href="/piano"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎹</span>
            Keyboard Playground
          </Link>

          <div className="border-t border-border-subtle mt-2 pt-2 space-y-1">
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/ui/Navbar.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Navbar.tsx
git commit -m "Add Keyboard Playground entry to the Navbar"
```

---

### Task 5: Home page link

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the `Link` import**

Change:
```tsx
export const dynamic = "force-dynamic";

import { HomeActionCard } from "@/components/ui/HomeActionCard";
```
to:
```tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { HomeActionCard } from "@/components/ui/HomeActionCard";
```

- [ ] **Step 2: Add the desktop and mobile links**

Change:
```tsx
      <p className="hidden sm:block text-center text-text-faint text-sm mt-12">
        Press play, listen carefully, then pick your answer.
      </p>
    </div>
  );
}
```
to:
```tsx
      <p className="hidden sm:block text-center text-text-faint text-sm mt-12">
        Press play, listen carefully, then pick your answer.
      </p>
      <p className="hidden sm:block text-center text-text-faint text-sm mt-3">
        🎹 Just want to noodle around?{" "}
        <Link href="/piano" className="underline underline-offset-2 hover:text-text-muted transition">
          Try the Keyboard Playground →
        </Link>
      </p>
    </div>

    <p className="sm:hidden text-center text-text-faint text-xs px-4 py-4">
      🎹 Just want to noodle around?{" "}
      <Link href="/piano" className="underline underline-offset-2 hover:text-text-muted transition">
        Try the Keyboard Playground →
      </Link>
    </p>
  );
}
```

- [ ] **Step 3: Wrap the two top-level siblings in a Fragment**

The mobile paragraph added in Step 2 is now a sibling of the hero `<div>`, not nested inside it (deliberately — the hero div is height-locked and clipped on mobile, and this link needs to live outside that so mobile can scroll a little to reach it). That means the component now returns two top-level elements, which needs a Fragment wrapper.

Change:
```tsx
  return (
    // Below sm: height is pinned to the viewport minus the sticky navbar
```
to:
```tsx
  return (
    <>
    {/* Below sm: height is pinned to the viewport minus the sticky navbar */}
```

And change the final closing to have the outer `<div>` closed, then the mobile paragraph, then `</>`. Concretely, the full return statement should read:

```tsx
  return (
    <>
      {/* Below sm: height is pinned to the viewport minus the sticky navbar
          (h-16 + its 1px border) so the 3 cards below can flex-fill exactly the
          remaining space and never require scrolling, on any phone height.
          overflow-hidden is a safety net for sub-pixel rounding, not a clip —
          the flex-fill sizing means there's nothing meaningful past the fold.
          At sm+ this reverts to normal document flow — no scroll concern once
          cards sit side-by-side instead of stacked. */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-20 h-[calc(100dvh-65px)] sm:h-auto flex flex-col sm:block overflow-hidden sm:overflow-visible">
        <div className="text-center mb-2 sm:mb-10 flex-shrink-0">
          <h1 className="text-2xl sm:text-6xl font-bold text-text mb-0.5 sm:mb-4 tracking-tight">
            Train Your Ear
          </h1>
          <p className="hidden sm:block text-lg sm:text-xl text-text-muted max-w-xl mx-auto">
            Interactive exercises to sharpen your musical hearing — notes, intervals, chords, progressions, and scales.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 grid-rows-3 sm:grid-rows-none gap-2 sm:gap-5 flex-1 min-h-0 sm:flex-none sm:min-h-0">
          <HomeActionCard
            href="/daily"
            emoji="📅"
            eyebrow="New puzzle every day"
            title="Daily EarDle"
            description={dailyDescription}
            ctaText="Play Today →"
            colorClasses="
              from-orange-300 via-orange-200 to-yellow-200 border-orange-400 hover:border-orange-500
              dark:from-orange-700/70 dark:via-orange-600/50 dark:to-amber-600/40 dark:border-orange-500 dark:hover:border-orange-400
            "
            eyebrowClasses="text-orange-800 dark:text-orange-200"
            ctaTextClasses="text-orange-700"
          />
          <HomeActionCard
            href="/practice"
            emoji="🎯"
            eyebrow="Practice anytime"
            title="Practice Mode"
            description="Free practice across notes, intervals, chords, progressions, and scales — pick a category and difficulty."
            ctaText="Start Practicing →"
            colorClasses="
              from-sky-300 via-sky-200 to-cyan-200 border-sky-400 hover:border-sky-500
              dark:from-sky-700/70 dark:via-sky-600/50 dark:to-cyan-600/40 dark:border-sky-500 dark:hover:border-sky-400
            "
            eyebrowClasses="text-sky-800 dark:text-sky-200"
            ctaTextClasses="text-sky-700"
          />
          <HomeActionCard
            href="/learn"
            emoji="🎓"
            eyebrow="Build the theory"
            title="Learning Platform"
            description="Structured lessons that build the theory behind what you're hearing, topic by topic."
            ctaText="Start Learning →"
            colorClasses="
              from-violet-300 via-violet-200 to-purple-200 border-violet-400 hover:border-violet-500
              dark:from-violet-700/70 dark:via-violet-600/50 dark:to-purple-600/40 dark:border-violet-500 dark:hover:border-violet-400
            "
            eyebrowClasses="text-violet-800 dark:text-violet-200"
            ctaTextClasses="text-violet-700"
            sticker={
              <span className="absolute -top-3 -right-3 rotate-12 bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-bg z-10">
                NEW!
              </span>
            }
          />
        </div>

        <p className="hidden sm:block text-center text-text-faint text-sm mt-12">
          Press play, listen carefully, then pick your answer.
        </p>
        <p className="hidden sm:block text-center text-text-faint text-sm mt-3">
          🎹 Just want to noodle around?{" "}
          <Link href="/piano" className="underline underline-offset-2 hover:text-text-muted transition">
            Try the Keyboard Playground →
          </Link>
        </p>
      </div>

      <p className="sm:hidden text-center text-text-faint text-xs px-4 py-4">
        🎹 Just want to noodle around?{" "}
        <Link href="/piano" className="underline underline-offset-2 hover:text-text-muted transition">
          Try the Keyboard Playground →
        </Link>
      </p>
    </>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `app/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "Add a small Keyboard Playground link to the home page"
```

---

### Task 6: Full build + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Full production type-check + build**

Run: `npm run build`
Expected: build succeeds with no type or lint errors in any touched/created file.

- [ ] **Step 2: Confirm/start the dev server**

Run: `netstat -ano | findstr ":3000"` — reuse an already-running `next dev` process if one is listening (likely, from earlier work this session). Otherwise run `npm run dev`.

- [ ] **Step 3: Browser walkthrough**

Using the Chrome browser tool:

1. Visit `/piano` — confirm a full A0–C8 keyboard renders, initially scrolled/centered near C4 (not stuck at the very low A0 end).
2. Click/tap a few keys — confirm they play sound and briefly highlight.
3. Drag the pan slider — confirm the keyboard scrolls left/right accordingly.
4. Manually drag the keyboard itself (native drag-to-scroll) — confirm the pan slider's thumb position updates to match afterward.
5. Drag the zoom slider — confirm key size visibly changes and the currently-visible octave doesn't jump to an unrelated part of the keyboard.
6. Toggle "Show key names" off, then on — confirm labels disappear/reappear on both white and black keys.
7. At a normal desktop window width, confirm the "⤢ Rotate for wide view" button is **not** present.
8. Resize narrower (or note if the environment's resize tool is unreliable, per this session's earlier experience) and reload — confirm the rotate button appears below `sm`. Tap it — confirm the title/controls disappear and only a "← Back to portrait" button remains alongside the keyboard. Tap "Back to portrait" — confirm it returns to the normal control layout.
9. Confirm the new piano-key Navbar icon appears in the desktop icon row, links to `/piano`, and is visually marked active while on that page. Open the mobile hamburger menu — confirm "🎹 Keyboard Playground" appears there too.
10. Visit `/` — confirm the 3 home cards are unchanged, and the new "🎹 Just want to noodle around? Try the Keyboard Playground →" link appears under the tagline (desktop) / below the cards, reachable with a small scroll (mobile).
11. Visit a lesson page with playable examples (e.g. `/learn/triad-construction/triads-as-stacked-thirds`), tap a Play pill — confirm the playback dock's keyboard renders and behaves identically to before this plan (same key size, labels present, no pan slider or extra controls) — this is the check that the new `PianoKeyboard` props are truly backward-compatible at their defaults.

- [ ] **Step 4: Fix anything found, re-verify, then final commit if any fixes were needed**

If Step 3 surfaces any issue, fix it, re-run `npx tsc --noEmit`, re-check the specific broken item in the browser, then:
```bash
git add -A
git commit -m "Fix issues found during Keyboard Playground browser verification"
```
(Skip this step entirely if Step 3 found nothing to fix.)

---

## Self-Review Notes

- **Spec coverage:** `PianoKeyboard` prop extensions → Task 1. `KeyboardPlayground` (pan/zoom/labels/rotate, audio, A0–C8 range, one-time C4 centering via the existing `visibleNotes` mechanism) → Task 2. `/piano` route → Task 3. Navbar entry point (desktop + mobile) → Task 4. Home page link (desktop + mobile placements, without touching the 3-card grid) → Task 5. "Nothing else changes" guardrail (`useTheoryPlayback`, `LessonPlaybackPanel`) → verified by construction (no task touches those files) and explicitly re-checked in Task 6 Step 3.11.
- **No placeholders:** every step has complete, exact code — the home page task spells out the full final `return` statement rather than leaving the Fragment restructuring implicit, since that's the one step where a partial diff could be ambiguous about exactly where the new top-level sibling goes.
- **Type consistency:** `PianoKeyboardProps`'s three new fields (`keyScale`, `showLabels`, `scrollRef`) in Task 1 are consumed with matching names and types in Task 2's `<PianoKeyboard keyScale={zoom} showLabels={showLabels} scrollRef={scrollRef} .../>` call. `activeNotes`/`onKeyPlay`/`visibleNotes`/`lowNote`/`highNote` are passed with the exact same names/shapes `PianoKeyboard` already expects (verified against the current file read this session, not from memory) — `Degree` is imported from `@/lib/audio/lessonPlayback` in both files, matching the existing `useTheoryPlayback.ts` import path for that type. `audioEngine.playNote`/`.stop()` calls in Task 2 match the singleton's existing public methods.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { PianoKeyboard } from "@/components/theory/PianoKeyboard";
import { audioEngine } from "@/lib/audio/engine";
import type { Degree } from "@/lib/audio/lessonPlayback";

const FLASH_MS = 300;
// Stable array reference — PianoKeyboard's auto-center effect keys on
// `visibleNotes?.join(",")`, so passing the same array every render means
// it only centers once, on mount, and never fights the pan slider or a
// manual drag afterward.
const CENTER_NOTE = ["C4"];

// Thumb never shrinks below this, even at max zoom, so it stays comfortably
// grabbable instead of becoming a sliver.
const MIN_THUMB_PERCENT = 10;

export function KeyboardPlayground() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(50); // 0-100, percent of scrollable width
  // What fraction of the full keyboard width is visible right now — drives
  // the pan thumb's width. 1 = the whole keyboard fits, no scrolling needed.
  const [visibleFraction, setVisibleFraction] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [wide, setWide] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Map<string, Degree>>(new Map());

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Keyed by note, not a single shared timeout — a fixed single timer meant
  // that playing a second note while the first was still lit would cancel
  // the first note's clear timer and only ever schedule the newest one,
  // leaving other simultaneously-played keys stuck lit or clobbered.
  const flashTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Guards the scroll listener from re-reading a scroll position that this
  // component itself just set programmatically (pan slider or post-zoom
  // re-centering), so a programmatic move never gets misread as a manual
  // drag and bounced back into `pan` a second time.
  const syncingRef = useRef(false);

  // Start fetching the piano samples as soon as this page renders, well
  // before the user taps a key — same warm-up pattern every lesson/exercise
  // page uses (see components/lesson/LessonBlocks.tsx). Without this, the
  // very first tap has to wait for the sample fetch+decode to finish.
  useEffect(() => {
    audioEngine?.warm();
  }, []);

  const handleKeyPlay = useCallback((note: string) => {
    if (!audioEngine) return;
    audioEngine.playNote(note);

    // Each note gets its own independent highlight + clear timer, so
    // playing several notes at once (chords, two-finger touches) lets every
    // one of them light up and clear on its own schedule instead of the
    // newest key press wiping out every other currently-lit key.
    const existing = flashTimeoutsRef.current.get(note);
    if (existing) clearTimeout(existing);
    setActiveNotes((prev) => {
      const next = new Map(prev);
      next.set(note, "neutral");
      return next;
    });
    const timeout = setTimeout(() => {
      flashTimeoutsRef.current.delete(note);
      setActiveNotes((prev) => {
        const next = new Map(prev);
        next.delete(note);
        return next;
      });
    }, FLASH_MS);
    flashTimeoutsRef.current.set(note, timeout);
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

  const updateVisibleFraction = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth === 0) return;
    setVisibleFraction(el.clientWidth / el.scrollWidth);
  }, []);

  // Manually dragging the keyboard itself (native drag-to-scroll) keeps the
  // pan indicator in sync, so it and the keyboard never disagree about
  // position.
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

  // The visible fraction only changes when the viewport is resized (window
  // resize) or the keyboard's own rendered width changes (zoom) — not on
  // every scroll — so it's tracked separately from `pan`.
  useEffect(() => {
    updateVisibleFraction();
    window.addEventListener("resize", updateVisibleFraction);
    return () => window.removeEventListener("resize", updateVisibleFraction);
  }, [updateVisibleFraction]);

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
    updateVisibleFraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // Dragging anywhere on the pan track (or its thumb) moves the thumb's
  // *center* to the pointer in real time — scrollTo({behavior:"auto"}) with
  // no CSS transition on the thumb keeps it tracking the finger 1:1, with no
  // added lag.
  function panFromPointer(e: React.PointerEvent<HTMLDivElement>, thumbWidthPercent: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const clickPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const travel = 100 - thumbWidthPercent;
    const value = travel > 0 ? ((clickPercent - thumbWidthPercent / 2) / travel) * 100 : 0;
    applyPan(Math.min(100, Math.max(0, Math.round(value))));
  }

  function handleTrackPointerDown(e: React.PointerEvent<HTMLDivElement>, thumbWidthPercent: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    panFromPointer(e, thumbWidthPercent);
  }

  function handleTrackPointerMove(e: React.PointerEvent<HTMLDivElement>, thumbWidthPercent: number) {
    if (e.buttons !== 1) return;
    panFromPointer(e, thumbWidthPercent);
  }

  function nudgePan(delta: number) {
    applyPan(Math.min(100, Math.max(0, pan + delta)));
  }

  useEffect(() => {
    return () => {
      flashTimeoutsRef.current.forEach(clearTimeout);
      audioEngine?.stop();
    };
  }, []);

  const thumbWidthPercent = Math.min(100, Math.max(MIN_THUMB_PERCENT, visibleFraction * 100));
  const thumbLeftPercent = (pan / 100) * (100 - thumbWidthPercent);

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
          {/* Custom track instead of a native range input — the thumb's
              width represents how much of the keyboard is currently
              visible (shrinks as you zoom in, grows as you zoom out), which
              a native range input's fixed-size thumb can't show. */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Move left or right along the keyboard"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pan}
            onPointerDown={(e) => handleTrackPointerDown(e, thumbWidthPercent)}
            onPointerMove={(e) => handleTrackPointerMove(e, thumbWidthPercent)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") nudgePan(-5);
              else if (e.key === "ArrowRight") nudgePan(5);
            }}
            className="relative h-4 rounded-full bg-surface-2 border border-border-subtle cursor-pointer touch-none"
          >
            <div
              className="absolute top-0.5 bottom-0.5 rounded-full bg-indigo-600"
              style={{ left: `${thumbLeftPercent}%`, width: `${thumbWidthPercent}%` }}
            />
          </div>
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
            className={clsx(
              "w-10 h-6 rounded-full transition-colors relative shrink-0",
              showLabels ? "bg-indigo-600" : "bg-surface-2 border border-border-subtle"
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-[left]",
                showLabels ? "left-[18px]" : "left-0.5"
              )}
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

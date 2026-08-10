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

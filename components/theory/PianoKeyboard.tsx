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

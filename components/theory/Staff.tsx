"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedNoteEvent, Degree } from "@/lib/audio/lessonPlayback";
import { getDegreeColor } from "./palette";
import { useTheme } from "@/components/ThemeProvider";

function toVexKey(note: string): string {
  const m = note.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
  if (!m) return "c/4";
  return `${m[1].toLowerCase()}${m[2] ?? ""}/${m[3]}`;
}

interface NoteHitbox {
  note: string;
  x: number;
  y: number;
}

export interface StaffProps {
  events: ResolvedNoteEvent[];
  activeNoteKeys?: Map<string, Degree>;
  onNoteClick?: (note: string) => void;
  clef?: "treble" | "bass";
  romanNumerals?: string[];
  className?: string;
}

const MEASURE_SIZE = 4;
const NOTE_W = 68; // natural px reserved per note — never compressed below this

export function Staff({ events, activeNoteKeys, onNoteClick, clef = "treble", romanNumerals, className = "" }: StaffProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const ref = useRef<HTMLDivElement>(null);
  const [hitboxes, setHitboxes] = useState<NoteHitbox[]>([]);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    let cancelled = false;
    setHitboxes([]);

    if (events.length === 0) return;

    void (async () => {
      try {
        const { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } = await import("vexflow");
        await document.fonts.ready;
        if (cancelled) return;

        const measures: ResolvedNoteEvent[][] = [];
        for (let i = 0; i < events.length; i += MEASURE_SIZE) measures.push(events.slice(i, i + MEASURE_SIZE));

        // Natural width — never compressed to fit the container (unlike the
        // exercise-flow's staff components), so long scale/progression runs
        // scroll horizontally on narrow phones instead of cramming together.
        const measureW = Math.max(220, MEASURE_SIZE * NOTE_W);
        const naturalW = measures.length * measureW + 20;
        const W = Math.max(naturalW, el.offsetWidth || 0);
        // Fixed canvas sized for the worst case (a low root like C4 needing a
        // ledger line below the staff) so nothing clips — a per-example
        // content-fit box was tried and dropped: VexFlow's SVG bounding box
        // didn't correspond to the visible ink in a usable way.
        const H = 108;
        setWidth(W);

        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(W, H);
        const ctx = renderer.getContext();

        const newHitboxes: NoteHitbox[] = [];
        const singleEvent = events.length === 1;

        measures.forEach((measureEvents, mi) => {
          const x = 10 + mi * measureW;
          const w = measureW - (mi < measures.length - 1 ? 2 : 0);
          const stave = new Stave(x, 6, w);
          if (mi === 0) stave.addClef(clef);
          stave.setContext(ctx).draw();

          const duration = singleEvent ? "w" : "q";
          const staveNotes = measureEvents.map((event) => {
            // clef here isn't just cosmetic — StaveNote computes each key's
            // vertical position (line/space) against it directly, separate
            // from whatever clef symbol the stave itself draws. Omitting it
            // defaults to treble math regardless of the drawn clef, which is
            // exactly why bass-clef notes rendered miles off canvas before.
            const sn = new StaveNote({ keys: event.notes.map(toVexKey), duration, clef });
            event.notes.forEach((n, i) => {
              const acc = n.match(/^[A-G](#{1,2}|b{1,2})/)?.[1];
              if (acc) sn.addModifier(new Accidental(acc), i);
              const color = getDegreeColor(event.degrees[i], isDark);
              sn.setKeyStyle(i, { fillStyle: color.bg, strokeStyle: color.ring });
            });
            return sn;
          });

          const voice = new Voice({ numBeats: 4, beatValue: 4 });
          voice.setMode(Voice.Mode.SOFT);
          voice.addTickables(staveNotes);
          new Formatter().joinVoices([voice]).format([voice], w - (mi === 0 ? 65 : 30));
          voice.draw(ctx, stave);

          // Clickable noteheads are best-effort — a failure here just means
          // no click-to-play on the staff; the rest of the render still works.
          try {
            staveNotes.forEach((sn, si) => {
              const event = measureEvents[si];
              // getAbsoluteX() is the tickable's logical anchor, not the
              // rendered notehead's actual center — consistently offset from
              // the real glyph, worse once an accidental modifier shifts
              // things further. getNoteHeadBeginX()/EndX() bound the actual
              // glyph range instead — but that's the combined range across
              // ALL keys in the note, which is wrong the moment any key gets
              // horizontally displaced (VexFlow shifts one note sideways
              // whenever two stacked keys are a 2nd apart, e.g. the 4th/5th
              // in a sus4 chord, to keep the noteheads from overlapping).
              // Each key's own NoteHead element carries its own real X, so
              // use that per-key instead of one shared value for the chord.
              // getAbsoluteX() anchors from the LEFT edge for a normal
              // notehead (+ half width = center) but from the RIGHT edge for
              // a displaced one (- half width = center) — verified against
              // each notehead's actual rendered position.
              const fallbackX = (sn.getNoteHeadBeginX() + sn.getNoteHeadEndX()) / 2;
              const heads = sn.noteHeads;
              const ys = sn.getYs();
              event.notes.forEach((n, ni) => {
                const head = heads?.[ni];
                const xPos = head
                  ? head.getAbsoluteX() + (head.isDisplaced() ? -1 : 1) * (head.getWidth() / 2)
                  : fallbackX;
                newHitboxes.push({ note: n, x: xPos, y: ys[ni] ?? ys[0] ?? H / 2 });
              });
            });
          } catch {
            // no-op — see comment above
          }
        });

        if (!cancelled) setHitboxes(newHitboxes);

        if (romanNumerals?.length) {
          const rnRow = document.createElement("div");
          rnRow.style.cssText = "display:flex;padding:0 10px;margin-top:2px;";
          events.forEach((_, i) => {
            const span = document.createElement("span");
            span.style.cssText = "flex:1;text-align:center;font-size:11px;color:#9ca3af;font-family:serif;";
            span.textContent = romanNumerals[i] ?? "";
            rnRow.appendChild(span);
          });
          el.appendChild(rnRow);
        }
      } catch {
        if (ref.current)
          ref.current.innerHTML = `<span class="text-gray-400 text-sm p-3 block">Notation unavailable</span>`;
      }
    })();

    return () => { cancelled = true; el.innerHTML = ""; };
  }, [events, clef, isDark, romanNumerals]);

  return (
    <div className={`w-full overflow-x-auto no-scrollbar ${className}`}>
      <div className="relative" style={{ width: width || "100%" }}>
        <div ref={ref} className="w-full" />
        {onNoteClick && hitboxes.map((hb, i) => {
          const degree = activeNoteKeys?.get(hb.note);
          const isActive = degree !== undefined;
          const color = isActive ? getDegreeColor(degree, isDark) : null;
          return (
            <button
              key={`${hb.note}-${i}`}
              type="button"
              aria-label={`Play ${hb.note}`}
              onClick={() => onNoteClick(hb.note)}
              style={{
                left: hb.x - 15,
                top: hb.y - 15,
                width: 30,
                height: 30,
                backgroundColor: color ? `${color.bg}40` : "transparent",
                boxShadow: isActive ? `0 0 0 2px ${color!.ring}` : undefined,
              }}
              className="absolute rounded-full transition-colors duration-150"
            />
          );
        })}
      </div>
    </div>
  );
}

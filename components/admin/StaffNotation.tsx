"use client";

import { useEffect, useRef } from "react";
import type { StaveNote } from "vexflow";
import {
  ChordConfig, Exercise, IntervalConfig, NoteConfig, ProgressionConfig, ScaleConfig,
} from "@/types/exercise";
import { addSemitones, applyInversion, buildChord, buildScale } from "@/lib/audio/theory";

function toVexKey(note: string): string {
  const m = note.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
  if (!m) return "c/4";
  return `${m[1].toLowerCase()}${m[2] ?? ""}/${m[3]}`;
}

export function StaffNotation({ exercise }: { exercise: Exercise }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    let cancelled = false;

    void (async () => {
      try {
        const { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } =
          await import("vexflow");
        if (cancelled) return;

        const W = Math.max(el.offsetWidth || 0, 380);
        const H = 160;

        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(W, H);
        const ctx = renderer.getContext();

        const mkNote = (ns: string[], dur: string): StaveNote => {
          const sn = new StaveNote({ keys: ns.map(toVexKey), duration: dur });
          ns.forEach((n, i) => {
            const acc = n.match(/^[A-G](#{1,2}|b{1,2})/)?.[1];
            if (acc) sn.addModifier(new Accidental(acc), i);
          });
          return sn;
        };

        const drawMeasure = (x: number, w: number, tickables: StaveNote[], first: boolean) => {
          const stave = new Stave(x, 20, w);
          if (first) stave.addClef("treble");
          stave.setContext(ctx).draw();
          const voice = new Voice({ numBeats: 4, beatValue: 4 });
          voice.setMode(Voice.Mode.SOFT);
          voice.addTickables(tickables);
          new Formatter().joinVoices([voice]).format([voice], w - (first ? 65 : 30));
          voice.draw(ctx, stave);
        };

        switch (exercise.category) {
          case "note": {
            const c = exercise.config as NoteConfig;
            drawMeasure(10, W - 20, [mkNote([`${c.note}4`], "w")], true);
            break;
          }

          case "interval": {
            const c = exercise.config as IntervalConfig;
            const a = "C4";
            const b = addSemitones("C4", c.semitones);
            if (c.playMode === "harmonic") {
              drawMeasure(10, W - 20, [mkNote([a, b], "w")], true);
            } else {
              drawMeasure(10, W - 20, [mkNote([a], "h"), mkNote([b], "h")], true);
            }
            break;
          }

          case "chord": {
            const c = exercise.config as ChordConfig;
            const base = buildChord("C4", c.type);
            const notes = typeof c.inversion === "number" ? applyInversion(base, c.inversion) : base;
            drawMeasure(10, W - 20, [mkNote(notes, "w")], true);
            break;
          }

          case "scale": {
            const c = exercise.config as ScaleConfig;
            const notes = buildScale("C4", c.type);
            const chunks: string[][] = [];
            for (let i = 0; i < notes.length; i += 4) chunks.push(notes.slice(i, i + 4));
            const mw = chunks.length > 1 ? (W - 20) / chunks.length : W - 20;
            chunks.forEach((ch, i) => {
              drawMeasure(
                10 + i * mw,
                mw - (i < chunks.length - 1 ? 2 : 0),
                ch.map(n => mkNote([n], "q")),
                i === 0,
              );
            });
            break;
          }

          case "progression": {
            const c = exercise.config as ProgressionConfig;
            const chords = c.chords.slice(0, 4);
            const mw = (W - 20) / Math.max(chords.length, 1);
            chords.forEach((chord, i) => {
              drawMeasure(10 + i * mw, mw - 2, [mkNote(chord, "w")], i === 0);
            });

            // Roman numerals as HTML elements beneath the SVG
            if (c.romanNumerals?.length) {
              const rnRow = document.createElement("div");
              rnRow.style.cssText = "display:flex;padding:0 10px;margin-top:2px;";
              chords.forEach((_, i) => {
                const span = document.createElement("span");
                span.style.cssText = `flex:1;text-align:center;font-size:11px;color:#9ca3af;font-family:serif;`;
                span.textContent = c.romanNumerals[i] ?? "";
                rnRow.appendChild(span);
              });
              el.appendChild(rnRow);
            }
            break;
          }
        }
      } catch {
        if (ref.current)
          ref.current.innerHTML = `<span class="text-gray-400 text-sm p-3 block">Notation unavailable</span>`;
      }
    })();

    return () => { cancelled = true; if (ref.current) ref.current.innerHTML = ""; };
  }, [exercise.id]);

  return <div ref={ref} className="w-full" />;
}

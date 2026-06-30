"use client";

import { useEffect, useRef } from "react";
import { ChordType } from "@/types/exercise";
import { buildChord, applyVoicing, getVoicings, VoicingDef } from "@/lib/audio/theory";

function noteLabel(noteStr: string): string {
  return noteStr.replace(/\d$/, "");
}

function VoicingStaff({ notes, label }: { notes: string[]; label: string }) {
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

        const W = 110;
        const H = 130;
        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(W, H);
        const ctx = renderer.getContext();

        const toVexKey = (note: string): string => {
          const m = note.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
          if (!m) return "c/4";
          return `${m[1].toLowerCase()}${m[2] ?? ""}/${m[3]}`;
        };

        const sn = new StaveNote({ keys: notes.map(toVexKey), duration: "w" });
        notes.forEach((n, i) => {
          const acc = n.match(/^[A-G](#{1,2}|b{1,2})/)?.[1];
          if (acc) sn.addModifier(new Accidental(acc), i);
        });

        const stave = new Stave(5, 10, W - 10);
        stave.addClef("treble");
        stave.setContext(ctx).draw();

        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables([sn]);
        new Formatter().joinVoices([voice]).format([voice], W - 65);
        voice.draw(ctx, stave);
      } catch {
        if (ref.current)
          ref.current.innerHTML = `<span class="text-gray-400 text-xs p-2 block">—</span>`;
      }
    })();

    return () => { cancelled = true; if (ref.current) ref.current.innerHTML = ""; };
  }, [notes.join(",")]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={ref} className="w-full" />
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="text-xs text-gray-400 font-mono">
        {notes.map(noteLabel).join(" · ")}
      </span>
    </div>
  );
}

export function VoicingInspector({ type }: { type: ChordType }) {
  const closeNotes = buildChord("C4", type);
  const voicings: VoicingDef[] = getVoicings(type);

  return (
    <div className="flex gap-3 flex-wrap">
      {voicings.map((v) => (
        <div key={v.id} className="flex-1 min-w-[100px]">
          <VoicingStaff
            notes={applyVoicing(closeNotes, v.id)}
            label={v.label}
          />
        </div>
      ))}
    </div>
  );
}

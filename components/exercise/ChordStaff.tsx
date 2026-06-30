"use client";

import { useEffect, useRef } from "react";

function noteName(noteStr: string): string {
  return noteStr.replace(/\d$/, "").replace("b", "♭").replace("#", "♯");
}

export function ChordStaff({ notes }: { notes: string[] }) {
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
        await document.fonts.ready;
        if (cancelled) return;

        const W = Math.max(el.offsetWidth || 0, 280);
        const H = 160;
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

        const stave = new Stave(10, 20, W - 20);
        stave.addClef("treble");
        stave.setContext(ctx).draw();

        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables([sn]);
        new Formatter().joinVoices([voice]).format([voice], W - 80);
        voice.draw(ctx, stave);
      } catch {
        if (ref.current)
          ref.current.innerHTML = `<span class="text-gray-400 text-sm p-3 block">Notation unavailable</span>`;
      }
    })();

    return () => { cancelled = true; if (ref.current) ref.current.innerHTML = ""; };
  }, [notes.join(",")]);

  return (
    <div className="space-y-1">
      <div ref={ref} className="w-full" />
      <p className="text-center text-xs text-gray-400 font-mono tracking-wide">
        {notes.map(noteName).join(" · ")}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

function toVexKey(note: string): string {
  const m = note.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
  if (!m) return "c/4";
  return `${m[1].toLowerCase()}${m[2] ?? ""}/${m[3]}`;
}

export function ProgressionStaff({ chords }: { chords: string[][] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    let cancelled = false;

    void (async () => {
      try {
        const { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } = await import("vexflow");
        await document.fonts.ready;
        if (cancelled) return;

        const shown = chords.slice(0, 4);
        const W = Math.max(el.offsetWidth || 0, 320);
        const H = 160;
        const renderer = new Renderer(el, Renderer.Backends.SVG);
        renderer.resize(W, H);
        const ctx = renderer.getContext();

        const mw = (W - 20) / Math.max(shown.length, 1);
        shown.forEach((chord, i) => {
          const stave = new Stave(10 + i * mw, 20, mw - (i < shown.length - 1 ? 2 : 0));
          if (i === 0) stave.addClef("treble");
          stave.setContext(ctx).draw();

          const sn = new StaveNote({ keys: chord.map(toVexKey), duration: "w" });
          chord.forEach((n, j) => {
            const acc = n.match(/^[A-G](#{1,2}|b{1,2})/)?.[1];
            if (acc) sn.addModifier(new Accidental(acc), j);
          });

          const voice = new Voice({ numBeats: 4, beatValue: 4 });
          voice.setMode(Voice.Mode.SOFT);
          voice.addTickables([sn]);
          new Formatter().joinVoices([voice]).format([voice], mw - (i === 0 ? 65 : 30));
          voice.draw(ctx, stave);
        });
      } catch {
        if (ref.current)
          ref.current.innerHTML = `<span class="text-gray-400 text-sm p-3 block">Notation unavailable</span>`;
      }
    })();

    return () => {
      cancelled = true;
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [chords.map((c) => c.join(",")).join("|")]);

  return (
    <div className="space-y-1">
      <div ref={ref} className="w-full" />
    </div>
  );
}

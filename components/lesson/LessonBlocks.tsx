"use client";

import { useEffect, useState } from "react";
import { audioEngine } from "@/lib/audio/engine";
import { buildChord } from "@/lib/audio/theory";
import type { AudioExampleBlock, AudioExamplePlayable, LessonBlock } from "@/types/lesson";

// Reuses the same audioEngine singleton every exercise plays through — no new
// audio code, just parameters describing what to play (see types/lesson.ts).
async function playExample(p: AudioExamplePlayable) {
  if (!audioEngine) return;
  const root = p.root ?? "C4";
  switch (p.kind) {
    case "note":
      await audioEngine.playNote(root);
      break;
    case "interval":
      await audioEngine.playInterval(p.noteA ?? root, p.noteB ?? root, p.intervalMode ?? "harmonic");
      break;
    case "chord":
      await audioEngine.playChord(root, p.chordType ?? "major");
      break;
    case "scale":
      await audioEngine.playScale(root, p.scaleType ?? "major");
      break;
    case "arpeggio":
      await audioEngine.playArpeggio(p.notes ?? buildChord(root, p.chordType ?? "major"));
      break;
    case "progression":
      await audioEngine.playProgression(p.chords ?? [], p.tempo ?? 80);
      break;
  }
}

function PlayPill({ label, play }: { label: string; play: AudioExamplePlayable }) {
  const [pulsing, setPulsing] = useState(false);

  function handleClick() {
    void playExample(play);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 300);
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition ${
        pulsing
          ? "bg-indigo-600 border-indigo-600 text-white"
          : "bg-surface-2 border-border-subtle text-text hover:border-border"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
        <path d="M8 5v14l11-7z" />
      </svg>
      {label}
    </button>
  );
}

function AudioExample({ block }: { block: AudioExampleBlock }) {
  return (
    <div className="my-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-surface border border-border-subtle surface-elevated">
      <PlayPill label={block.label} play={block.play} />
      {block.comparePlay && block.compareLabel && (
        <>
          <span className="text-text-faint text-xs uppercase tracking-widest">vs</span>
          <PlayPill label={block.compareLabel} play={block.comparePlay} />
        </>
      )}
    </div>
  );
}

function Prose({ body }: { body: string }) {
  return (
    <>
      {body.split("\n\n").map((para, i) => (
        <p key={i} className="text-text-secondary leading-relaxed mb-3 last:mb-0">
          {para}
        </p>
      ))}
    </>
  );
}

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  // Start fetching piano samples as soon as the lesson renders, well before
  // the user clicks a play pill — same warm-up pattern every exercise uses.
  useEffect(() => {
    audioEngine?.warm();
  }, []);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "text":
            return <Prose key={i} body={block.body} />;
          case "audioExample":
            return <AudioExample key={i} block={block} />;
          case "tip":
            return (
              <div key={i} className="p-4 rounded-xl bg-accent-banner-bg border border-accent-banner-border">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">💡 Tip</p>
                <p className="text-text-secondary text-sm leading-relaxed">{block.body}</p>
              </div>
            );
          case "commonMistake":
            return (
              <div key={i} className="p-4 rounded-xl bg-amber-50 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-1">
                  ⚠️ Common mistake
                </p>
                <p className="text-text-secondary text-sm leading-relaxed">{block.body}</p>
              </div>
            );
          case "summary":
            return (
              <div key={i} className="p-4 rounded-xl bg-surface-2 border border-border-subtle mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-1">📝 Summary</p>
                <p className="text-text-secondary text-sm leading-relaxed">{block.body}</p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

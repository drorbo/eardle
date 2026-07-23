import { buildChord, buildScale, getChordToneDegrees, getScaleDegrees, getIntervalDegree, parseNote } from "./theory";
import { DEFAULT_SCALE_NOTE_GAP, DEFAULT_ARPEGGIO_NOTE_GAP } from "./engine";
import type { AudioExamplePlayable } from "@/types/lesson";

export type Degree = number | "neutral";

export interface ResolvedNoteEvent {
  notes: string[];
  degrees: Degree[]; // index-aligned with notes
  time: number;       // seconds from sequence start
  duration: string;
}

const NEUTRAL_FILL = (n: string[]): Degree[] => n.map(() => "neutral" as const);

// Mirrors LessonBlocks.tsx's old playExample() switch, but returns
// declarative, degree-tagged events for AudioEngine.playSequence() instead
// of calling the engine directly — same parameters, same pacing constants.
export function resolvePlayable(p: AudioExamplePlayable): ResolvedNoteEvent[] {
  const root = p.root ?? "C4";

  switch (p.kind) {
    case "note":
      return [{ notes: [root], degrees: [0], time: 0, duration: "2n" }];

    case "interval": {
      const noteA = p.noteA ?? root;
      const noteB = p.noteB ?? root;
      const semitones = parseNote(noteB).midi - parseNote(noteA).midi;
      const degreeB = getIntervalDegree(semitones);
      if ((p.intervalMode ?? "harmonic") === "harmonic") {
        return [{ notes: [noteA, noteB], degrees: [0, degreeB], time: 0, duration: "2n" }];
      }
      return [
        { notes: [noteA], degrees: [0], time: 0, duration: "2n" },
        { notes: [noteB], degrees: [degreeB], time: 0.7, duration: "2n" },
      ];
    }

    case "chord": {
      const type = p.chordType ?? "major";
      const notes = buildChord(root, type);
      const degrees = getChordToneDegrees(type);
      return [{ notes, degrees, time: 0, duration: "2n" }];
    }

    case "scale": {
      const type = p.scaleType ?? "major";
      const notes = buildScale(root, type);
      const degrees = getScaleDegrees(type);
      const gap = DEFAULT_SCALE_NOTE_GAP;
      return notes.map((note, i) => ({
        notes: [note],
        degrees: [degrees[i]],
        time: i * gap,
        duration: String(gap * 0.9),
      }));
    }

    case "arpeggio": {
      const gap = DEFAULT_ARPEGGIO_NOTE_GAP;
      if (p.notes) {
        // Hand-typed note list — no known chord structure to color by.
        return p.notes.map((note, i) => ({
          notes: [note],
          degrees: ["neutral" as const],
          time: i * gap,
          duration: "2n",
        }));
      }
      const type = p.chordType ?? "major";
      const notes = buildChord(root, type);
      const degrees = getChordToneDegrees(type);
      return notes.map((note, i) => ({
        notes: [note],
        degrees: [degrees[i]],
        time: i * gap,
        duration: "2n",
      }));
    }

    case "progression": {
      const chords = p.chords ?? [];
      const tempo = p.tempo ?? 80;
      const beatDuration = 60 / tempo;
      return chords.map((chord, i) => ({
        notes: chord,
        degrees: NEUTRAL_FILL(chord),
        time: i * beatDuration * 2,
        duration: "2n",
      }));
    }
  }
}

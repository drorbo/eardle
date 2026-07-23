import {
  buildChord,
  buildScale,
  getChordToneDegrees,
  getScaleDegrees,
  getIntervalDegree,
  parseNote,
  applyInversion,
  applyVoicing,
} from "./theory";
import { DEFAULT_SCALE_NOTE_GAP, DEFAULT_ARPEGGIO_NOTE_GAP } from "./engine";
import type { AudioExamplePlayable } from "@/types/lesson";
import type { ChordType } from "@/types/exercise";

export type Degree = number | "neutral";

export interface ResolvedNoteEvent {
  notes: string[];
  degrees: Degree[]; // index-aligned with notes
  time: number;       // seconds from sequence start
  duration: string;
}

const NEUTRAL_FILL = (n: string[]): Degree[] => n.map(() => "neutral" as const);

// applyInversion/applyVoicing only reorder a plain note array (raise some
// notes an octave by index, then re-sort by pitch) — this re-derives the
// matching degree for each reordered note without duplicating that
// index-selection logic, by matching letter+accidental (octave-raising
// never changes those) back to the original pre-reorder note it came from.
function degreesForReordered(original: string[], degrees: Degree[], reordered: string[]): Degree[] {
  const remaining = original.map((note, i) => ({ note, i, used: false }));
  return reordered.map((note) => {
    const letterAcc = note.replace(/\d+$/, "");
    const match = remaining.find((r) => !r.used && r.note.replace(/\d+$/, "") === letterAcc);
    if (!match) return "neutral";
    match.used = true;
    return degrees[match.i];
  });
}

// Progressions commonly voice-lead individual notes into different octaves
// than a plain root-position buildChord would produce, so match by pitch
// class (midi % 12) rather than exact note+octave.
function degreesByPitchClass(actualNotes: string[], chordRoot: string, chordType: ChordType): Degree[] {
  const theoreticalNotes = buildChord(chordRoot, chordType);
  const theoreticalDegrees = getChordToneDegrees(chordType);
  const byPitchClass = new Map<number, Degree>();
  theoreticalNotes.forEach((note, i) => {
    byPitchClass.set(((parseNote(note).midi % 12) + 12) % 12, theoreticalDegrees[i]);
  });
  return actualNotes.map((note) => byPitchClass.get(((parseNote(note).midi % 12) + 12) % 12) ?? "neutral");
}

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
      const baseNotes = buildChord(root, type);
      const baseDegrees = getChordToneDegrees(type);
      let notes = baseNotes;
      let degrees: Degree[] = baseDegrees;
      if (p.voicing) {
        notes = applyVoicing(baseNotes, p.voicing);
        degrees = degreesForReordered(baseNotes, baseDegrees, notes);
      } else if (typeof p.inversion === "number") {
        notes = applyInversion(baseNotes, p.inversion);
        degrees = degreesForReordered(baseNotes, baseDegrees, notes);
      }
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
      return chords.map((chord, i) => {
        const chordRoot = p.chordRoots?.[i];
        const chordType = p.chordTypes?.[i];
        const degrees = chordRoot && chordType ? degreesByPitchClass(chord, chordRoot, chordType) : NEUTRAL_FILL(chord);
        return {
          notes: chord,
          degrees,
          time: i * beatDuration * 2,
          duration: "2n",
        };
      });
    }
  }
}

// Bass clef reads more naturally below middle C (midi 60) — a chord/scale
// rooted there needs several ledger lines in treble but sits comfortably
// near/within a bass staff instead. Picked by the lowest note across the
// whole example, not just the root, so a wide-range scale still lands on
// whichever clef actually fits its lowest note.
export function selectClef(events: ResolvedNoteEvent[]): "treble" | "bass" {
  const allNotes = events.flatMap((e) => e.notes);
  if (allNotes.length === 0) return "treble";
  const lowestMidi = Math.min(...allNotes.map((n) => parseNote(n).midi));
  return lowestMidi < 60 ? "bass" : "treble";
}

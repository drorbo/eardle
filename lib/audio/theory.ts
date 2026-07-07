export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

export const INTERVAL_NAMES = [
  "Unison", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd",
  "Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th",
  "Minor 7th", "Major 7th", "Octave",
] as const;

export const CHORD_TYPES = {
  // Triads
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  dim:        [0, 3, 6],
  aug:        [0, 4, 8],
  sus4:       [0, 5, 7],

  // Major family
  maj6:       [0, 4, 7, 9],
  maj6_9:     [0, 4, 7, 9, 14],
  maj7:       [0, 4, 7, 11],
  maj9:       [0, 4, 7, 11, 14],
  maj7s11:    [0, 4, 11, 18],
  maj9s11:    [0, 4, 11, 14, 18],
  maj13:      [0, 4, 7, 11, 21],
  augMaj7:    [0, 4, 8, 11],

  // Minor family
  min6:       [0, 3, 7, 9],
  min7:       [0, 3, 7, 10],
  min9:       [0, 3, 7, 10, 14],
  min11:      [0, 3, 7, 10, 17],
  min13:      [0, 3, 7, 10, 21],
  minMaj7:    [0, 3, 7, 11],
  minMaj9:    [0, 3, 7, 11, 14],
  min7b5:     [0, 3, 6, 10],

  // Dominant (unaltered)
  dom7:       [0, 4, 7, 10],
  dom9:       [0, 4, 7, 10, 14],
  dom13:      [0, 4, 7, 10, 21],
  dom7s11:    [0, 4, 10, 18],
  dom9s11:    [0, 4, 10, 14, 18],
  dom13s11:   [0, 4, 10, 18, 21],

  // Dominant altered
  dom7b9:     [0, 4, 7, 10, 13],
  dom7s9:     [0, 4, 7, 10, 15],
  dom7b13:    [0, 4, 10, 20],
  dom7b9b13:  [0, 4, 10, 13, 20],
  dom7s9b13:  [0, 4, 10, 15, 20],
  dom7b9s11:  [0, 4, 10, 13, 18],
  dom7s9s11:  [0, 4, 10, 15, 18],
  dom7s5:     [0, 4, 8, 10],
  dom7b5:     [0, 4, 6, 10],

  // Suspended
  sus7:       [0, 5, 7, 10],
  sus9:       [0, 5, 7, 10, 14],
  sus13:      [0, 5, 7, 10, 14, 21],

  // Diminished
  dim7:       [0, 3, 6, 9],
} as const;

export const SCALE_TYPES = {
  // Major modes
  major:           [0, 2, 4, 5, 7, 9, 11, 12],
  dorian:          [0, 2, 3, 5, 7, 9, 10, 12],
  phrygian:        [0, 1, 3, 5, 7, 8, 10, 12],
  lydian:          [0, 2, 4, 6, 7, 9, 11, 12],
  mixolydian:      [0, 2, 4, 5, 7, 9, 10, 12],
  aeolian:         [0, 2, 3, 5, 7, 8, 10, 12],
  locrian:         [0, 1, 3, 5, 6, 8, 10, 12],
  // Minor
  harmonic_minor:  [0, 2, 3, 5, 7, 8, 11, 12],
  melodic_minor:   [0, 2, 3, 5, 7, 9, 11, 12],
  // Pentatonic & blues
  blues:           [0, 3, 5, 6, 7, 10, 12],
  pentatonic_major:[0, 2, 4, 7, 9, 12],
  // Melodic minor modes
  dorian_b2:       [0, 1, 3, 5, 7, 9, 10, 12],
  lydian_aug:      [0, 2, 4, 6, 8, 9, 11, 12],
  lydian_b7:       [0, 2, 4, 6, 7, 9, 10, 12],
  mixolydian_b6:   [0, 2, 4, 5, 7, 8, 10, 12],
  locrian_s2:      [0, 2, 3, 5, 6, 8, 10, 12],
  altered:         [0, 1, 3, 4, 6, 8, 10, 12],
  // Symmetric
  whole_tone:      [0, 2, 4, 6, 8, 10, 12],
  half_whole:      [0, 1, 3, 4, 6, 7, 9, 10, 12],
  whole_half:      [0, 2, 3, 5, 6, 8, 9, 11, 12],
} as const;

export type ChordType = keyof typeof CHORD_TYPES;
export type ScaleType = keyof typeof SCALE_TYPES;

// ─── Note spelling internals ────────────────────────────────────────────────

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
// Semitone distance of each natural letter from C
const NAT_SEMI = [0, 2, 4, 5, 7, 9, 11] as const;

// Roots that are always notated with flats in standard music
const ENHARMONIC_ROOTS: Record<string, string> = {
  "A#": "Bb",
  "C#": "Db",
  "D#": "Eb",
  "G#": "Ab",
};

function accToSemi(acc: string): number {
  if (acc === "##") return 2;
  if (acc === "#")  return 1;
  if (acc === "bb") return -2;
  if (acc === "b")  return -1;
  return 0;
}

function semiToAcc(n: number): string {
  if (n === 2)  return "##";
  if (n === 1)  return "#";
  if (n === -1) return "b";
  if (n === -2) return "bb";
  return "";
}

interface ParsedNote {
  letter: string;
  lIdx: number;
  accSemi: number;
  octave: number;
  midi: number;
}

function parseNoteFull(noteStr: string): ParsedNote {
  const m = noteStr.match(/^([A-G])(#{1,2}|b{1,2})?(\d)$/);
  if (!m) throw new Error(`Invalid note: ${noteStr}`);
  const letter  = m[1];
  const acc     = m[2] ?? "";
  const octave  = parseInt(m[3]);
  const lIdx    = LETTERS.indexOf(letter as typeof LETTERS[number]);
  const accSemi = accToSemi(acc);
  const midi    = (octave + 1) * 12 + NAT_SEMI[lIdx] + accSemi;
  return { letter, lIdx, accSemi, octave, midi };
}

function normalizeRoot(rootStr: string): string {
  const m = rootStr.match(/^([A-G]#?)(\d)$/);
  if (!m) return rootStr;
  const renamed = ENHARMONIC_ROOTS[m[1]] ?? m[1];
  return renamed + m[2];
}

/**
 * Spell a note that is `intervalSemitones` above `rootStr`, using `letterSteps`
 * letter-name steps from the root letter (0=unison, 1=2nd, 2=3rd, ...).
 * The accidental is derived automatically.
 */
function spellNote(rootStr: string, intervalSemitones: number, letterSteps: number): string {
  const root       = parseNoteFull(rootStr);
  const targetMidi = root.midi + intervalSemitones;
  const targetLIdx = ((root.lIdx + letterSteps) % 7 + 7) % 7;
  const targetNat  = NAT_SEMI[targetLIdx];

  let octave      = Math.floor(targetMidi / 12) - 1;
  let naturalMidi = (octave + 1) * 12 + targetNat;
  let accSemi     = targetMidi - naturalMidi;

  if (accSemi > 2)       { octave++; accSemi -= 12; }
  else if (accSemi < -2) { octave--; accSemi += 12; }

  return `${LETTERS[targetLIdx]}${semiToAcc(accSemi)}${octave}`;
}

// Prefer simpler accidentals: natural > flat > sharp > double-flat > double-sharp
function accScore(noteStr: string): number {
  const acc = noteStr.match(/[A-G](#{1,2}|b{1,2}|)/)?.[1] ?? "";
  return ["", "b", "#", "bb", "##"].indexOf(acc);
}

// Try two letterSteps choices and return the one with the simpler accidental
function bestOf(rootStr: string, semitones: number, ls1: number, ls2: number): string {
  const a = spellNote(rootStr, semitones, ls1);
  const b = spellNote(rootStr, semitones, ls2);
  return accScore(a) <= accScore(b) ? a : b;
}

// ─── Interval tables with explicit letter-step counts ───────────────────────
// Each entry: [semitones, letterSteps] or [semitones, [ls1, ls2]] (try both, pick simpler).
// letterSteps: 0=unison, 1=2nd, 2=3rd, 3=4th, 4=5th, 5=6th, 6=7th

type IvDef = [number, number | [number, number]];

const CHORD_INTERVALS: Record<ChordType, IvDef[]> = {
  major:      [[0,0],[4,2],[7,4]],
  minor:      [[0,0],[3,2],[7,4]],
  dim:        [[0,0],[3,2],[6,4]],
  aug:        [[0,0],[4,2],[8,4]],
  sus4:       [[0,0],[5,3],[7,4]],

  maj6:       [[0,0],[4,2],[7,4],[9,5]],
  maj6_9:     [[0,0],[4,2],[7,4],[9,5],[14,1]],
  maj7:       [[0,0],[4,2],[7,4],[11,6]],
  maj9:       [[0,0],[4,2],[7,4],[11,6],[14,1]],
  maj7s11:    [[0,0],[4,2],[11,6],[18,3]],
  maj9s11:    [[0,0],[4,2],[11,6],[14,1],[18,3]],
  maj13:      [[0,0],[4,2],[7,4],[11,6],[21,5]],
  augMaj7:    [[0,0],[4,2],[8,4],[11,6]],

  min6:       [[0,0],[3,2],[7,4],[9,5]],
  min7:       [[0,0],[3,2],[7,4],[10,6]],
  min9:       [[0,0],[3,2],[7,4],[10,6],[14,1]],
  min11:      [[0,0],[3,2],[7,4],[10,6],[17,3]],
  min13:      [[0,0],[3,2],[7,4],[10,6],[21,5]],
  minMaj7:    [[0,0],[3,2],[7,4],[11,6]],
  minMaj9:    [[0,0],[3,2],[7,4],[11,6],[14,1]],
  min7b5:     [[0,0],[3,2],[6,4],[10,6]],

  dom7:       [[0,0],[4,2],[7,4],[10,6]],
  dom9:       [[0,0],[4,2],[7,4],[10,6],[14,1]],
  dom13:      [[0,0],[4,2],[7,4],[10,6],[21,5]],
  dom7s11:    [[0,0],[4,2],[10,6],[18,3]],
  dom9s11:    [[0,0],[4,2],[10,6],[14,1],[18,3]],
  dom13s11:   [[0,0],[4,2],[10,6],[18,3],[21,5]],

  dom7b9:     [[0,0],[4,2],[7,4],[10,6],[13,1]],
  dom7s9:     [[0,0],[4,2],[7,4],[10,6],[15,1]],
  dom7b13:    [[0,0],[4,2],[10,6],[20,5]],
  dom7b9b13:  [[0,0],[4,2],[10,6],[13,1],[20,5]],
  dom7s9b13:  [[0,0],[4,2],[10,6],[15,1],[20,5]],
  dom7b9s11:  [[0,0],[4,2],[10,6],[13,1],[18,3]],
  dom7s9s11:  [[0,0],[4,2],[10,6],[15,1],[18,3]],
  dom7s5:     [[0,0],[4,2],[8,4],[10,6]],
  dom7b5:     [[0,0],[4,2],[6,4],[10,6]],

  sus7:       [[0,0],[5,3],[7,4],[10,6]],
  sus9:       [[0,0],[5,3],[7,4],[10,6],[14,1]],
  sus13:      [[0,0],[5,3],[7,4],[10,6],[14,1],[21,5]],

  // dim7 4th note: try both M6 (letterSteps=5) and d7 (letterSteps=6); pick simpler
  // e.g. A natural from C (not Bbb), Ab from B (not G#), Db from E (not C#)
  dim7:       [[0,0],[3,2],[6,4],[9,[5,6]]],
};

const SCALE_INTERVALS: Record<ScaleType, IvDef[]> = {
  // Major modes
  major:           [[0,0],[2,1],[4,2],[5,3],[7,4],[9,5],[11,6],[12,0]],
  dorian:          [[0,0],[2,1],[3,2],[5,3],[7,4],[9,5],[10,6],[12,0]],
  phrygian:        [[0,0],[1,1],[3,2],[5,3],[7,4],[8,5],[10,6],[12,0]],
  lydian:          [[0,0],[2,1],[4,2],[6,3],[7,4],[9,5],[11,6],[12,0]],
  mixolydian:      [[0,0],[2,1],[4,2],[5,3],[7,4],[9,5],[10,6],[12,0]],
  aeolian:         [[0,0],[2,1],[3,2],[5,3],[7,4],[8,5],[10,6],[12,0]],
  locrian:         [[0,0],[1,1],[3,2],[5,3],[6,4],[8,5],[10,6],[12,0]],
  // Minor
  harmonic_minor:  [[0,0],[2,1],[3,2],[5,3],[7,4],[8,5],[11,6],[12,0]],
  melodic_minor:   [[0,0],[2,1],[3,2],[5,3],[7,4],[9,5],[11,6],[12,0]],
  // Pentatonic & blues (b5 and P5 share letterSteps=4; accidental differs: Gb vs G)
  blues:           [[0,0],[3,2],[5,3],[6,4],[7,4],[10,6],[12,0]],
  pentatonic_major:[[0,0],[2,1],[4,2],[7,4],[9,5],[12,0]],
  // Melodic minor modes (b3 and M3 share letterSteps in altered; Ab and A share in locrian_s2/whole_half)
  dorian_b2:       [[0,0],[1,1],[3,2],[5,3],[7,4],[9,5],[10,6],[12,0]],
  lydian_aug:      [[0,0],[2,1],[4,2],[6,3],[8,4],[9,5],[11,6],[12,0]],
  lydian_b7:       [[0,0],[2,1],[4,2],[6,3],[7,4],[9,5],[10,6],[12,0]],
  mixolydian_b6:   [[0,0],[2,1],[4,2],[5,3],[7,4],[8,5],[10,6],[12,0]],
  locrian_s2:      [[0,0],[2,1],[3,2],[5,3],[6,4],[8,5],[10,6],[12,0]],
  altered:         [[0,0],[1,1],[3,2],[4,2],[6,4],[8,5],[10,6],[12,0]],
  // Symmetric
  whole_tone:      [[0,0],[2,1],[4,2],[6,3],[8,4],[10,5],[12,0]],
  // Eb and E share letterSteps=2; F# at step 3 (no F natural)
  half_whole:      [[0,0],[1,1],[3,2],[4,2],[6,3],[7,4],[9,5],[10,6],[12,0]],
  // Ab and A share letterSteps=5
  whole_half:      [[0,0],[2,1],[3,2],[5,3],[6,4],[8,5],[9,5],[11,6],[12,0]],
};

// Default letter steps for addSemitones (interval exercises, semitones 0-16)
// The fallback formula Math.round(s*6/11) is wrong for s=13 (gives 7, needs 8) and s=15 (gives 8, needs 9).
const INTERVAL_LS: Record<number, number> = {
  0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7,
  13: 8, 14: 8, 15: 9, 16: 9,  // minor/major 9th, minor/major 10th
};

// ─── Public API ─────────────────────────────────────────────────────────────

/** Parse a note string ("C#4", "Bb4", "C4") into { name, octave, midi } */
export function parseNote(noteStr: string): { name: string; octave: number; midi: number } {
  const p    = parseNoteFull(noteStr);
  const name = p.letter + semiToAcc(p.accSemi);
  return { name, octave: p.octave, midi: p.midi };
}

/** Add semitones to a note string with diatonic spelling */
export function addSemitones(noteStr: string, semitones: number): string {
  const ls = INTERVAL_LS[semitones] ?? Math.round(semitones * 6 / 11);
  return spellNote(noteStr, semitones, ls);
}

/** Build chord notes from a root note string and chord type */
export function buildChord(root: string, type: ChordType): string[] {
  const r = normalizeRoot(root);
  return CHORD_INTERVALS[type].map(([semi, ls]) => {
    if (semi === 0) return r;
    if (Array.isArray(ls)) return bestOf(r, semi, ls[0], ls[1]);
    return spellNote(r, semi, ls);
  });
}

/** Build scale notes from a root note string and scale type */
export function buildScale(root: string, type: ScaleType): string[] {
  const r = normalizeRoot(root);
  const p = parseNoteFull(r);
  return SCALE_INTERVALS[type].map(([semi, ls]) => {
    if (semi === 0)  return r;
    if (semi === 12) return `${p.letter}${semiToAcc(p.accSemi)}${p.octave + 1}`;
    if (Array.isArray(ls)) return bestOf(r, semi, ls[0], ls[1]);
    return spellNote(r, semi, ls);
  });
}

/** Pick a random root note within the given octave range */
export function randomRoot(minOctave = 3, maxOctave = 4): string {
  const noteIndex = Math.floor(Math.random() * 12);
  const octave = minOctave + Math.floor(Math.random() * (maxOctave - minOctave + 1));
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/** Pick a random octave (inclusive range) for a fixed pitch class */
export function randomOctaveNote(name: string, minOctave = 3, maxOctave = 5): string {
  const octave = minOctave + Math.floor(Math.random() * (maxOctave - minOctave + 1));
  return `${name}${octave}`;
}

// ─── Voicings ────────────────────────────────────────────────────────────────

export type VoicingId = "close" | "open" | "spread" | "wide";
export interface VoicingDef { id: VoicingId; label: string; }

function raiseOctave(noteStr: string): string {
  const p = parseNoteFull(noteStr);
  return `${p.letter}${semiToAcc(p.accSemi)}${p.octave + 1}`;
}

/**
 * Rearrange root-position close notes into the specified voicing.
 * Root (notes[0]) is always the lowest note in the result.
 *
 * close:  C4-E4-G4          (no change)
 * open:   C4-G4-E5          raise the 3rd (n[1]) — classic open triad
 * spread: C4-G4-E5-Bb5      raise the 3rd (n[1]) and 7th (n[3]) — drop-2-style jazz voicing
 * wide:   C4-E4-G5-Bb5      raise the 5th (n[2]) and 7th (n[3]) — bass pair + high pair
 */
export function applyVoicing(notes: string[], voicingId: VoicingId): string[] {
  if (voicingId === "close") return [...notes];
  const r = [...notes];
  if (voicingId === "open") {
    r[1] = raiseOctave(r[1]);
  } else if (voicingId === "spread") {
    r[1] = raiseOctave(r[1]);
    r[3] = raiseOctave(r[3]);
  } else if (voicingId === "wide") {
    r[2] = raiseOctave(r[2]);
    r[3] = raiseOctave(r[3]);
  }
  return r.sort((a, b) => parseNoteFull(a).midi - parseNoteFull(b).midi);
}

/** Return the voicings applicable to this chord type (based on note count). */
export function getVoicings(type: ChordType): VoicingDef[] {
  const count = CHORD_INTERVALS[type].length;
  if (count <= 3) return [
    { id: "close", label: "Close" },
    { id: "open",  label: "Open"  },
  ];
  if (count === 4) return [
    { id: "close",  label: "Close"  },
    { id: "spread", label: "Spread" },
    { id: "wide",   label: "Wide"   },
  ];
  return [{ id: "close", label: "Close" }];
}

/** Pick a random voicing for the given chord type. */
export function randomVoicing(type: ChordType): VoicingId {
  const vs = getVoicings(type);
  return vs[Math.floor(Math.random() * vs.length)].id;
}

/**
 * Apply an inversion to root-position close notes by raising the lowest `n` notes
 * by one octave, then re-sorting ascending.
 *
 * applyInversion([C3,E3,G3], 0) → [C3,E3,G3]        root position (no change)
 * applyInversion([C3,E3,G3], 1) → [E3,G3,C4]        1st inversion (3rd in bass)
 * applyInversion([C3,E3,G3], 2) → [G3,C4,E4]        2nd inversion (5th in bass)
 * applyInversion([C3,E3,G3,B3],3) → [B3,C4,E4,G4]   3rd inversion (7th in bass)
 */
export function applyInversion(notes: string[], inversion: number): string[] {
  if (inversion === 0) return [...notes];
  const result = [...notes];
  for (let i = 0; i < inversion && i < result.length - 1; i++) {
    result[i] = raiseOctave(result[i]);
  }
  return result.sort((a, b) => parseNoteFull(a).midi - parseNoteFull(b).midi);
}

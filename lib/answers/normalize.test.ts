// Run with: npm run test:answers
import test from "node:test";
import assert from "node:assert/strict";
import { resolveAnswer } from "./normalize";
import type { Category } from "@/types/exercise";

// Snapshot of the real answer vocabularies (all difficulties) as of 2026-10-26.
const VOCAB: Record<Category, string[]> = {
  note: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  interval: [
    "Unison", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone", "Perfect 5th",
    "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave", "Minor 9th", "Major 9th", "Minor 10th", "Major 10th",
  ],
  chord: [
    "Major", "Minor", "Dominant 7th", "Diminished", "Major 7th", "Minor 7th", "Augmented", "Diminished 7th",
    "Half-Diminished", "Major 9th", "Minor 9th", "Major 6th", "Minor 6th", "Sus4", "Sus9", "Major add2", "Major add4",
    "Major - 1st Inversion", "Major - 2nd Inversion", "Minor - 1st Inversion", "Minor - 2nd Inversion",
    "Dominant 7th - Root Position", "Dominant 7th - 1st Inversion", "Dominant 7th - 2nd Inversion", "Dominant 7th - 3rd Inversion",
    "Major 7th - Root Position", "Major 7th - 1st Inversion", "Major 7th - 2nd Inversion", "Major 7th - 3rd Inversion",
    "Minor 7th - Root Position", "Minor 7th - 1st Inversion", "Minor 7th - 2nd Inversion", "Minor 7th - 3rd Inversion",
    "Major 7th #11", "Major 6/9", "Major 13th", "Augmented Major 7th", "Major 9th #11", "Minor 11th", "Minor 13th",
    "Minor-Major 7th", "Minor-Major 9th", "Dominant 9th", "Dominant 13th", "Dominant 7th #11", "Dominant 9th #11",
    "Dominant 13th #11", "7♯9", "7♭9", "7♭13", "7♭9♭13", "7♯9♭13", "7♭9♯11", "7♯9♯11", "Augmented 7th", "Dominant 7th ♭5",
    "7sus4", "9sus4", "13sus4",
  ],
  progression: [
    "iv7 - bVII7 - Imaj7", "im7 - im7 - bIIm7 - bIIm7", "iim7b5 - V7b9 - im7", "I - VI7 - ii - V7", "bIII - bVI - bII - V",
    "i - iv - V7 - i", "ii - IV - I - V", "ii7 - V7 - Imaj7", "iii7 - VI7 - ii7 - V7", "Imaj7 - IVmaj7 - iii7 - VI7",
    "I7 - IV7 - I7 - V7", "I - bVI - bVII - I", "im7 - bVII7 - bVI7 - V7", "I - IV - V", "I - V - vi - IV", "ii - V - I",
    "I - IV - V - I", "i - iv - v - i", "Imaj7 - bVImaj7 - bIImaj7 - V7", "I - vi - IV - V",
  ],
  scale: [
    "Major", "Minor Scale", "Harmonic Minor", "Blues", "Pentatonic Major", "Mixolydian", "Dorian", "Phrygian", "Locrian",
    "Lydian", "Lydian Dominant", "Altered", "Melodic Minor", "Whole-Half Diminished", "Lydian Augmented", "Mixolydian ♭6",
    "Whole Tone", "Dorian ♭2", "Locrian ♯2", "Half-Whole Diminished",
  ],
};

function label(cat: Category, text: string) {
  const r = resolveAnswer(cat, text, VOCAB[cat]);
  return r.kind === "none" ? null : `${r.kind}:${r.label}`;
}

test("every vocabulary label resolves to itself", () => {
  for (const cat of Object.keys(VOCAB) as Category[]) {
    for (const l of VOCAB[cat]) assert.equal(label(cat, l), `match:${l}`, `${cat}: ${l}`);
  }
});

test("chord shorthand", () => {
  const cases: Record<string, string> = {
    maj7: "Major 7th", Cmaj7: "Major 7th", "Δ7": "Major 7th", M7: "Major 7th", dom7: "Dominant 7th", "7": "Dominant 7th",
    Bb7: "Dominant 7th", m7: "Minor 7th", Dm7: "Minor 7th", "-7": "Minor 7th", min7: "Minor 7th", m7b5: "Half-Diminished",
    "ø": "Half-Diminished", dim: "Diminished", "°": "Diminished", dim7: "Diminished 7th", aug: "Augmented", "+": "Augmented",
    "7#9": "7♯9", "dom7#9": "7♯9", "7b9": "7♭9", "7b9b13": "7♭9♭13", "9": "Dominant 9th", "13": "Dominant 13th", "9#11": "Dominant 9th #11",
    m9: "Minor 9th", M9: "Major 9th", maj9: "Major 9th", "6": "Major 6th", m6: "Minor 6th", "6/9": "Major 6/9", mM7: "Minor-Major 7th",
    "m(maj7)": "Minor-Major 7th", "maj7#5": "Augmented Major 7th", sus: "Sus4", add2: "Major add2", "7b5": "Dominant 7th ♭5",
    "7#5": "Augmented 7th", b9: "7♭9", "#9": "7♯9", b13: "7♭13", "b9b13": "7♭9♭13", "#9b13": "7♯9♭13", "b9#11": "7♭9♯11", "#9#11": "7♯9♯11",
    "♭9": "7♭9", "#11": "Dominant 7th #11", b5: "Dominant 7th ♭5", "#5": "Augmented 7th", B9: "Dominant 9th", "Bb9": "Dominant 9th",
    "major triad": "Major", m: "Minor", M: "Major", "dominant seventh": "Dominant 7th",
  };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("chord", typed), `match:${want}`, typed);
});

test("m9 never resolves to Major 9th, M9 never to Minor 9th", () => {
  assert.notEqual(label("chord", "m9"), "match:Major 9th");
  assert.notEqual(label("chord", "M9"), "match:Minor 9th");
  assert.equal(label("interval", "m9"), "match:Minor 9th");
  assert.equal(label("interval", "M9"), "match:Major 9th");
});

test("chord inversions", () => {
  const cases: Record<string, string> = {
    "dom7 1st inv": "Dominant 7th - 1st Inversion",
    "dominant 7th first inversion": "Dominant 7th - 1st Inversion",
    "maj7 root position": "Major 7th - Root Position",
    "min7 3rd inversion": "Minor 7th - 3rd Inversion",
    "major second inversion": "Major - 2nd Inversion",
    "m 1st inv": "Minor - 1st Inversion",
    // number / word styles
    "7 inv2": "Dominant 7th - 2nd Inversion", "dom7 inv 3": "Dominant 7th - 3rd Inversion", "m7 3": "Minor 7th - 3rd Inversion",
    "maj7 first": "Major 7th - 1st Inversion", "maj7 1": "Major 7th - 1st Inversion", "7 r": "Dominant 7th - Root Position",
    "maj7 root": "Major 7th - Root Position", "m 2": "Minor - 2nd Inversion", "major 1": "Major - 1st Inversion",
    "Cmaj7 2nd inv": "Major 7th - 2nd Inversion", "m7 1st inversion": "Minor 7th - 1st Inversion",
    // slash + bass degree
    "7/3": "Dominant 7th - 1st Inversion", "m7/b3": "Minor 7th - 1st Inversion", "maj7/5": "Major 7th - 2nd Inversion",
    "7/7": "Dominant 7th - 3rd Inversion", "m7/b7": "Minor 7th - 3rd Inversion", "maj7/7": "Major 7th - 3rd Inversion",
    "m/5": "Minor - 2nd Inversion", "maj/3": "Major - 1st Inversion",
    // slash chords with a bass note
    "C/E": "Major - 1st Inversion", "C/G": "Major - 2nd Inversion", "Cm/Eb": "Minor - 1st Inversion", "Am/E": "Minor - 2nd Inversion",
    "G7/B": "Dominant 7th - 1st Inversion", "G7/D": "Dominant 7th - 2nd Inversion", "G7/F": "Dominant 7th - 3rd Inversion",
    "Dm7/F": "Minor 7th - 1st Inversion", "Cmaj7/B": "Major 7th - 3rd Inversion", "Cmaj7/C": "Major 7th - Root Position",
  };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("chord", typed), `match:${want}`, typed);
});

test("inversion shorthand that doesn't fit is not guessed", () => {
  assert.equal(label("chord", "C/D"), null);
  assert.equal(label("chord", "m 3"), null);
  assert.equal(label("chord", "7/9"), null);
});

test("scales", () => {
  const cases: Record<string, string> = {
    dorian: "Dorian", "D dorian": "Dorian", "dorian scale": "Dorian", ionian: "Major", aeolian: "Minor Scale", "natural minor": "Minor Scale",
    "harmonic minor": "Harmonic Minor", "melodic minor": "Melodic Minor", "lydian b7": "Lydian Dominant", "lydian #5": "Lydian Augmented",
    "mixolydian b6": "Mixolydian ♭6", "dorian b2": "Dorian ♭2", "locrian #2": "Locrian ♯2", "whole tone": "Whole Tone",
    "super locrian": "Altered", "half whole": "Half-Whole Diminished", "whole half": "Whole-Half Diminished", "major pentatonic": "Pentatonic Major",
  };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("scale", typed), `match:${want}`, typed);
});

test("intervals", () => {
  const cases: Record<string, string> = {
    m2: "Minor 2nd", M3: "Major 3rd", b3: "Minor 3rd", p4: "Perfect 4th", "perfect fourth": "Perfect 4th", p5: "Perfect 5th", tt: "Tritone",
    "minor ninth": "Minor 9th", b9: "Minor 9th", "major tenth": "Major 10th", m10: "Minor 10th", p8: "Octave", unison: "Unison",
  };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("interval", typed), `match:${want}`, typed);
});

test("notes incl. flats and unicode accidentals", () => {
  const cases: Record<string, string> = { c: "C", "c#": "C#", "C♯": "C#", db: "C#", Db: "C#", "E♭": "D#", bb: "A#", Bb: "A#", b: "B", "g sharp": "G#" };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("note", typed), `match:${want}`, typed);
});

test("progressions: loose separators and case", () => {
  const cases: Record<string, string> = {
    "ii v i": "ii - V - I", "ii-V-I": "ii - V - I", "ii,V,I": "ii - V - I", "ii > V > I": "ii - V - I", "ii→V→I": "ii - V - I",
    "I IV V": "I - IV - V", "ii7-V7-Imaj7": "ii7 - V7 - Imaj7", "iim7b5 V7b9 im7": "iim7b5 - V7b9 - im7", "Imaj7 IVmaj7 iii7 VI7": "Imaj7 - IVmaj7 - iii7 - VI7",
    "ii7 v7 IM7": "ii7 - V7 - Imaj7", "I - ♭VI - ♭VII - I": "I - bVI - bVII - I",
  };
  for (const [typed, want] of Object.entries(cases)) assert.equal(label("progression", typed), `match:${want}`, typed);
});

test("progressions: exact case wins; ambiguous all-lowercase is not guessed", () => {
  assert.equal(label("progression", "i - iv - V7 - i"), "match:i - iv - V7 - i");
  assert.equal(label("progression", "i iv v i"), "match:i - iv - v - i");
  assert.equal(label("progression", "I IV V I"), "match:I - IV - V - I");
  // all-lowercase text that matches two labels differing only by case is ambiguous -> no guess
  assert.equal(label("progression", "I iv V i"), null);
});

test("typos suggest, nonsense and empty do not match", () => {
  assert.equal(label("scale", "Dorain"), "suggest:Dorian");
  assert.equal(label("scale", "mixolidyan"), "suggest:Mixolydian");
  assert.equal(label("chord", "Dominent 7th"), "suggest:Dominant 7th");
  assert.equal(label("scale", "asdfgh"), null);
  assert.equal(label("chord", ""), null);
  assert.equal(label("chord", "   "), null);
});

test("recognized-but-not-in-vocabulary names are real answers", () => {
  const r = resolveAnswer("scale", "ionian", ["Dorian", "Lydian"]);
  assert.deepEqual(r, { kind: "match", label: "Major" });
});

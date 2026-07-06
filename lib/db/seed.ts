import { hashSync } from "bcryptjs";
import { db, client } from "./index";
import * as schema from "./schema";

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const C_MAJOR_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const ALL_INTERVALS = [
  "Unison", "Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd",
  "Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th", "Major 6th",
  "Minor 7th", "Major 7th", "Octave",
];
const CHORD_TYPES = ["Major", "Minor", "Dominant 7th", "Major 7th", "Diminished", "Augmented"];
const PROGRESSION_NAMES = [
  "I - IV - V", "I - V - vi - IV", "ii - V - I", "I - vi - IV - V",
  "I - IV - vi - V", "vi - IV - I - V", "I - III - IV - iv", "ii - IV - I - V",
];
const SCALE_TYPES = ["Major", "Dorian", "Mixolydian", "Blues", "Pentatonic Major", "Harmonic Minor"];

const JAZZ_MAJOR_CHOICES = ["Major 7th", "Major 9th", "Major 7th #11", "Major 9th #11", "Major 13th", "Major 6th", "Major 6/9", "Augmented Major 7th"];
const JAZZ_MINOR_CHOICES = ["Minor 7th", "Minor 9th", "Minor 11th", "Minor 13th", "Minor-Major 7th", "Minor-Major 9th", "Minor 6th"];
const JAZZ_DOM_CHOICES = ["Dominant 7th", "Dominant 9th", "Dominant 13th", "Dominant 7th #11", "Dominant 9th #11", "Dominant 13th #11"];
const JAZZ_ALTERED_CHOICES = ["7♭9", "7♯9", "7♭13", "7♭9♭13", "7♯9♭13", "7♭9♯11", "7♯9♯11", "Augmented 7th", "Dominant 7th ♭5"];
const JAZZ_SUS_CHOICES = ["7sus4", "9sus4", "13sus4"];
const JAZZ_DIM_CHOICES = ["Half-Diminished", "Diminished 7th"];
const JAZZ_PROGRESSION_NAMES = [
  "ii7 - V7 - Imaj7", "iim7b5 - V7b9 - im7", "Imaj7 - VI7 - ii7 - V7",
  "I7 - IV7 - I7 - V7", "ii7 - bII7 - Imaj7", "iii7 - VI7 - ii7 - V7",
  "Imaj7 - IVmaj7 - iii7 - VI7", "im7 - bVII7 - bVI7 - V7",
];
const JAZZ_SCALE_TYPES = ["Major", "Melodic Minor", "Lydian", "Lydian Dominant", "Altered", "Harmonic Minor", "Dorian"];

const noteExercises = [
  { title: "C — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "C" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "C" },
  { title: "D — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "D" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "D" },
  { title: "E — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "E" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "E" },
  { title: "F — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "F" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "F" },
  { title: "G — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "G" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "G" },
  { title: "A — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "A" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "A" },
  { title: "B — Natural", prompt: "What note is this?", difficulty: "easy" as const, config: JSON.stringify({ note: "B" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "B" },
  { title: "C — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "C" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "C" },
  { title: "D — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "D" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "D" },
  { title: "E — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "E" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "E" },
  { title: "F — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "F" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "F" },
  { title: "G — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "G" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "G" },
  { title: "A — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "A" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "A" },
  { title: "B — 3 octaves", prompt: "What note is this?", difficulty: "medium" as const, config: JSON.stringify({ note: "B" }), choices: JSON.stringify(C_MAJOR_NOTES), answer: "B" },
  { title: "C", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "C" }), choices: JSON.stringify(ALL_NOTES), answer: "C" },
  { title: "C# / D♭", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "C#" }), choices: JSON.stringify(ALL_NOTES), answer: "C#" },
  { title: "D", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "D" }), choices: JSON.stringify(ALL_NOTES), answer: "D" },
  { title: "D# / E♭", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "D#" }), choices: JSON.stringify(ALL_NOTES), answer: "D#" },
  { title: "E", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "E" }), choices: JSON.stringify(ALL_NOTES), answer: "E" },
  { title: "F", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "F" }), choices: JSON.stringify(ALL_NOTES), answer: "F" },
  { title: "F# / G♭", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "F#" }), choices: JSON.stringify(ALL_NOTES), answer: "F#" },
  { title: "G", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "G" }), choices: JSON.stringify(ALL_NOTES), answer: "G" },
  { title: "G# / A♭", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "G#" }), choices: JSON.stringify(ALL_NOTES), answer: "G#" },
  { title: "A", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "A" }), choices: JSON.stringify(ALL_NOTES), answer: "A" },
  { title: "A# / B♭", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "A#" }), choices: JSON.stringify(ALL_NOTES), answer: "A#" },
  { title: "B", prompt: "What note is this?", difficulty: "hard" as const, config: JSON.stringify({ note: "B" }), choices: JSON.stringify(ALL_NOTES), answer: "B" },
];

const intervalExercises = [
  { title: "Perfect Unison",    prompt: "What interval is this?", difficulty: "easy"   as const, config: JSON.stringify({ semitones: 0,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Unison" },
  { title: "Perfect Octave",    prompt: "What interval is this?", difficulty: "easy"   as const, config: JSON.stringify({ semitones: 12, playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Octave" },
  { title: "Perfect 5th",       prompt: "What interval is this?", difficulty: "easy"   as const, config: JSON.stringify({ semitones: 7,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Perfect 5th" },
  { title: "Major 3rd",         prompt: "What interval is this?", difficulty: "easy"   as const, config: JSON.stringify({ semitones: 4,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Major 3rd" },
  { title: "Minor 3rd",         prompt: "What interval is this?", difficulty: "medium" as const, config: JSON.stringify({ semitones: 3,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Minor 3rd" },
  { title: "Perfect 4th (melodic)", prompt: "What interval is this?", difficulty: "medium" as const, config: JSON.stringify({ semitones: 5, playMode: "melodic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Perfect 4th" },
  { title: "Major 6th",         prompt: "What interval is this?", difficulty: "medium" as const, config: JSON.stringify({ semitones: 9,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Major 6th" },
  { title: "Minor 7th (melodic)", prompt: "What interval is this?", difficulty: "medium" as const, config: JSON.stringify({ semitones: 10, playMode: "melodic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Minor 7th" },
  { title: "Tritone (melodic)", prompt: "What interval is this?", difficulty: "hard"   as const, config: JSON.stringify({ semitones: 6,  playMode: "melodic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Tritone" },
  { title: "Minor 2nd (melodic)", prompt: "What interval is this?", difficulty: "hard" as const, config: JSON.stringify({ semitones: 1,  playMode: "melodic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Minor 2nd" },
  { title: "Major 7th",         prompt: "What interval is this?", difficulty: "hard"   as const, config: JSON.stringify({ semitones: 11, playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Major 7th" },
  { title: "Minor 6th",         prompt: "What interval is this?", difficulty: "hard"   as const, config: JSON.stringify({ semitones: 8,  playMode: "harmonic" }), choices: JSON.stringify(ALL_INTERVALS), answer: "Minor 6th" },
];

const chordExercises = [
  { title: "Major Chord",     prompt: "What type of chord is this?", difficulty: "easy"   as const, config: JSON.stringify({ type: "major" }), choices: JSON.stringify(CHORD_TYPES), answer: "Major" },
  { title: "Minor Chord",     prompt: "What type of chord is this?", difficulty: "easy"   as const, config: JSON.stringify({ type: "minor" }), choices: JSON.stringify(CHORD_TYPES), answer: "Minor" },
  { title: "Major Chord",     prompt: "What type of chord is this?", difficulty: "easy"   as const, config: JSON.stringify({ type: "major" }), choices: JSON.stringify(CHORD_TYPES), answer: "Major" },
  { title: "Minor Chord",     prompt: "What type of chord is this?", difficulty: "easy"   as const, config: JSON.stringify({ type: "minor" }), choices: JSON.stringify(CHORD_TYPES), answer: "Minor" },
  { title: "Dominant 7th",    prompt: "What type of chord is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "dom7" }), choices: JSON.stringify(CHORD_TYPES), answer: "Dominant 7th" },
  { title: "Major 7th",       prompt: "What type of chord is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "maj7" }), choices: JSON.stringify(CHORD_TYPES), answer: "Major 7th" },
  { title: "Minor Chord",     prompt: "What type of chord is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "minor" }), choices: JSON.stringify(CHORD_TYPES), answer: "Minor" },
  { title: "Diminished Triad", prompt: "What type of chord is this?", difficulty: "hard"  as const, config: JSON.stringify({ type: "dim" }), choices: JSON.stringify(CHORD_TYPES), answer: "Diminished" },
  { title: "Augmented Triad", prompt: "What type of chord is this?", difficulty: "hard"   as const, config: JSON.stringify({ type: "aug" }), choices: JSON.stringify(CHORD_TYPES), answer: "Augmented" },
  { title: "Diminished Triad", prompt: "What type of chord is this?", difficulty: "hard"  as const, config: JSON.stringify({ type: "dim" }), choices: JSON.stringify(CHORD_TYPES), answer: "Diminished" },
  { title: "Major 7th",       prompt: "What type of chord is this?", difficulty: "hard"   as const, config: JSON.stringify({ type: "maj7" }), choices: JSON.stringify(CHORD_TYPES), answer: "Major 7th" },
];

const progressionExercises = [
  { title: "The Classic I - IV - V", prompt: "What chord progression is this?", difficulty: "easy" as const, config: JSON.stringify({ key: "C", chords: [["C4", "E4", "G4"], ["F4", "A4", "C5"], ["G4", "B4", "D5"]], romanNumerals: ["I", "IV", "V"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "I - IV - V" },
  { title: "Pop Progression I - V - vi - IV", prompt: "What chord progression is this?", difficulty: "easy" as const, config: JSON.stringify({ key: "C", chords: [["C4", "E4", "G4"], ["G4", "B4", "D5"], ["A4", "C5", "E5"], ["F4", "A4", "C5"]], romanNumerals: ["I", "V", "vi", "IV"], tempo: 76 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "I - V - vi - IV" },
  { title: "Jazz ii - V - I", prompt: "What chord progression is this?", difficulty: "medium" as const, config: JSON.stringify({ key: "C", chords: [["D4", "F4", "A4", "C5"], ["G4", "B4", "D5", "F5"], ["C4", "E4", "G4", "B4"]], romanNumerals: ["ii", "V", "I"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "ii - V - I" },
  { title: "50s Progression I - vi - IV - V", prompt: "What chord progression is this?", difficulty: "medium" as const, config: JSON.stringify({ key: "C", chords: [["C4", "E4", "G4"], ["A4", "C5", "E5"], ["F4", "A4", "C5"], ["G4", "B4", "D5"]], romanNumerals: ["I", "vi", "IV", "V"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "I - vi - IV - V" },
  { title: "I - IV - vi - V", prompt: "What chord progression is this?", difficulty: "medium" as const, config: JSON.stringify({ key: "C", chords: [["C4", "E4", "G4"], ["F4", "A4", "C5"], ["A4", "C5", "E5"], ["G4", "B4", "D5"]], romanNumerals: ["I", "IV", "vi", "V"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "I - IV - vi - V" },
  { title: "vi - IV - I - V", prompt: "What chord progression is this?", difficulty: "medium" as const, config: JSON.stringify({ key: "C", chords: [["A4", "C5", "E5"], ["F4", "A4", "C5"], ["C4", "E4", "G4"], ["G4", "B4", "D5"]], romanNumerals: ["vi", "IV", "I", "V"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "vi - IV - I - V" },
  { title: "I - III - IV - iv (minor mixture)", prompt: "What chord progression is this?", difficulty: "hard" as const, config: JSON.stringify({ key: "C", chords: [["C4", "E4", "G4"], ["E4", "G#4", "B4"], ["F4", "A4", "C5"], ["F4", "G#4", "C5"]], romanNumerals: ["I", "III", "IV", "iv"], tempo: 72 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "I - III - IV - iv" },
  { title: "ii - IV - I - V", prompt: "What chord progression is this?", difficulty: "hard" as const, config: JSON.stringify({ key: "C", chords: [["D4", "F4", "A4"], ["F4", "A4", "C5"], ["C4", "E4", "G4"], ["G4", "B4", "D5"]], romanNumerals: ["ii", "IV", "I", "V"], tempo: 80 }), choices: JSON.stringify(PROGRESSION_NAMES), answer: "ii - IV - I - V" },
];

const SCALE_EXPLANATIONS: Record<string, string> = {
  major: "The major scale is the foundation of Western music, built from a pattern of whole and half steps (W-W-H-W-W-W-H). It has a bright, happy sound and is the reference point every other mode and scale is measured against.",
  harmonic_minor: "The harmonic minor scale is a natural minor scale with a raised 7th degree, creating a dramatic step-and-a-half gap between the 6th and 7th notes. That gap gives it an exotic, Middle-Eastern or classical sound, and it's what makes the V chord in minor keys major instead of minor.",
  blues: "The blues scale takes the minor pentatonic scale and adds a 'blue note' — a flattened 5th — right in the middle. That extra note is what gives blues, rock, and jazz solos their gritty, expressive edge.",
  pentatonic_major: "The major pentatonic scale is the major scale with the 4th and 7th degrees removed, leaving just five notes with no half-steps between them. That absence of half-steps makes it nearly impossible to hit a 'wrong' note, which is why it's a go-to scale for folk, country, and rock melodies.",
  dorian: "The Dorian mode is the mode that starts from the second note in the major scale. It has the notes of a minor scale but with a sharp sixth, and is often used in latin and blues songs.",
  mixolydian: "The Mixolydian mode starts from the 5th note of the major scale and is identical to major except for a flattened 7th degree. That lowered 7th gives it a bluesy, dominant-chord sound, and it's a favorite in rock, blues, and folk music.",
  melodic_minor: "The (jazz) melodic minor scale is a natural minor scale with both the 6th and 7th degrees raised, so only the 3rd stays minor. It bridges the gap between minor and major sounds, and is a core building block for jazz improvisation over minor chords.",
  lydian: "The Lydian mode is the major scale with a raised 4th degree, giving it a dreamy, floating quality without a strong pull back to the tonic. It's widely used in film scores and jazz for its bright, slightly unresolved color.",
  lydian_b7: "The Lydian Dominant scale combines the raised 4th of Lydian with the flattened 7th of Mixolydian. That mix of 'bright' and 'bluesy' makes it the go-to scale for dominant 7th chords in jazz, especially on altered dominants.",
  altered: "The altered scale (also called 'super-Locrian') raises or lowers every note relative to the major scale except the root, cramming in a flat 9th, sharp 9th, sharp 11th, and flat 13th. It's built specifically to resolve tension over dominant 7th chords right before they resolve, giving jazz improvisation its most 'outside' sound.",
};

const scaleExercises = [
  { title: "Major Scale", prompt: "What scale type is this?", difficulty: "easy" as const, config: JSON.stringify({ type: "major" }), choices: JSON.stringify(SCALE_TYPES), answer: "Major", explanation: SCALE_EXPLANATIONS.major },
  { title: "Major Scale", prompt: "What scale type is this?", difficulty: "easy" as const, config: JSON.stringify({ type: "major" }), choices: JSON.stringify(SCALE_TYPES), answer: "Major", explanation: SCALE_EXPLANATIONS.major },
  { title: "Harmonic Minor Scale", prompt: "What scale type is this?", difficulty: "easy" as const, config: JSON.stringify({ type: "harmonic_minor" }), choices: JSON.stringify(SCALE_TYPES), answer: "Harmonic Minor", explanation: SCALE_EXPLANATIONS.harmonic_minor },
  { title: "Blues Scale", prompt: "What scale type is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "blues" }), choices: JSON.stringify(SCALE_TYPES), answer: "Blues", explanation: SCALE_EXPLANATIONS.blues },
  { title: "Pentatonic Major Scale", prompt: "What scale type is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "pentatonic_major" }), choices: JSON.stringify(SCALE_TYPES), answer: "Pentatonic Major", explanation: SCALE_EXPLANATIONS.pentatonic_major },
  { title: "Dorian Scale", prompt: "What scale type is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "dorian" }), choices: JSON.stringify(SCALE_TYPES), answer: "Dorian", explanation: SCALE_EXPLANATIONS.dorian },
  { title: "Mixolydian Scale", prompt: "What scale type is this?", difficulty: "medium" as const, config: JSON.stringify({ type: "mixolydian" }), choices: JSON.stringify(SCALE_TYPES), answer: "Mixolydian", explanation: SCALE_EXPLANATIONS.mixolydian },
  { title: "Blues Scale", prompt: "What scale type is this?", difficulty: "hard" as const, config: JSON.stringify({ type: "blues" }), choices: JSON.stringify(SCALE_TYPES), answer: "Blues", explanation: SCALE_EXPLANATIONS.blues },
  { title: "Harmonic Minor Scale", prompt: "What scale type is this?", difficulty: "hard" as const, config: JSON.stringify({ type: "harmonic_minor" }), choices: JSON.stringify(SCALE_TYPES), answer: "Harmonic Minor", explanation: SCALE_EXPLANATIONS.harmonic_minor },
  { title: "Dorian Scale", prompt: "What scale type is this?", difficulty: "hard" as const, config: JSON.stringify({ type: "dorian" }), choices: JSON.stringify(SCALE_TYPES), answer: "Dorian", explanation: SCALE_EXPLANATIONS.dorian },
  { title: "Mixolydian Scale", prompt: "What scale type is this?", difficulty: "hard" as const, config: JSON.stringify({ type: "mixolydian" }), choices: JSON.stringify(SCALE_TYPES), answer: "Mixolydian", explanation: SCALE_EXPLANATIONS.mixolydian },
];

const jazzChordExercises = [
  { title: "Major 7th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj7",    family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 7th" },
  { title: "Major 9th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj9",    family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 9th" },
  { title: "Major 7th ♯11 (Lydian)",   prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj7s11", family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 7th #11" },
  { title: "Major 6th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj6",    family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 6th" },
  { title: "Major 6/9",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj6_9",  family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 6/9" },
  { title: "Major 13th",                prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj13",   family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 13th" },
  { title: "Augmented Major 7th",       prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "augMaj7", family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Augmented Major 7th" },
  { title: "Major 9th ♯11",            prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "maj9s11", family: "major" }), choices: JSON.stringify(JAZZ_MAJOR_CHOICES), answer: "Major 9th #11" },
  { title: "Minor 9th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min9",    family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor 9th" },
  { title: "Minor 11th",                prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min11",   family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor 11th" },
  { title: "Minor 13th",                prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min13",   family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor 13th" },
  { title: "Minor-Major 7th",           prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "minMaj7", family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor-Major 7th" },
  { title: "Minor-Major 9th",           prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "minMaj9", family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor-Major 9th" },
  { title: "Minor 6th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min6",    family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor 6th" },
  { title: "Minor 7th",                 prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min7",    family: "minor" }), choices: JSON.stringify(JAZZ_MINOR_CHOICES), answer: "Minor 7th" },
  { title: "Dominant 9th",              prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom9",     family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 9th" },
  { title: "Dominant 13th",             prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom13",    family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 13th" },
  { title: "Dominant 7th ♯11",         prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7s11",  family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 7th #11" },
  { title: "Dominant 9th ♯11",         prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom9s11",  family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 9th #11" },
  { title: "Dominant 13th ♯11",        prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom13s11", family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 13th #11" },
  { title: "Dominant 9th",             prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom9",     family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 9th" },
  { title: "Dominant 13th",            prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom13",    family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 13th" },
  { title: "Dominant 7th",             prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7",     family: "dominant" }), choices: JSON.stringify(JAZZ_DOM_CHOICES), answer: "Dominant 7th" },
  { title: "7♯9 (Hendrix Chord)",      prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7s9",    family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♯9" },
  { title: "7♭9",                      prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7b9",    family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♭9" },
  { title: "7♭13",                     prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7b13",   family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♭13" },
  { title: "7♭9♭13",                  prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7b9b13", family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♭9♭13" },
  { title: "7♯9♭13",                  prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7s9b13", family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♯9♭13" },
  { title: "7♭9♯11",                  prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7b9s11", family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♭9♯11" },
  { title: "7♯9♯11",                  prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7s9s11", family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "7♯9♯11" },
  { title: "Augmented 7th (7♯5)",      prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7s5",    family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "Augmented 7th" },
  { title: "Dominant 7th ♭5",          prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dom7b5",    family: "altered" }), choices: JSON.stringify(JAZZ_ALTERED_CHOICES), answer: "Dominant 7th ♭5" },
  { title: "7sus4",                     prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus7",  family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "7sus4" },
  { title: "9sus4",                     prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus9",  family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "9sus4" },
  { title: "13sus4",                    prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus13", family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "13sus4" },
  { title: "7sus4",                     prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus7",  family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "7sus4" },
  { title: "9sus4",                     prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus9",  family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "9sus4" },
  { title: "13sus4",                    prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "sus13", family: "suspended" }), choices: JSON.stringify(JAZZ_SUS_CHOICES), answer: "13sus4" },
  { title: "Diminished 7th",            prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dim7",   family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Diminished 7th" },
  { title: "Half-Diminished (m7♭5)",   prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min7b5", family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Half-Diminished" },
  { title: "Diminished 7th",            prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dim7",   family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Diminished 7th" },
  { title: "Half-Diminished (m7♭5)",   prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min7b5", family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Half-Diminished" },
  { title: "Diminished 7th",            prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "dim7",   family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Diminished 7th" },
  { title: "Half-Diminished (m7♭5)",   prompt: "What type of chord is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "min7b5", family: "diminished" }), choices: JSON.stringify(JAZZ_DIM_CHOICES), answer: "Half-Diminished" },
];

const jazzScaleExercises = [
  { title: "Melodic Minor Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "melodic_minor" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Melodic Minor", explanation: SCALE_EXPLANATIONS.melodic_minor },
  { title: "Lydian Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "lydian" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Lydian", explanation: SCALE_EXPLANATIONS.lydian },
  { title: "Lydian Dominant Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "lydian_b7" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Lydian Dominant", explanation: SCALE_EXPLANATIONS.lydian_b7 },
  { title: "Altered Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "altered" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Altered", explanation: SCALE_EXPLANATIONS.altered },
  { title: "Melodic Minor Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "melodic_minor" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Melodic Minor", explanation: SCALE_EXPLANATIONS.melodic_minor },
  { title: "Lydian Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "lydian" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Lydian", explanation: SCALE_EXPLANATIONS.lydian },
  { title: "Lydian Dominant Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "lydian_b7" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Lydian Dominant", explanation: SCALE_EXPLANATIONS.lydian_b7 },
  { title: "Altered Scale", prompt: "What scale type is this?", difficulty: "jazz" as const, config: JSON.stringify({ type: "altered" }), choices: JSON.stringify(JAZZ_SCALE_TYPES), answer: "Altered", explanation: SCALE_EXPLANATIONS.altered },
];

const jazzProgressionExercises = [
  { title: "ii7 - V7 - Imaj7 in C", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "C", chords: [["D3","F3","A3","C4"],["G3","B3","D4","F4"],["C3","E3","G3","B3"]], romanNumerals: ["ii7","V7","Imaj7"], tempo: 80 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "ii7 - V7 - Imaj7" },
  { title: "Minor ii-V-i in Am", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "Am", chords: [["B3","D4","F4","A4"],["E3","G#3","B3","D4","F4"],["A3","C4","E4","G4"]], romanNumerals: ["iim7b5","V7b9","im7"], tempo: 76 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "iim7b5 - V7b9 - im7" },
  { title: "Rhythm Changes A in C", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "C", chords: [["C3","E3","G3","B3"],["A3","C#4","E4","G4"],["D3","F3","A3","C4"],["G3","B3","D4","F4"]], romanNumerals: ["Imaj7","VI7","ii7","V7"], tempo: 90 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "Imaj7 - VI7 - ii7 - V7" },
  { title: "Jazz Blues in G", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "G", chords: [["G3","B3","D4","F4"],["C3","E3","G3","A#3"],["G3","B3","D4","F4"],["D3","F#3","A3","C4"]], romanNumerals: ["I7","IV7","I7","V7"], tempo: 84 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "I7 - IV7 - I7 - V7" },
  { title: "Tritone Sub in C", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "C", chords: [["D3","F3","A3","C4"],["C#3","F3","G#3","B3"],["C3","E3","G3","B3"]], romanNumerals: ["ii7","bII7","Imaj7"], tempo: 72 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "ii7 - bII7 - Imaj7" },
  { title: "Diatonic Cycle in C", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "C", chords: [["E3","G3","B3","D4"],["A3","C#4","E4","G4"],["D3","F3","A3","C4"],["G3","B3","D4","F4"]], romanNumerals: ["iii7","VI7","ii7","V7"], tempo: 80 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "iii7 - VI7 - ii7 - V7" },
  { title: "Imaj7-IVmaj7-iii7-VI7 in C", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "C", chords: [["C3","E3","G3","B3"],["F3","A3","C4","E4"],["E3","G3","B3","D4"],["A3","C#4","E4","G4"]], romanNumerals: ["Imaj7","IVmaj7","iii7","VI7"], tempo: 76 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "Imaj7 - IVmaj7 - iii7 - VI7" },
  { title: "Minor Jazz Descent in Am", prompt: "What chord progression is this?", difficulty: "jazz" as const, config: JSON.stringify({ key: "Am", chords: [["A3","C4","E4","G4"],["G3","B3","D4","F4"],["F3","A3","C4","E4"],["E3","G#3","B3","D4"]], romanNumerals: ["im7","bVII7","bVI7","V7"], tempo: 72 }), choices: JSON.stringify(JAZZ_PROGRESSION_NAMES), answer: "im7 - bVII7 - bVI7 - V7" },
];

async function seed() {
  console.log("Seeding exercises...");

  const allExercises = [
    ...noteExercises.map((e) => ({ ...e, category: "note" as const })),
    ...intervalExercises.map((e) => ({ ...e, category: "interval" as const })),
    ...chordExercises.map((e) => ({ ...e, category: "chord" as const })),
    ...jazzChordExercises.map((e) => ({ ...e, category: "chord" as const })),
    ...progressionExercises.map((e) => ({ ...e, category: "progression" as const })),
    ...jazzProgressionExercises.map((e) => ({ ...e, category: "progression" as const })),
    ...scaleExercises.map((e) => ({ ...e, category: "scale" as const })),
    ...jazzScaleExercises.map((e) => ({ ...e, category: "scale" as const })),
  ];

  await db.delete(schema.exercises);
  await db.insert(schema.exercises).values(allExercises);
  console.log(`Inserted ${allExercises.length} exercises.`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@eardle.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = hashSync(adminPassword, 10);

  await db
    .insert(schema.adminUsers)
    .values({ email: adminEmail, passwordHash })
    .onConflictDoNothing();
  console.log(`Admin user: ${adminEmail}`);

  console.log("Done!");
}

seed().catch(console.error).finally(() => client.end());

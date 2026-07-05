// Idempotent seed for chord progression exercises.
// - Updates choices for existing exercises to new curated pools per difficulty
// - Inserts new exercises (skips if already present by answer+difficulty)
// Run from project root: npx tsx scripts/seed-progressions.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { and, eq } from "drizzle-orm";

const EASY_CHOICES = JSON.stringify([
  "I - IV - V", "I - V - vi - IV", "I - IV - V - I", "I - V - IV - I",
  "I - I - IV - V", "I - vi - IV - V", "vi - IV - I - V", "I - IV - vi - V",
]);

const MEDIUM_CHOICES = JSON.stringify([
  "ii - V - I", "I - iii - IV - V", "I - bVII - IV - I", "i - VII - VI - VII",
  "I - vi - ii - V", "I - IV - iii - vi", "I - vi - IV - V", "I - IV - vi - V",
]);

const HARD_CHOICES = JSON.stringify([
  "I - III - IV - iv", "ii - IV - I - V", "I - bVI - bVII - I", "IV - iv - I - V",
  "I - II - IV - V", "bVI - bVII - I", "i - V7 - bVI - III", "I - bVII - bVI - V",
]);

const JAZZ_A_CHOICES = JSON.stringify([
  "ii7 - V7 - Imaj7", "iim7b5 - V7b9 - im7", "Imaj7 - VI7 - ii7 - V7",
  "I7 - IV7 - I7 - V7", "im7 - bVII7 - bVI7 - V7", "Imaj7 - I7 - IVmaj7 - iv7",
  "iii7 - VI7 - ii7 - V7", "III7 - VI7 - II7 - V7",
]);

const JAZZ_B_CHOICES = JSON.stringify([
  "ii7 - bII7 - Imaj7", "Imaj7 - IVmaj7 - iii7 - VI7", "ii7 - V7 - iii7 - VI7",
  "im7 - IV7 - bVImaj7 - V7", "Imaj7 - bVImaj7 - bIImaj7 - V7",
  "ii7 - V7 - Imaj7", "Imaj7 - VI7 - ii7 - V7", "iim7b5 - V7b9 - im7",
]);

const JAZZ_C_CHOICES = JSON.stringify([
  "iv7 - bVII7 - Imaj7", "im7 - im7 - bIIm7 - bIIm7", "iv7 - bVII7 - bIIImaj7 - bVImaj7",
  "Imaj7 - bIII7 - bVImaj7 - bII7", "ivm7 - bVII7 - bIIIm7 - bVI7",
  "ii7 - V7 - Imaj7", "im7 - bVII7 - bVI7 - V7", "Imaj7 - VI7 - ii7 - V7",
]);

// Second batch of easy/medium/hard additions — separate pools (not folded into
// EASY_CHOICES/MEDIUM_CHOICES/HARD_CHOICES above) since those already have a
// full 8 slots and blanket-reusing them would omit these new answers.
const EASY_CHOICES_2 = JSON.stringify([
  "IV - V - vi - I", "I - vi - iii - IV", "I - IV - I - V", "I - IV - I - I",
  "I - IV - V", "I - V - vi - IV", "I - IV - V - I", "I - V - IV - I",
]);

const MEDIUM_CHOICES_2 = JSON.stringify([
  "I - iii - vi - IV", "I - IV - I - IV", "vi - ii - V - I",
  "ii - V - I", "I - vi - IV - V", "I - iii - IV - V", "I - bVII - IV - I", "I - vi - ii - V",
]);

const HARD_CHOICES_2 = JSON.stringify([
  "I - VI7 - ii - V7", "bIII - bVI - bII - V", "i - iv - V7 - i",
  "I - III - IV - iv", "ii - IV - I - V", "I - bVI - bVII - I", "i - V7 - bVI - III", "I - bVII - bVI - V",
]);

const PROMPT = "What chord progression is this?";

const C4 = ["C4","E4","G4"], F4 = ["F4","A4","C5"], G4 = ["G4","B4","D5"];
const Am4 = ["A4","C5","E5"];
const C3 = ["C3","E3","G3"], D3m = ["D3","F3","A3"], E3m = ["E3","G3","B3"];
const F3 = ["F3","A3","C4"], G3 = ["G3","B3","D4"], Am3 = ["A3","C4","E4"];
const Bb3 = ["Bb3","D4","F4"], Ab3 = ["Ab3","C4","Eb4"], F3m = ["F3","Ab3","C4"];
const D3 = ["D3","F#3","A3"];
const Am_i = ["A3","C4","E4"], G_VII = ["G3","B3","D4"], F_VI = ["F3","A3","C4"];
const C_III = ["C3","E3","G3"], Dm_iv = ["D3","F3","A3"];
const E7 = ["E3","G#3","B3","D4"];
const Cmaj7 = ["C3","E3","G3","B3"], C7 = ["C3","E3","G3","Bb3"];
const Fmaj7 = ["F3","A3","C4","E4"], Fm7 = ["F3","Ab3","C4","Eb4"];
const Dm7 = ["D3","F3","A3","C4"], G7 = ["G3","B3","D4","F4"];
const Em7 = ["E3","G3","B3","D4"], A7 = ["A3","C#4","E4","G4"];
const Am7 = ["A3","C4","E4","G4"], D7 = ["D3","F#3","A3","C4"];
const E7j = ["E3","G#3","B3","D4"];
const Abmaj7 = ["Ab3","C4","Eb4","G4"], Dbmaj7 = ["Db3","F3","Ab3","C4"];
const Bb7 = ["Bb3","D4","F4","Ab4"], Ebm7 = ["Eb3","Gb3","Bb3","Db4"];
const Ebmaj7 = ["Eb3","G3","Bb3","D4"], Eb7 = ["Eb3","G3","Bb3","Db4"];
const Db7 = ["Db3","F3","Ab3","B3"], Ab7 = ["Ab3","C4","Eb4","Gb4"];
const Eb3maj = ["Eb3","G3","Bb3"], Db3maj = ["Db3","F3","Ab3"];

const newEasy = [
  { title: "Cadential Turnaround I - IV - V - I", answer: "I - IV - V - I", difficulty: "easy", topic: "pop", chords: [C4, F4, G4, C4], roman: ["I","IV","V","I"], tempo: 80, key: "C" },
  { title: "Rock Cadence I - V - IV - I", answer: "I - V - IV - I", difficulty: "easy", topic: "pop", chords: [C4, G4, F4, C4], roman: ["I","V","IV","I"], tempo: 80, key: "C" },
  { title: "Extended Tonic I - I - IV - V", answer: "I - I - IV - V", difficulty: "easy", topic: "pop", chords: [C4, C4, F4, G4], roman: ["I","I","IV","V"], tempo: 76, key: "C" },
];

const newMedium = [
  { title: "Mediant Bridge I - iii - IV - V", answer: "I - iii - IV - V", difficulty: "medium", topic: "diatonic", chords: [C3, E3m, F3, G3], roman: ["I","iii","IV","V"], tempo: 76, key: "C" },
  { title: "Mixolydian I - bVII - IV - I", answer: "I - bVII - IV - I", difficulty: "medium", topic: "modal", chords: [C3, Bb3, F3, C3], roman: ["I","bVII","IV","I"], tempo: 80, key: "C" },
  { title: "Natural Minor i - VII - VI - VII", answer: "i - VII - VI - VII", difficulty: "medium", topic: "minor", chords: [Am_i, G_VII, F_VI, G_VII], roman: ["i","VII","VI","VII"], tempo: 76, key: "Am" },
  { title: "Circle of Fifths I - vi - ii - V", answer: "I - vi - ii - V", difficulty: "medium", topic: "diatonic", chords: [C3, Am3, D3m, G3], roman: ["I","vi","ii","V"], tempo: 80, key: "C" },
  { title: "Descending I - IV - iii - vi", answer: "I - IV - iii - vi", difficulty: "medium", topic: "diatonic", chords: [C3, F3, E3m, Am3], roman: ["I","IV","iii","vi"], tempo: 80, key: "C" },
];

const newHard = [
  { title: "Borrowed Chords I - bVI - bVII - I", answer: "I - bVI - bVII - I", difficulty: "hard", topic: "modal", chords: [C3, Ab3, Bb3, C3], roman: ["I","bVI","bVII","I"], tempo: 76, key: "C" },
  { title: "Minor Subdominant IV - iv - I - V", answer: "IV - iv - I - V", difficulty: "hard", topic: "diatonic", chords: [F3, F3m, C3, G3], roman: ["IV","iv","I","V"], tempo: 80, key: "C" },
  { title: "Secondary Dominant I - II - IV - V", answer: "I - II - IV - V", difficulty: "hard", topic: "diatonic", chords: [C3, D3, F3, G3], roman: ["I","II","IV","V"], tempo: 80, key: "C" },
  { title: "Chromatic Two-Step bVI - bVII - I", answer: "bVI - bVII - I", difficulty: "hard", topic: "modal", chords: [Ab3, Bb3, C3], roman: ["bVI","bVII","I"], tempo: 72, key: "C" },
  { title: "Harmonic Minor i - V7 - bVI - III", answer: "i - V7 - bVI - III", difficulty: "hard", topic: "minor", chords: [Am_i, E7, F_VI, C_III], roman: ["i","V7","bVI","III"], tempo: 76, key: "Am" },
  { title: "Andalusian Descent I - bVII - bVI - V", answer: "I - bVII - bVI - V", difficulty: "hard", topic: "modal", chords: [C3, Bb3, Ab3, G3], roman: ["I","bVII","bVI","V"], tempo: 76, key: "C" },
];

const newEasy2 = [
  { title: "Pop-Punk Cadence IV - V - vi - I", answer: "IV - V - vi - I", difficulty: "easy", topic: "pop", chords: [F3, G3, Am3, C3], roman: ["IV","V","vi","I"], tempo: 80, key: "C" },
  { title: "Emotional Turn I - vi - iii - IV", answer: "I - vi - iii - IV", difficulty: "easy", topic: "diatonic", chords: [C3, Am3, E3m, F3], roman: ["I","vi","iii","IV"], tempo: 76, key: "C" },
  { title: "Blues Shuffle I - IV - I - V", answer: "I - IV - I - V", difficulty: "easy", topic: "blues", chords: [C3, F3, C3, G3], roman: ["I","IV","I","V"], tempo: 88, key: "C" },
  { title: "Blues Turnaround I - IV - I - I", answer: "I - IV - I - I", difficulty: "easy", topic: "blues", chords: [C3, F3, C3, C3], roman: ["I","IV","I","I"], tempo: 84, key: "C" },
];

const newMedium2 = [
  { title: "Ascending Thirds I - iii - vi - IV", answer: "I - iii - vi - IV", difficulty: "medium", topic: "diatonic", chords: [C3, E3m, Am3, F3], roman: ["I","iii","vi","IV"], tempo: 80, key: "C" },
  { title: "Quick Change Blues I - IV - I - IV", answer: "I - IV - I - IV", difficulty: "medium", topic: "blues", chords: [C3, F3, C3, F3], roman: ["I","IV","I","IV"], tempo: 92, key: "C" },
  { title: "Secondary Approach vi - ii - V - I", answer: "vi - ii - V - I", difficulty: "medium", topic: "diatonic", chords: [Am3, D3m, G3, C3], roman: ["vi","ii","V","I"], tempo: 84, key: "C" },
];

const newHard2 = [
  { title: "Blues Turnaround I - VI7 - ii - V7", answer: "I - VI7 - ii - V7", difficulty: "hard", topic: "blues", chords: [C3, A7, D3m, G7], roman: ["I","VI7","ii","V7"], tempo: 88, key: "C" },
  { title: "Chromatic Descent bIII - bVI - bII - V", answer: "bIII - bVI - bII - V", difficulty: "hard", topic: "modal", chords: [Eb3maj, Ab3, Db3maj, G3], roman: ["bIII","bVI","bII","V"], tempo: 72, key: "C" },
  { title: "Harmonic Minor Cadence i - iv - V7 - i", answer: "i - iv - V7 - i", difficulty: "hard", topic: "minor", chords: [Am_i, Dm_iv, E7, Am_i], roman: ["i","iv","V7","i"], tempo: 76, key: "Am" },
];

const newJazz = [
  { title: "Standard Ballad Imaj7 - I7 - IVmaj7 - iv7", answer: "Imaj7 - I7 - IVmaj7 - iv7", difficulty: "jazz", topic: "jazz", choices: JAZZ_A_CHOICES, chords: [Cmaj7, C7, Fmaj7, Fm7], roman: ["Imaj7","I7","IVmaj7","iv7"], tempo: 72, key: "C" },
  { title: "Forward Turnaround ii7 - V7 - iii7 - VI7", answer: "ii7 - V7 - iii7 - VI7", difficulty: "jazz", topic: "jazz", choices: JAZZ_B_CHOICES, chords: [Dm7, G7, Em7, A7], roman: ["ii7","V7","iii7","VI7"], tempo: 80, key: "C" },
  { title: "Minor Jazz im7 - IV7 - bVImaj7 - V7", answer: "im7 - IV7 - bVImaj7 - V7", difficulty: "jazz", topic: "jazz", choices: JAZZ_B_CHOICES, chords: [Am7, D7, Fmaj7, E7j], roman: ["im7","IV7","bVImaj7","V7"], tempo: 76, key: "Am" },
  { title: "Dominant Chain III7 - VI7 - II7 - V7", answer: "III7 - VI7 - II7 - V7", difficulty: "jazz", topic: "jazz", choices: JAZZ_A_CHOICES, chords: [E7j, A7, D7, G7], roman: ["III7","VI7","II7","V7"], tempo: 84, key: "C" },
  { title: "Chromatic Thirds Imaj7 - bVImaj7 - bIImaj7 - V7", answer: "Imaj7 - bVImaj7 - bIImaj7 - V7", difficulty: "jazz", topic: "jazz", choices: JAZZ_B_CHOICES, chords: [Cmaj7, Abmaj7, Dbmaj7, G7], roman: ["Imaj7","bVImaj7","bIImaj7","V7"], tempo: 72, key: "C" },
  { title: "Backdoor Cadence iv7 - bVII7 - Imaj7", answer: "iv7 - bVII7 - Imaj7", difficulty: "jazz", topic: "jazz", choices: JAZZ_C_CHOICES, chords: [Fm7, Bb7, Cmaj7], roman: ["iv7","bVII7","Imaj7"], tempo: 76, key: "C" },
  { title: "Modal Vamp im7 - bIIm7 (So What)", answer: "im7 - im7 - bIIm7 - bIIm7", difficulty: "jazz", topic: "jazz", choices: JAZZ_C_CHOICES, chords: [Dm7, Dm7, Ebm7, Ebm7], roman: ["im7","im7","bIIm7","bIIm7"], tempo: 88, key: "Dm" },
  { title: "Minor Plagal Chain iv7 - bVII7 - bIIImaj7 - bVImaj7", answer: "iv7 - bVII7 - bIIImaj7 - bVImaj7", difficulty: "jazz", topic: "jazz", choices: JAZZ_C_CHOICES, chords: [Fm7, Bb7, Ebmaj7, Abmaj7], roman: ["iv7","bVII7","bIIImaj7","bVImaj7"], tempo: 72, key: "C" },
  { title: "Chromatic Mediant Turnaround Imaj7 - bIII7 - bVImaj7 - bII7", answer: "Imaj7 - bIII7 - bVImaj7 - bII7", difficulty: "jazz", topic: "jazz", choices: JAZZ_C_CHOICES, chords: [Cmaj7, Eb7, Abmaj7, Db7], roman: ["Imaj7","bIII7","bVImaj7","bII7"], tempo: 76, key: "C" },
  { title: "Sequential ii-V Chain ivm7 - bVII7 - bIIIm7 - bVI7", answer: "ivm7 - bVII7 - bIIIm7 - bVI7", difficulty: "jazz", topic: "jazz", choices: JAZZ_C_CHOICES, chords: [Fm7, Bb7, Ebm7, Ab7], roman: ["ivm7","bVII7","bIIIm7","bVI7"], tempo: 80, key: "C" },
];

const JAZZ_A_ANSWERS = new Set([
  "ii7 - V7 - Imaj7", "iim7b5 - V7b9 - im7", "Imaj7 - VI7 - ii7 - V7",
  "I7 - IV7 - I7 - V7", "im7 - bVII7 - bVI7 - V7", "iii7 - VI7 - ii7 - V7",
]);
const JAZZ_B_ANSWERS = new Set(["ii7 - bII7 - Imaj7", "Imaj7 - IVmaj7 - iii7 - VI7"]);

async function run() {
  let updated = 0;
  let inserted = 0;

  // Update choices for existing exercises
  const updateChoices = async (choices: string, answer: string) => {
    const r = await db.update(exercises)
      .set({ choices })
      .where(and(eq(exercises.category, "progression"), eq(exercises.answer, answer)))
      .returning({ id: exercises.id });
    updated += r.length;
  };

  for (const ans of ["I - IV - V", "I - V - vi - IV"]) await updateChoices(EASY_CHOICES, ans);
  for (const ans of ["ii - V - I", "I - vi - IV - V", "I - IV - vi - V", "vi - IV - I - V"]) await updateChoices(MEDIUM_CHOICES, ans);
  for (const ans of ["I - III - IV - iv", "ii - IV - I - V"]) await updateChoices(HARD_CHOICES, ans);
  for (const ans of JAZZ_A_ANSWERS) await updateChoices(JAZZ_A_CHOICES, ans);
  for (const ans of JAZZ_B_ANSWERS) await updateChoices(JAZZ_B_CHOICES, ans);

  // Insert new exercises if not already present
  const allNew = [
    ...newEasy.map(e => ({ ...e, choices: EASY_CHOICES })),
    ...newMedium.map(e => ({ ...e, choices: MEDIUM_CHOICES })),
    ...newHard.map(e => ({ ...e, choices: HARD_CHOICES })),
    ...newEasy2.map(e => ({ ...e, choices: EASY_CHOICES_2 })),
    ...newMedium2.map(e => ({ ...e, choices: MEDIUM_CHOICES_2 })),
    ...newHard2.map(e => ({ ...e, choices: HARD_CHOICES_2 })),
    ...newJazz,
  ];

  for (const ex of allNew) {
    const existing = await db.select({ id: exercises.id })
      .from(exercises)
      .where(and(
        eq(exercises.category, "progression"),
        eq(exercises.answer, ex.answer),
        eq(exercises.difficulty, ex.difficulty as any)
      ))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(exercises).values({
      category: "progression",
      title: ex.title,
      prompt: PROMPT,
      difficulty: ex.difficulty as any,
      config: JSON.stringify({ key: ex.key, chords: ex.chords, romanNumerals: ex.roman, tempo: ex.tempo, topic: ex.topic }),
      choices: ex.choices,
      answer: ex.answer,
    });
    inserted++;
  }

  console.log(`Done — updated ${updated} rows, inserted ${inserted} exercises.`);
}

run().catch(console.error).finally(() => client.end());

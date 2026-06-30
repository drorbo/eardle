// Idempotent seed for chord progression exercises.
// - Updates choices for existing exercises to new curated pools per difficulty
// - Inserts new exercises at all levels (easy, medium, hard, jazz)
// Run from project root: node scripts/seed-progressions.mjs

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "../eardle.db"));

// ── Choice pools ──────────────────────────────────────────────────────────────
// Each pool is curated to 8 items — enough discrimination without overwhelming.

const EASY_CHOICES = JSON.stringify([
  "I - IV - V",
  "I - V - vi - IV",
  "I - IV - V - I",
  "I - V - IV - I",
  "I - I - IV - V",
  "I - vi - IV - V",
  "vi - IV - I - V",
  "I - IV - vi - V",
]);

const MEDIUM_CHOICES = JSON.stringify([
  "ii - V - I",
  "I - iii - IV - V",
  "I - bVII - IV - I",
  "i - VII - VI - VII",
  "I - vi - ii - V",
  "I - IV - iii - vi",
  "I - vi - IV - V",
  "I - IV - vi - V",
]);

const HARD_CHOICES = JSON.stringify([
  "I - III - IV - iv",
  "ii - IV - I - V",
  "I - bVI - bVII - I",
  "IV - iv - I - V",
  "I - II - IV - V",
  "bVI - bVII - I",
  "i - V7 - bVI - III",
  "I - bVII - bVI - V",
]);

// Jazz split into two pools — A for major-key/turnaround, B for chromatic/substitution
const JAZZ_A_CHOICES = JSON.stringify([
  "ii7 - V7 - Imaj7",
  "iim7b5 - V7b9 - im7",
  "Imaj7 - VI7 - ii7 - V7",
  "I7 - IV7 - I7 - V7",
  "im7 - bVII7 - bVI7 - V7",
  "Imaj7 - I7 - IVmaj7 - iv7",
  "iii7 - VI7 - ii7 - V7",
  "III7 - VI7 - II7 - V7",
]);

const JAZZ_B_CHOICES = JSON.stringify([
  "ii7 - bII7 - Imaj7",
  "Imaj7 - IVmaj7 - iii7 - VI7",
  "ii7 - V7 - iii7 - VI7",
  "im7 - IV7 - bVImaj7 - V7",
  "Imaj7 - bVImaj7 - bIImaj7 - V7",
  "ii7 - V7 - Imaj7",
  "Imaj7 - VI7 - ii7 - V7",
  "iim7b5 - V7b9 - im7",
]);

// ── New exercise definitions ──────────────────────────────────────────────────

const PROMPT = "What chord progression is this?";

// Key C, triads, octave 4 (matches existing easy exercises)
const C4 = ["C4","E4","G4"], F4 = ["F4","A4","C5"], G4 = ["G4","B4","D5"];
const Am4 = ["A4","C5","E5"];

// Key C, triads, octave 3 (lower for medium/hard with chromatic chords)
const C3 = ["C3","E3","G3"], D3m = ["D3","F3","A3"], E3m = ["E3","G3","B3"];
const F3 = ["F3","A3","C4"], G3 = ["G3","B3","D4"], Am3 = ["A3","C4","E4"];
const Bb3 = ["Bb3","D4","F4"], Ab3 = ["Ab3","C4","Eb4"], F3m = ["F3","Ab3","C4"];
const D3 = ["D3","F#3","A3"]; // D major (secondary dominant)

// Key Am, triads, octave 3
const Am_i = ["A3","C4","E4"], G_VII = ["G3","B3","D4"], F_VI = ["F3","A3","C4"];
const C_III = ["C3","E3","G3"], Dm_iv = ["D3","F3","A3"];
const E7 = ["E3","G#3","B3","D4"]; // V7 in Am (harmonic minor)

// 7th chords, octave 3 (jazz)
const Cmaj7 = ["C3","E3","G3","B3"], C7 = ["C3","E3","G3","Bb3"];
const Fmaj7 = ["F3","A3","C4","E4"], Fm7 = ["F3","Ab3","C4","Eb4"];
const Dm7 = ["D3","F3","A3","C4"], G7 = ["G3","B3","D4","F4"];
const Em7 = ["E3","G3","B3","D4"], A7 = ["A3","C#4","E4","G4"];
const Am7 = ["A3","C4","E4","G4"], D7 = ["D3","F#3","A3","C4"];
const E7j = ["E3","G#3","B3","D4"]; // E7 for jazz (same as E7 above)
const Abmaj7 = ["Ab3","C4","Eb4","G4"], Dbmaj7 = ["Db3","F3","Ab3","C4"];

const newEasy = [
  {
    title: "Cadential Turnaround I - IV - V - I",
    answer: "I - IV - V - I",
    difficulty: "easy",
    topic: "pop",
    chords: [C4, F4, G4, C4],
    roman: ["I","IV","V","I"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Rock Cadence I - V - IV - I",
    answer: "I - V - IV - I",
    difficulty: "easy",
    topic: "pop",
    chords: [C4, G4, F4, C4],
    roman: ["I","V","IV","I"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Extended Tonic I - I - IV - V",
    answer: "I - I - IV - V",
    difficulty: "easy",
    topic: "pop",
    chords: [C4, C4, F4, G4],
    roman: ["I","I","IV","V"],
    tempo: 76,
    key: "C",
  },
];

const newMedium = [
  {
    title: "Mediant Bridge I - iii - IV - V",
    answer: "I - iii - IV - V",
    difficulty: "medium",
    topic: "diatonic",
    chords: [C3, E3m, F3, G3],
    roman: ["I","iii","IV","V"],
    tempo: 76,
    key: "C",
  },
  {
    title: "Mixolydian I - bVII - IV - I",
    answer: "I - bVII - IV - I",
    difficulty: "medium",
    topic: "modal",
    chords: [C3, Bb3, F3, C3],
    roman: ["I","bVII","IV","I"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Natural Minor i - VII - VI - VII",
    answer: "i - VII - VI - VII",
    difficulty: "medium",
    topic: "minor",
    chords: [Am_i, G_VII, F_VI, G_VII],
    roman: ["i","VII","VI","VII"],
    tempo: 76,
    key: "Am",
  },
  {
    title: "Circle of Fifths I - vi - ii - V",
    answer: "I - vi - ii - V",
    difficulty: "medium",
    topic: "diatonic",
    chords: [C3, Am3, D3m, G3],
    roman: ["I","vi","ii","V"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Descending I - IV - iii - vi",
    answer: "I - IV - iii - vi",
    difficulty: "medium",
    topic: "diatonic",
    chords: [C3, F3, E3m, Am3],
    roman: ["I","IV","iii","vi"],
    tempo: 80,
    key: "C",
  },
];

const newHard = [
  {
    title: "Borrowed Chords I - bVI - bVII - I",
    answer: "I - bVI - bVII - I",
    difficulty: "hard",
    topic: "modal",
    chords: [C3, Ab3, Bb3, C3],
    roman: ["I","bVI","bVII","I"],
    tempo: 76,
    key: "C",
  },
  {
    title: "Minor Subdominant IV - iv - I - V",
    answer: "IV - iv - I - V",
    difficulty: "hard",
    topic: "diatonic",
    chords: [F3, F3m, C3, G3],
    roman: ["IV","iv","I","V"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Secondary Dominant I - II - IV - V",
    answer: "I - II - IV - V",
    difficulty: "hard",
    topic: "diatonic",
    chords: [C3, D3, F3, G3],
    roman: ["I","II","IV","V"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Chromatic Two-Step bVI - bVII - I",
    answer: "bVI - bVII - I",
    difficulty: "hard",
    topic: "modal",
    chords: [Ab3, Bb3, C3],
    roman: ["bVI","bVII","I"],
    tempo: 72,
    key: "C",
  },
  {
    title: "Harmonic Minor i - V7 - bVI - III",
    answer: "i - V7 - bVI - III",
    difficulty: "hard",
    topic: "minor",
    chords: [Am_i, E7, F_VI, C_III],
    roman: ["i","V7","bVI","III"],
    tempo: 76,
    key: "Am",
  },
  {
    title: "Andalusian Descent I - bVII - bVI - V",
    answer: "I - bVII - bVI - V",
    difficulty: "hard",
    topic: "modal",
    chords: [C3, Bb3, Ab3, G3],
    roman: ["I","bVII","bVI","V"],
    tempo: 76,
    key: "C",
  },
];

const newJazz = [
  {
    title: "Standard Ballad Imaj7 - I7 - IVmaj7 - iv7",
    answer: "Imaj7 - I7 - IVmaj7 - iv7",
    difficulty: "jazz",
    topic: "jazz",
    choices: JAZZ_A_CHOICES,
    chords: [Cmaj7, C7, Fmaj7, Fm7],
    roman: ["Imaj7","I7","IVmaj7","iv7"],
    tempo: 72,
    key: "C",
  },
  {
    title: "Forward Turnaround ii7 - V7 - iii7 - VI7",
    answer: "ii7 - V7 - iii7 - VI7",
    difficulty: "jazz",
    topic: "jazz",
    choices: JAZZ_B_CHOICES,
    chords: [Dm7, G7, Em7, A7],
    roman: ["ii7","V7","iii7","VI7"],
    tempo: 80,
    key: "C",
  },
  {
    title: "Minor Jazz im7 - IV7 - bVImaj7 - V7",
    answer: "im7 - IV7 - bVImaj7 - V7",
    difficulty: "jazz",
    topic: "jazz",
    choices: JAZZ_B_CHOICES,
    chords: [Am7, D7, Fmaj7, E7j],
    roman: ["im7","IV7","bVImaj7","V7"],
    tempo: 76,
    key: "Am",
  },
  {
    title: "Dominant Chain III7 - VI7 - II7 - V7",
    answer: "III7 - VI7 - II7 - V7",
    difficulty: "jazz",
    topic: "jazz",
    choices: JAZZ_A_CHOICES,
    chords: [E7j, A7, D7, G7],
    roman: ["III7","VI7","II7","V7"],
    tempo: 84,
    key: "C",
  },
  {
    title: "Chromatic Thirds Imaj7 - bVImaj7 - bIImaj7 - V7",
    answer: "Imaj7 - bVImaj7 - bIImaj7 - V7",
    difficulty: "jazz",
    topic: "jazz",
    choices: JAZZ_B_CHOICES,
    chords: [Cmaj7, Abmaj7, Dbmaj7, G7],
    roman: ["Imaj7","bVImaj7","bIImaj7","V7"],
    tempo: 72,
    key: "C",
  },
];

// ── Statements ────────────────────────────────────────────────────────────────

const stmtUpdateChoices = db.prepare(
  `UPDATE exercises SET choices = ? WHERE category = 'progression' AND answer = ?`
);

const stmtInsert = db.prepare(
  `INSERT INTO exercises (category, title, prompt, difficulty, config, choices, answer)
   VALUES ('progression', ?, ?, ?, ?, ?, ?)`
);

const stmtExists = db.prepare(
  `SELECT 1 FROM exercises WHERE category = 'progression' AND answer = ? AND difficulty = ?`
);

// Assignments of existing jazz exercises to choice pools
const JAZZ_A_ANSWERS = new Set([
  "ii7 - V7 - Imaj7",
  "iim7b5 - V7b9 - im7",
  "Imaj7 - VI7 - ii7 - V7",
  "I7 - IV7 - I7 - V7",
  "im7 - bVII7 - bVI7 - V7",
  "iii7 - VI7 - ii7 - V7",
]);
const JAZZ_B_ANSWERS = new Set([
  "ii7 - bII7 - Imaj7",
  "Imaj7 - IVmaj7 - iii7 - VI7",
]);

let updated = 0;
let inserted = 0;

db.transaction(() => {
  // ── Update existing exercises to new curated choice pools ──────────────────

  // Easy
  for (const ans of ["I - IV - V", "I - V - vi - IV"]) {
    updated += stmtUpdateChoices.run(EASY_CHOICES, ans).changes;
  }
  // Medium
  for (const ans of ["ii - V - I", "I - vi - IV - V", "I - IV - vi - V", "vi - IV - I - V"]) {
    updated += stmtUpdateChoices.run(MEDIUM_CHOICES, ans).changes;
  }
  // Hard
  for (const ans of ["I - III - IV - iv", "ii - IV - I - V"]) {
    updated += stmtUpdateChoices.run(HARD_CHOICES, ans).changes;
  }
  // Jazz A
  for (const ans of JAZZ_A_ANSWERS) {
    updated += stmtUpdateChoices.run(JAZZ_A_CHOICES, ans).changes;
  }
  // Jazz B
  for (const ans of JAZZ_B_ANSWERS) {
    updated += stmtUpdateChoices.run(JAZZ_B_CHOICES, ans).changes;
  }

  // ── Insert new exercises ───────────────────────────────────────────────────

  const allNew = [
    ...newEasy.map(e => ({ ...e, choices: EASY_CHOICES })),
    ...newMedium.map(e => ({ ...e, choices: MEDIUM_CHOICES })),
    ...newHard.map(e => ({ ...e, choices: HARD_CHOICES })),
    ...newJazz,
  ];

  for (const ex of allNew) {
    if (stmtExists.get(ex.answer, ex.difficulty)) continue;
    stmtInsert.run(
      ex.title,
      PROMPT,
      ex.difficulty,
      JSON.stringify({
        key: ex.key,
        chords: ex.chords,
        romanNumerals: ex.roman,
        tempo: ex.tempo,
        topic: ex.topic,
      }),
      ex.choices,
      ex.answer
    );
    inserted++;
  }
})();

console.log(`Done — updated ${updated} rows, inserted ${inserted} exercises.`);
db.close();

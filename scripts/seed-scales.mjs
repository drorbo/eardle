// Idempotent seed for scale exercises.
// - Updates choices for existing major_modes exercises (adds new modes)
// - Re-topics existing jazz_altered exercises → melodic_minor_modes
// - Inserts new exercises for Aeolian, Phrygian, Locrian (major modes)
// - Inserts new exercises for Dorian b2, Lydian Augmented, Mixolydian b6, Locrian #2 (melodic minor)
// - Inserts new exercises for Whole Tone, Half-Whole Dim, Whole-Half Dim (symmetric)
// Run from project root: node scripts/seed-scales.mjs

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "../eardle.db"));

// ── Choice pools ─────────────────────────────────────────────────────────────

const MAJOR_MODES_CHOICES = JSON.stringify([
  "Major", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian",
]);

const MEL_MINOR_CHOICES = JSON.stringify([
  "Melodic Minor", "Dorian ♭2", "Lydian Augmented", "Lydian Dominant",
  "Mixolydian ♭6", "Locrian ♯2", "Altered",
]);

const SYMMETRIC_CHOICES = JSON.stringify([
  "Whole Tone", "Half-Whole Diminished", "Whole-Half Diminished",
  "Melodic Minor", "Lydian Dominant", "Altered",
]);

const PROMPT = "What scale type is this?";

// ── New exercises ─────────────────────────────────────────────────────────────

const majorModeNew = [
  // Aeolian (Natural Minor) — easy / medium / hard
  { title: "Aeolian Scale", type: "aeolian", difficulty: "easy",   answer: "Aeolian" },
  { title: "Aeolian Scale", type: "aeolian", difficulty: "medium", answer: "Aeolian" },
  { title: "Aeolian Scale", type: "aeolian", difficulty: "hard",   answer: "Aeolian" },
  // Phrygian — medium / hard
  { title: "Phrygian Scale", type: "phrygian", difficulty: "medium", answer: "Phrygian" },
  { title: "Phrygian Scale", type: "phrygian", difficulty: "hard",   answer: "Phrygian" },
  // Locrian — hard
  { title: "Locrian Scale", type: "locrian", difficulty: "hard", answer: "Locrian" },
];

const melMinorNew = [
  { title: "Dorian ♭2 Scale",       type: "dorian_b2",     answer: "Dorian ♭2" },
  { title: "Lydian Augmented Scale",     type: "lydian_aug",    answer: "Lydian Augmented" },
  { title: "Mixolydian ♭6 Scale",   type: "mixolydian_b6", answer: "Mixolydian ♭6" },
  { title: "Locrian ♯2 Scale",      type: "locrian_s2",    answer: "Locrian ♯2" },
];

const symmetricNew = [
  { title: "Whole Tone Scale",           type: "whole_tone",  answer: "Whole Tone" },
  { title: "Half-Whole Diminished Scale",type: "half_whole",  answer: "Half-Whole Diminished" },
  { title: "Whole-Half Diminished Scale",type: "whole_half",  answer: "Whole-Half Diminished" },
];

// ── Run ───────────────────────────────────────────────────────────────────────

const stmtUpdateChoices = db.prepare(
  `UPDATE exercises SET choices = ? WHERE category = 'scale' AND json_extract(config, '$.topic') = ?`
);

const stmtRetopic = db.prepare(
  `UPDATE exercises SET config = json_set(config, '$.topic', ?), choices = ?
   WHERE category = 'scale' AND json_extract(config, '$.topic') = 'jazz_altered'`
);

const stmtInsert = db.prepare(
  `INSERT INTO exercises (category, title, prompt, difficulty, config, choices, answer)
   VALUES ('scale', ?, ?, ?, ?, ?, ?)`
);

// Guard: avoid duplicate inserts on re-run
const stmtExists = db.prepare(
  `SELECT 1 FROM exercises WHERE category = 'scale' AND title = ? AND difficulty = ?`
);

let updated = 0;
let inserted = 0;

db.transaction(() => {
  // Step 1: update major_modes choices to include all 7 modes
  const r1 = stmtUpdateChoices.run(MAJOR_MODES_CHOICES, "major_modes");
  updated += r1.changes;

  // Step 2: re-topic jazz_altered → melodic_minor_modes, update choices
  const r2 = stmtRetopic.run("melodic_minor_modes", MEL_MINOR_CHOICES);
  updated += r2.changes;

  // Step 3: new major_modes exercises
  for (const ex of majorModeNew) {
    if (stmtExists.get(ex.title, ex.difficulty)) continue;
    stmtInsert.run(
      ex.title, PROMPT, ex.difficulty,
      JSON.stringify({ type: ex.type, topic: "major_modes" }),
      MAJOR_MODES_CHOICES, ex.answer
    );
    inserted++;
  }

  // Step 4: new melodic minor modes exercises
  for (const ex of melMinorNew) {
    if (stmtExists.get(ex.title, "jazz")) continue;
    stmtInsert.run(
      ex.title, PROMPT, "jazz",
      JSON.stringify({ type: ex.type, topic: "melodic_minor_modes" }),
      MEL_MINOR_CHOICES, ex.answer
    );
    inserted++;
  }

  // Step 5: new symmetric jazz exercises
  for (const ex of symmetricNew) {
    if (stmtExists.get(ex.title, "jazz")) continue;
    stmtInsert.run(
      ex.title, PROMPT, "jazz",
      JSON.stringify({ type: ex.type, topic: "jazz_symmetric" }),
      SYMMETRIC_CHOICES, ex.answer
    );
    inserted++;
  }
})();

console.log(`Done — updated ${updated} rows, inserted ${inserted} exercises.`);
db.close();

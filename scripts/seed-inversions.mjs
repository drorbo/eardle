// One-shot script: inserts chord inversion exercises into eardle.db
// Run from project root: node scripts/seed-inversions.mjs

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "../eardle.db"));

const INVERSION_LABELS = ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];

// Choices pool per exercise group.
// Each group is a set of (chordLabel, inversions[]) combinations that appear as distractors.
const TRIAD_CHOICES = (inv) => {
  const all = [];
  for (const label of ["Major", "Minor"]) {
    for (const i of [0, 1, 2]) {
      all.push(`${label} - ${INVERSION_LABELS[i]}`);
    }
  }
  return all;
};

const SEVENTH_CHOICES = (chordLabel, inv) => {
  const sameType = [0, 1, 2, 3].map((i) => `${chordLabel} - ${INVERSION_LABELS[i]}`);
  // Two distractors: an adjacent 7th chord type at the same inversion
  const adjacent = {
    "Dominant 7th": ["Major 7th", "Minor 7th"],
    "Major 7th": ["Dominant 7th", "Minor 7th"],
    "Minor 7th": ["Major 7th", "Dominant 7th"],
  };
  const extras = (adjacent[chordLabel] ?? []).map((l) => `${l} - ${INVERSION_LABELS[inv]}`);
  const combined = [...new Set([...sameType, ...extras])];
  return combined.sort(() => 0); // keep deterministic order
};

const exercises = [
  // ── Triads (easy / medium) ───────────────────────────────────────────────
  ...["major", "minor"].flatMap((type) => {
    const label = type === "major" ? "Major" : "Minor";
    return [
      { type, inversion: 0, difficulty: "easy",   answer: `${label} - Root Position` },
      { type, inversion: 1, difficulty: "easy",   answer: `${label} - 1st Inversion` },
      { type, inversion: 2, difficulty: "medium", answer: `${label} - 2nd Inversion` },
    ];
  }),

  // ── Dominant 7th (medium / hard) ─────────────────────────────────────────
  { type: "dom7", inversion: 0, difficulty: "medium", answer: "Dominant 7th - Root Position" },
  { type: "dom7", inversion: 1, difficulty: "medium", answer: "Dominant 7th - 1st Inversion" },
  { type: "dom7", inversion: 2, difficulty: "hard",   answer: "Dominant 7th - 2nd Inversion" },
  { type: "dom7", inversion: 3, difficulty: "hard",   answer: "Dominant 7th - 3rd Inversion" },

  // ── Major 7th (medium / hard) ─────────────────────────────────────────────
  { type: "maj7", inversion: 0, difficulty: "medium", answer: "Major 7th - Root Position" },
  { type: "maj7", inversion: 1, difficulty: "hard",   answer: "Major 7th - 1st Inversion" },
  { type: "maj7", inversion: 2, difficulty: "hard",   answer: "Major 7th - 2nd Inversion" },
  { type: "maj7", inversion: 3, difficulty: "hard",   answer: "Major 7th - 3rd Inversion" },

  // ── Minor 7th (medium / hard) ─────────────────────────────────────────────
  { type: "min7", inversion: 0, difficulty: "medium", answer: "Minor 7th - Root Position" },
  { type: "min7", inversion: 1, difficulty: "hard",   answer: "Minor 7th - 1st Inversion" },
  { type: "min7", inversion: 2, difficulty: "hard",   answer: "Minor 7th - 2nd Inversion" },
  { type: "min7", inversion: 3, difficulty: "hard",   answer: "Minor 7th - 3rd Inversion" },

  // dim7 excluded: fully symmetrical chord — all inversions are enharmonically identical by ear
];

// Map chord type → display label (for title and choices)
const TYPE_LABELS = {
  major: "Major", minor: "Minor",
  dom7: "Dominant 7th", maj7: "Major 7th", min7: "Minor 7th",
};

const TRIAD_TYPES = new Set(["major", "minor"]);

function buildChoices(type, inversion) {
  if (TRIAD_TYPES.has(type)) return TRIAD_CHOICES(inversion);
  return SEVENTH_CHOICES(TYPE_LABELS[type], inversion);
}

const stmt = db.prepare(`
  INSERT INTO exercises (category, title, prompt, difficulty, config, choices, answer)
  VALUES ('chord', ?, ?, ?, ?, ?, ?)
`);

const deleteExisting = db.prepare(
  `DELETE FROM exercises WHERE category='chord' AND json_extract(config,'$.topic')='inversions'`
);

const insertMany = db.transaction(() => {
  const deleted = deleteExisting.run();
  if (deleted.changes > 0) console.log(`  Removed ${deleted.changes} existing inversion exercises\n`);

  for (const ex of exercises) {
    const label = TYPE_LABELS[ex.type];
    const invLabel = INVERSION_LABELS[ex.inversion];
    const title = `${label} Chord — ${invLabel}`;
    const config = JSON.stringify({ type: ex.type, inversion: ex.inversion, topic: "inversions" });
    const choices = JSON.stringify(buildChoices(ex.type, ex.inversion));
    stmt.run(title, "What chord and inversion is this?", ex.difficulty, config, choices, ex.answer);
    console.log(`  ✓  ${title} [${ex.difficulty}]  →  "${ex.answer}"`);
  }
});

console.log("Seeding inversion exercises…\n");
insertMany();
console.log(`\nDone — ${exercises.length} exercises inserted.`);

db.close();

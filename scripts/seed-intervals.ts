// Idempotent: deletes all interval exercises and inserts the new set.
// Run from project root: npx tsx scripts/seed-intervals.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const EASY_CHOICES = [
  "Unison", "Minor 2nd", "Major 2nd", "Minor 3rd",
  "Major 3rd", "Perfect 4th", "Tritone", "Perfect 5th",
];

const MEDIUM_CHOICES = [
  ...EASY_CHOICES,
  "Minor 6th", "Major 6th", "Minor 7th", "Major 7th", "Octave",
];

const HARD_CHOICES = [
  ...MEDIUM_CHOICES,
  "Minor 9th", "Major 9th", "Minor 10th", "Major 10th",
];

const exerciseData = [
  { title: "Unison",       semitones:  0, difficulty: "easy",   playMode: "harmonic", answer: "Unison",       choices: EASY_CHOICES },
  { title: "Minor 2nd",    semitones:  1, difficulty: "easy",   playMode: "harmonic", answer: "Minor 2nd",    choices: EASY_CHOICES },
  { title: "Major 2nd",    semitones:  2, difficulty: "easy",   playMode: "harmonic", answer: "Major 2nd",    choices: EASY_CHOICES },
  { title: "Minor 3rd",    semitones:  3, difficulty: "easy",   playMode: "harmonic", answer: "Minor 3rd",    choices: EASY_CHOICES },
  { title: "Major 3rd",    semitones:  4, difficulty: "easy",   playMode: "harmonic", answer: "Major 3rd",    choices: EASY_CHOICES },
  { title: "Perfect 4th",  semitones:  5, difficulty: "easy",   playMode: "harmonic", answer: "Perfect 4th",  choices: EASY_CHOICES },
  { title: "Tritone",      semitones:  6, difficulty: "easy",   playMode: "harmonic", answer: "Tritone",      choices: EASY_CHOICES },
  { title: "Perfect 5th",  semitones:  7, difficulty: "easy",   playMode: "harmonic", answer: "Perfect 5th",  choices: EASY_CHOICES },
  { title: "Minor 6th",    semitones:  8, difficulty: "medium", playMode: "harmonic", answer: "Minor 6th",    choices: MEDIUM_CHOICES },
  { title: "Major 6th",    semitones:  9, difficulty: "medium", playMode: "harmonic", answer: "Major 6th",    choices: MEDIUM_CHOICES },
  { title: "Minor 7th",    semitones: 10, difficulty: "medium", playMode: "harmonic", answer: "Minor 7th",    choices: MEDIUM_CHOICES },
  { title: "Major 7th",    semitones: 11, difficulty: "medium", playMode: "harmonic", answer: "Major 7th",    choices: MEDIUM_CHOICES },
  { title: "Octave",       semitones: 12, difficulty: "medium", playMode: "harmonic", answer: "Octave",       choices: MEDIUM_CHOICES },
  { title: "Minor 9th",    semitones: 13, difficulty: "hard",   playMode: "melodic",  answer: "Minor 9th",    choices: HARD_CHOICES },
  { title: "Major 9th",    semitones: 14, difficulty: "hard",   playMode: "melodic",  answer: "Major 9th",    choices: HARD_CHOICES },
  { title: "Minor 10th",   semitones: 15, difficulty: "hard",   playMode: "melodic",  answer: "Minor 10th",   choices: HARD_CHOICES },
  { title: "Major 10th",   semitones: 16, difficulty: "hard",   playMode: "melodic",  answer: "Major 10th",   choices: HARD_CHOICES },
] as const;

async function run() {
  const deleted = await db.delete(exercises).where(eq(exercises.category, "interval")).returning({ id: exercises.id });
  if (deleted.length > 0) console.log(`  Removed ${deleted.length} existing interval exercises\n`);

  await db.insert(exercises).values(exerciseData.map(ex => ({
    category: "interval" as const,
    title: ex.title,
    prompt: "What interval is this?",
    difficulty: ex.difficulty as "easy" | "medium" | "hard",
    config: JSON.stringify({ semitones: ex.semitones, playMode: ex.playMode }),
    choices: JSON.stringify(ex.choices),
    answer: ex.answer,
  })));

  for (const ex of exerciseData) {
    console.log(`  [${ex.difficulty.padEnd(6)}] ${ex.title.padEnd(14)}  ${ex.semitones} semitones  ${ex.playMode}`);
  }
}

console.log("Seeding interval exercises…\n");
run()
  .then(() => { console.log(`\nDone — ${exerciseData.length} exercises inserted.`); })
  .catch(console.error)
  .finally(() => client.end());

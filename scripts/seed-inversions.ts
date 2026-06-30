// Idempotent: deletes chord inversion exercises and reinserts the full set.
// Run from project root: npx tsx scripts/seed-inversions.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

const INVERSION_LABELS = ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];

const TRIAD_CHOICES = () => {
  const all = [];
  for (const label of ["Major", "Minor"]) {
    for (const i of [0, 1, 2]) {
      all.push(`${label} - ${INVERSION_LABELS[i]}`);
    }
  }
  return all;
};

const SEVENTH_CHOICES = (chordLabel: string, inv: number) => {
  const sameType = [0, 1, 2, 3].map((i) => `${chordLabel} - ${INVERSION_LABELS[i]}`);
  const adjacent: Record<string, string[]> = {
    "Dominant 7th": ["Major 7th", "Minor 7th"],
    "Major 7th": ["Dominant 7th", "Minor 7th"],
    "Minor 7th": ["Major 7th", "Dominant 7th"],
  };
  const extras = (adjacent[chordLabel] ?? []).map((l) => `${l} - ${INVERSION_LABELS[inv]}`);
  return [...new Set([...sameType, ...extras])];
};

const exerciseData = [
  ...["major", "minor"].flatMap((type) => {
    const label = type === "major" ? "Major" : "Minor";
    return [
      { type, inversion: 0, difficulty: "easy",   answer: `${label} - Root Position` },
      { type, inversion: 1, difficulty: "easy",   answer: `${label} - 1st Inversion` },
      { type, inversion: 2, difficulty: "medium", answer: `${label} - 2nd Inversion` },
    ];
  }),
  { type: "dom7", inversion: 0, difficulty: "medium", answer: "Dominant 7th - Root Position" },
  { type: "dom7", inversion: 1, difficulty: "medium", answer: "Dominant 7th - 1st Inversion" },
  { type: "dom7", inversion: 2, difficulty: "hard",   answer: "Dominant 7th - 2nd Inversion" },
  { type: "dom7", inversion: 3, difficulty: "hard",   answer: "Dominant 7th - 3rd Inversion" },
  { type: "maj7", inversion: 0, difficulty: "medium", answer: "Major 7th - Root Position" },
  { type: "maj7", inversion: 1, difficulty: "hard",   answer: "Major 7th - 1st Inversion" },
  { type: "maj7", inversion: 2, difficulty: "hard",   answer: "Major 7th - 2nd Inversion" },
  { type: "maj7", inversion: 3, difficulty: "hard",   answer: "Major 7th - 3rd Inversion" },
  { type: "min7", inversion: 0, difficulty: "medium", answer: "Minor 7th - Root Position" },
  { type: "min7", inversion: 1, difficulty: "hard",   answer: "Minor 7th - 1st Inversion" },
  { type: "min7", inversion: 2, difficulty: "hard",   answer: "Minor 7th - 2nd Inversion" },
  { type: "min7", inversion: 3, difficulty: "hard",   answer: "Minor 7th - 3rd Inversion" },
];

const TYPE_LABELS: Record<string, string> = {
  major: "Major", minor: "Minor",
  dom7: "Dominant 7th", maj7: "Major 7th", min7: "Minor 7th",
};

const TRIAD_TYPES = new Set(["major", "minor"]);

function buildChoices(type: string, inversion: number) {
  if (TRIAD_TYPES.has(type)) return TRIAD_CHOICES();
  return SEVENTH_CHOICES(TYPE_LABELS[type], inversion);
}

async function run() {
  const deleted = await db.delete(exercises)
    .where(and(
      eq(exercises.category, "chord"),
      sql`(${exercises.config}::jsonb)->>'topic' = 'inversions'`
    ))
    .returning({ id: exercises.id });
  if (deleted.length > 0) console.log(`  Removed ${deleted.length} existing inversion exercises\n`);

  for (const ex of exerciseData) {
    const label = TYPE_LABELS[ex.type];
    const invLabel = INVERSION_LABELS[ex.inversion];
    const title = `${label} Chord — ${invLabel}`;
    await db.insert(exercises).values({
      category: "chord",
      title,
      prompt: "What chord and inversion is this?",
      difficulty: ex.difficulty as "easy" | "medium" | "hard",
      config: JSON.stringify({ type: ex.type, inversion: ex.inversion, topic: "inversions" }),
      choices: JSON.stringify(buildChoices(ex.type, ex.inversion)),
      answer: ex.answer,
    });
    console.log(`  ✓  ${title} [${ex.difficulty}]  →  "${ex.answer}"`);
  }
}

console.log("Seeding inversion exercises…\n");
run()
  .then(() => { console.log(`\nDone — ${exerciseData.length} exercises inserted.`); })
  .catch(console.error)
  .finally(() => client.end());

// Idempotent seed for scale exercises.
// - Updates choices for existing major_modes exercises
// - Re-topics existing jazz_altered exercises → melodic_minor_modes
// - Inserts new exercises for Aeolian, Phrygian, Locrian, melodic minor modes, and symmetric scales
// Run from project root: npx tsx scripts/seed-scales.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

const MAJOR_MODES_CHOICES = JSON.stringify([
  "Major", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Minor Scale", "Locrian",
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

const majorModeNew = [
  { title: "Minor Scale",  type: "aeolian",  difficulty: "easy",   answer: "Minor Scale" },
  { title: "Minor Scale",  type: "aeolian",  difficulty: "medium", answer: "Minor Scale" },
  { title: "Minor Scale",  type: "aeolian",  difficulty: "hard",   answer: "Minor Scale" },
  { title: "Phrygian Scale", type: "phrygian", difficulty: "medium", answer: "Phrygian" },
  { title: "Phrygian Scale", type: "phrygian", difficulty: "hard",   answer: "Phrygian" },
  { title: "Locrian Scale",  type: "locrian",  difficulty: "hard",   answer: "Locrian" },
];

const melMinorNew = [
  { title: "Dorian ♭2 Scale",          type: "dorian_b2",     answer: "Dorian ♭2" },
  { title: "Lydian Augmented Scale",    type: "lydian_aug",    answer: "Lydian Augmented" },
  { title: "Mixolydian ♭6 Scale",      type: "mixolydian_b6", answer: "Mixolydian ♭6" },
  { title: "Locrian ♯2 Scale",         type: "locrian_s2",    answer: "Locrian ♯2" },
];

const symmetricNew = [
  { title: "Whole Tone Scale",            type: "whole_tone", answer: "Whole Tone" },
  { title: "Half-Whole Diminished Scale", type: "half_whole", answer: "Half-Whole Diminished" },
  { title: "Whole-Half Diminished Scale", type: "whole_half", answer: "Whole-Half Diminished" },
];

async function run() {
  let updated = 0;
  let inserted = 0;

  // Step 1: update major_modes choices
  const r1 = await db.update(exercises)
    .set({ choices: MAJOR_MODES_CHOICES })
    .where(and(
      eq(exercises.category, "scale"),
      sql`(${exercises.config}::jsonb)->>'topic' = 'major_modes'`
    ))
    .returning({ id: exercises.id });
  updated += r1.length;

  // Step 1b: existing aeolian rows' `title`/`answer` predate the "Minor Scale"
  // rename (they used to read "Aeolian Scale" / "Aeolian (Minor)") —
  // Step 1 above only touches `choices`, so fix `title`/`answer` separately.
  const r1b = await db.update(exercises)
    .set({ title: "Minor Scale", answer: "Minor Scale" })
    .where(and(
      eq(exercises.category, "scale"),
      sql`(${exercises.config}::jsonb)->>'type' = 'aeolian'`,
      sql`${exercises.answer} != 'Minor Scale'`
    ))
    .returning({ id: exercises.id });
  updated += r1b.length;

  // Step 2: re-topic jazz_altered → melodic_minor_modes (in application code)
  const toRetopic = await db.select()
    .from(exercises)
    .where(and(
      eq(exercises.category, "scale"),
      sql`(${exercises.config}::jsonb)->>'topic' = 'jazz_altered'`
    ));
  for (const ex of toRetopic) {
    const config = JSON.parse(ex.config);
    config.topic = "melodic_minor_modes";
    await db.update(exercises)
      .set({ config: JSON.stringify(config), choices: MEL_MINOR_CHOICES })
      .where(eq(exercises.id, ex.id));
    updated++;
  }

  // Step 3: new major_modes exercises
  for (const ex of majorModeNew) {
    const existing = await db.select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.category, "scale"), eq(exercises.title, ex.title), eq(exercises.difficulty, ex.difficulty as any)))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(exercises).values({
      category: "scale",
      title: ex.title,
      prompt: PROMPT,
      difficulty: ex.difficulty as any,
      config: JSON.stringify({ type: ex.type, topic: "major_modes" }),
      choices: MAJOR_MODES_CHOICES,
      answer: ex.answer,
    });
    inserted++;
  }

  // Step 4: new melodic minor modes exercises
  for (const ex of melMinorNew) {
    const existing = await db.select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.category, "scale"), eq(exercises.title, ex.title), eq(exercises.difficulty, "jazz")))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(exercises).values({
      category: "scale",
      title: ex.title,
      prompt: PROMPT,
      difficulty: "jazz",
      config: JSON.stringify({ type: ex.type, topic: "melodic_minor_modes" }),
      choices: MEL_MINOR_CHOICES,
      answer: ex.answer,
    });
    inserted++;
  }

  // Step 5: new symmetric jazz exercises
  for (const ex of symmetricNew) {
    const existing = await db.select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.category, "scale"), eq(exercises.title, ex.title), eq(exercises.difficulty, "jazz")))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(exercises).values({
      category: "scale",
      title: ex.title,
      prompt: PROMPT,
      difficulty: "jazz",
      config: JSON.stringify({ type: ex.type, topic: "jazz_symmetric" }),
      choices: SYMMETRIC_CHOICES,
      answer: ex.answer,
    });
    inserted++;
  }

  console.log(`Done — updated ${updated} rows, inserted ${inserted} exercises.`);
}

run().catch(console.error).finally(() => client.end());

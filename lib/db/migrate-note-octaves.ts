// One-off migration for already-seeded environments (local dev DB, production DB).
// Strips the octave digit from every "note" category config.note (now chosen at
// play time based on difficulty — see hooks/useAudio.ts), and adds the pitch
// classes missing from the "hard" tier so it covers all 12 chromatic notes.
// Idempotent and additive-only: never deletes a row, so session history tied to
// existing exercise IDs is preserved. Run manually — not wired into container start.
//
// Usage: docker compose exec app npx tsx lib/db/migrate-note-octaves.ts

import { db, client } from "./index";
import { exercises } from "./schema";
import { eq, and } from "drizzle-orm";

const NEW_HARD_NOTES = ["D", "E", "F", "A", "B"];
const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const C_MAJOR_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const RETITLE: Record<string, string> = {
  "C — low register": "C",
  "G — high register": "G",
  "C — with accidentals": "C — 3 octaves",
  "D — with accidentals": "D — 3 octaves",
  "E — with accidentals": "E — 3 octaves",
  "F — with accidentals": "F — 3 octaves",
  "G — with accidentals": "G — 3 octaves",
  "A — with accidentals": "A — 3 octaves",
  "B — with accidentals": "B — 3 octaves",
};

async function migrate() {
  const rows = await db.select().from(exercises).where(eq(exercises.category, "note"));
  let stripped = 0;
  for (const row of rows) {
    const cfg = JSON.parse(row.config);
    if (/\d$/.test(cfg.note)) {
      await db
        .update(exercises)
        .set({
          config: JSON.stringify({ ...cfg, note: cfg.note.replace(/\d+$/, "") }),
          title: RETITLE[row.title] ?? row.title,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(exercises.id, row.id));
      stripped++;
    }
  }
  console.log(`[migrate-note-octaves] Stripped octave from ${stripped} note config(s).`);

  // Medium never plays accidentals (only C major, across 3 octaves) — its choices
  // should never have included them, and its title shouldn't imply they appear.
  const mediumRows = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.category, "note"), eq(exercises.difficulty, "medium")));
  let mediumFixed = 0;
  for (const row of mediumRows) {
    const newTitle = RETITLE[row.title] ?? row.title;
    const choicesMatch = JSON.stringify(JSON.parse(row.choices)) === JSON.stringify(C_MAJOR_NOTES);
    if (newTitle !== row.title || !choicesMatch) {
      await db
        .update(exercises)
        .set({ choices: JSON.stringify(C_MAJOR_NOTES), title: newTitle, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(exercises.id, row.id));
      mediumFixed++;
    }
  }
  console.log(`[migrate-note-octaves] Fixed choices/title for ${mediumFixed} medium note exercise(s).`);

  const hardRows = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.category, "note"), eq(exercises.difficulty, "hard")));
  const existingNotes = new Set(hardRows.map((r) => JSON.parse(r.config).note));
  const toInsert = NEW_HARD_NOTES.filter((n) => !existingNotes.has(n));

  if (toInsert.length) {
    await db.insert(exercises).values(
      toInsert.map((n) => ({
        category: "note" as const,
        title: n,
        prompt: "What note is this?",
        difficulty: "hard" as const,
        config: JSON.stringify({ note: n }),
        choices: JSON.stringify(ALL_NOTES),
        answer: n,
      }))
    );
  }
  console.log(`[migrate-note-octaves] Inserted ${toInsert.length} new hard-tier note exercise(s).`);
}

migrate().catch(console.error).finally(() => client.end());

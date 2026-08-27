// One-off migration: renames the user-facing "Aeolian (Minor)" / "Aeolian
// Scale" text to "Minor Scale" across scale exercises — the internal
// config.type stays "aeolian" (used by the audio engine), only the
// title/answer/choices text students see changes. Run once per DB:
// npx tsx lib/db/rename-aeolian-answer.ts
// Safe to re-run (idempotent).

import { db, client } from "./index";
import { exercises } from "./schema";
import { and, eq, sql } from "drizzle-orm";

async function run() {
  const titleAnswer = await db
    .update(exercises)
    .set({ title: "Minor Scale", answer: "Minor Scale" })
    .where(and(
      eq(exercises.category, "scale"),
      sql`(${exercises.config}::jsonb)->>'type' = 'aeolian'`,
    ))
    .returning({ id: exercises.id });

  const choices = await db
    .update(exercises)
    .set({ choices: sql`replace(${exercises.choices}, '"Aeolian (Minor)"', '"Minor Scale"')` })
    .where(and(
      eq(exercises.category, "scale"),
      sql`${exercises.choices} LIKE '%Aeolian (Minor)%'`,
    ))
    .returning({ id: exercises.id });

  console.log(`Done — ${titleAnswer.length} title/answer rows, ${choices.length} choices rows updated.`);
}

run().catch(console.error).finally(() => client.end());

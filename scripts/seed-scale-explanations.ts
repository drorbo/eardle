// Idempotent backfill: sets `explanation` on already-seeded scale exercises,
// keyed by config.type (several types repeat across difficulties). Safe to
// re-run — only ever writes to the explanation column.
// Run from project root: npx tsx scripts/seed-scale-explanations.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

const SCALE_EXPLANATIONS: Record<string, string> = {
  major: "The major scale is the foundation of Western music, built from a pattern of whole and half steps (W-W-H-W-W-W-H). It has a bright, happy sound and is the reference point every other mode and scale is measured against.",
  harmonic_minor: "The harmonic minor scale is a natural minor scale with a raised 7th degree, creating a dramatic step-and-a-half gap between the 6th and 7th notes. That gap gives it an exotic, Middle-Eastern or classical sound, and it's what makes the V chord in minor keys major instead of minor.",
  blues: "The blues scale takes the minor pentatonic scale and adds a 'blue note' — a flattened 5th — right in the middle. That extra note is what gives blues, rock, and jazz solos their gritty, expressive edge.",
  pentatonic_major: "The major pentatonic scale is the major scale with the 4th and 7th degrees removed, leaving just five notes with no half-steps between them. That absence of half-steps makes it nearly impossible to hit a 'wrong' note, which is why it's a go-to scale for folk, country, and rock melodies.",
  dorian: "The Dorian mode is the 2nd mode of the major scale, built like a natural minor scale but with a raised 6th degree. That raised 6th gives it a brighter, less melancholic color than natural minor, making it a favorite in jazz, funk, and Latin music.",
  mixolydian: "The Mixolydian mode starts from the 5th note of the major scale and is identical to major except for a flattened 7th degree. That lowered 7th gives it a bluesy, dominant-chord sound, and it's a favorite in rock, blues, and folk music.",
  melodic_minor: "The (jazz) melodic minor scale is a natural minor scale with both the 6th and 7th degrees raised, so only the 3rd stays minor. It bridges the gap between minor and major sounds, and is a core building block for jazz improvisation over minor chords.",
  lydian: "The Lydian mode is the major scale with a raised 4th degree, giving it a dreamy, floating quality without a strong pull back to the tonic. It's widely used in film scores and jazz for its bright, slightly unresolved color.",
  lydian_b7: "The Lydian Dominant scale combines the raised 4th of Lydian with the flattened 7th of Mixolydian. That mix of 'bright' and 'bluesy' makes it the go-to scale for dominant 7th chords in jazz, especially on altered dominants.",
  altered: "The altered scale (also called 'super-Locrian') raises or lowers every note relative to the major scale except the root, cramming in a flat 9th, sharp 9th, sharp 11th, and flat 13th. It's built specifically to resolve tension over dominant 7th chords right before they resolve, giving jazz improvisation its most 'outside' sound.",
  aeolian: "The Aeolian mode is the 6th mode of the major scale and is identical to the natural minor scale. It has a sad, introspective sound and is the most common minor tonality in pop, rock, and folk music.",
  phrygian: "The Phrygian mode is the 3rd mode of the major scale, built like a natural minor scale but with a flattened 2nd degree. That flat 2 gives it a dark, Spanish or Middle-Eastern flavor, and it's a favorite in flamenco and metal.",
  locrian: "The Locrian mode is the 7th mode of the major scale and the darkest of them all, with both a flattened 2nd and a flattened 5th. Its unstable, diminished-sounding tonic makes it rare as a true 'home' scale — it shows up mostly in passing over half-diminished chords.",
  lydian_aug: "The Lydian Augmented scale is the 3rd mode of the melodic minor scale, combining Lydian's raised 4th with a raised 5th on top. That double sharp gives it a shimmering, unresolved quality favored in modern jazz over augmented major 7th chords.",
  dorian_b2: "The Dorian ♭2 scale is the 2nd mode of the melodic minor scale, essentially a Dorian mode with a flattened 2nd degree. That flat 2 adds a tense, exotic edge, and it's typically used over minor chords with a suspended, unresolved color in jazz.",
  mixolydian_b6: "The Mixolydian ♭6 scale is the 5th mode of the melodic minor scale, like a regular Mixolydian but with a flattened 6th degree. That extra flat gives dominant chords a darker, more melancholic pull, popular in minor-key jazz cadences.",
  locrian_s2: "The Locrian ♯2 scale is the 6th mode of the melodic minor scale — a Locrian mode with a raised 2nd degree instead of a flat one. It's the go-to scale for half-diminished (m7♭5) chords in jazz, giving them a smoother, less harsh color than plain Locrian.",
  whole_tone: "The Whole Tone scale is built entirely from whole steps, with no half-steps anywhere, giving it a floating, dreamlike sound with no clear 'home' note. It's famously associated with Debussy and is commonly used over augmented dominant chords in jazz.",
  half_whole: "The Half-Whole Diminished scale alternates half-step, whole-step all the way up, creating a symmetric 8-note scale. It's the standard choice for improvising over fully-diminished 7th chords, since the scale itself repeats every minor third.",
  whole_half: "The Whole-Half Diminished scale is the same eight notes as Half-Whole Diminished, just starting on a whole step instead of a half step. It's most often used over dominant 7th chords with a flat 9, giving them a tense, symmetric diminished color.",
};

async function run() {
  let updated = 0;
  for (const [type, explanation] of Object.entries(SCALE_EXPLANATIONS)) {
    const rows = await db
      .update(exercises)
      .set({ explanation })
      .where(and(eq(exercises.category, "scale"), sql`${exercises.config}::jsonb->>'type' = ${type}`))
      .returning({ id: exercises.id });
    updated += rows.length;
  }
  console.log(`Done — updated ${updated} scale exercises with explanations.`);
}

run().catch(console.error).finally(() => client.end());

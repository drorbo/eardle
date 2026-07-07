// Full reform of the chord category's easy/medium/hard exercises.
// Deletes ALL existing category='chord' rows at difficulty != 'jazz' (regardless
// of their current state — this does not try to diff against specific row IDs,
// since the target DB's exact current content may not match what was audited
// locally) and reinserts the complete correct set fresh. Jazz is untouched.
//
// Run from project root: npx tsx scripts/rebuild-chords.ts

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { and, eq, ne } from "drizzle-orm";

const PROMPT = "What type of chord is this?";
const INVERSION_PROMPT = "What chord and inversion is this?";

const EXPLANATIONS: Record<string, string> = {
  major: "A major chord is built from a root, major 3rd, and perfect 5th, giving it the bright, stable, 'happy' sound that anchors most Western music. It's the most common chord type and the natural resting point in a major key.",
  minor: "A minor chord swaps the major 3rd for a minor 3rd, keeping the same root and perfect 5th. That single lowered note gives it a darker, more melancholic color, and it's the natural resting point in a minor key.",
  dom7: "A dominant 7th chord is a major triad with a minor 7th added on top, creating tension that wants to resolve down a fifth to the tonic. It's the defining sound of the V chord in both major and minor keys, and the backbone of blues and jazz.",
  dim: "A diminished chord stacks two minor 3rds on top of each other, giving every interval in the chord a tense, unstable quality. It has no strong 'home' feeling of its own and almost always functions as a passing or transitional chord resolving somewhere else.",
  maj7: "A major 7th chord adds a major 7th on top of a major triad, one half-step below the octave. That extra note softens the chord's brightness into something smoother and more sophisticated, giving it the dreamy, jazzy color heard in ballads and soul music.",
  min7: "A minor 7th chord adds a minor 7th on top of a minor triad, blending the minor chord's darker color with a smoother, less resolved quality than a plain minor triad. It's a staple of jazz, R&B, and soul, especially in ii chords.",
  aug: "An augmented chord raises the 5th of a major triad by a half-step, so both outer intervals become major 3rds. That symmetry gives it a restless, unresolved, almost dreamlike quality, often used to create tension right before a resolution.",
  dim7: "A diminished 7th chord stacks three minor 3rds in a row, dividing the octave perfectly evenly into four equal parts. That symmetry makes it maximally unstable and highly flexible for modulating between distant keys, a favorite trick in classical and jazz harmony.",
  min7b5: "A half-diminished chord (m7♭5) is a diminished triad with a minor 7th added instead of a diminished 7th, making it slightly less tense than a fully diminished chord. It's best known as the ii chord in minor-key ii-V-i progressions in jazz.",
  maj9: "A major 9th chord extends a major 7th chord by adding the 9th (the 2nd scale degree, an octave up). That extra color note makes an already smooth major 7th sound even richer and more lush, common in jazz, neo-soul, and R&B.",
  min9: "A minor 9th chord extends a minor 7th chord by adding the 9th on top, layering extra color onto its already dark, smooth sound. It's widely used in jazz and neo-soul for a lush, sophisticated minor-key texture.",
  maj6: "A major 6th chord replaces a major 7th chord's 7th with the 6th scale degree instead, giving it a bright, open, slightly retro sound without the 7th's tension. It was a signature sound of swing-era and early jazz endings.",
  min6: "A minor 6th chord adds the 6th scale degree (rather than a 7th) on top of a minor triad, giving it a slightly unresolved, wistful color distinct from a plain minor 7th. It shows up often in jazz and film-score minor-key passages.",
  sus4: "A suspended 4th chord replaces a chord's 3rd with a 4th, removing the note that normally defines whether a chord is major or minor. That missing 3rd creates an open, floating tension that usually wants to resolve back down to the 3rd.",
  sus9: "A sus9 chord (also called 9sus4) replaces a dominant 9th chord's 3rd with a 4th, keeping the 7th and 9th on top. It has an open, ambiguous quality that avoids resolving to major or minor, often used in modern pop and jazz as a color chord on its own rather than a passing suspension.",
  add2: "A major add2 chord adds the 2nd scale degree on top of a plain major triad, without removing the 3rd (unlike a sus2 chord, which replaces it). That extra note adds a bright, open, slightly modern color while keeping the chord clearly major, common in pop and contemporary singer-songwriter music.",
  add4: "A major add4 chord adds the perfect 4th on top of a plain major triad, without removing the 3rd (unlike a sus4 chord, which replaces it). The 3rd and 4th sitting a half-step apart create a bit of inner tension, giving the chord a bright but slightly unresolved, open color.",
};

const EASY_CHOICES = JSON.stringify(["Major", "Minor", "Dominant 7th", "Diminished"]);
const MEDIUM_CHOICES = JSON.stringify(["Major", "Minor", "Dominant 7th", "Diminished", "Major 7th", "Minor 7th", "Augmented"]);
const HARD_CHOICES = JSON.stringify([
  "Major", "Minor", "Dominant 7th", "Diminished", "Major 7th", "Minor 7th", "Augmented",
  "Diminished 7th", "Half-Diminished", "Major 9th", "Minor 9th", "Major 6th", "Minor 6th", "Sus4",
  "Sus9", "Major add2", "Major add4",
]);

const plainExercises = [
  // Easy
  { title: "Major Chord",      difficulty: "easy", type: "major", answer: "Major",         choices: EASY_CHOICES },
  { title: "Minor Chord",      difficulty: "easy", type: "minor", answer: "Minor",         choices: EASY_CHOICES },
  { title: "Dominant 7th",     difficulty: "easy", type: "dom7",  answer: "Dominant 7th",  choices: EASY_CHOICES },
  { title: "Diminished Triad", difficulty: "easy", type: "dim",   answer: "Diminished",    choices: EASY_CHOICES },

  // Medium — inherited
  { title: "Major Chord",      difficulty: "medium", type: "major", answer: "Major",        choices: MEDIUM_CHOICES },
  { title: "Minor Chord",      difficulty: "medium", type: "minor", answer: "Minor",        choices: MEDIUM_CHOICES },
  { title: "Dominant 7th",     difficulty: "medium", type: "dom7",  answer: "Dominant 7th", choices: MEDIUM_CHOICES },
  { title: "Diminished Triad", difficulty: "medium", type: "dim",   answer: "Diminished",   choices: MEDIUM_CHOICES },
  // Medium — new
  { title: "Major 7th",        difficulty: "medium", type: "maj7", answer: "Major 7th",     choices: MEDIUM_CHOICES },
  { title: "Minor 7th",        difficulty: "medium", type: "min7", answer: "Minor 7th",     choices: MEDIUM_CHOICES },
  { title: "Augmented Triad",  difficulty: "medium", type: "aug",  answer: "Augmented",     choices: MEDIUM_CHOICES },

  // Hard — inherited
  { title: "Major Chord",      difficulty: "hard", type: "major", answer: "Major",         choices: HARD_CHOICES },
  { title: "Minor Chord",      difficulty: "hard", type: "minor", answer: "Minor",         choices: HARD_CHOICES },
  { title: "Dominant 7th",     difficulty: "hard", type: "dom7",  answer: "Dominant 7th",  choices: HARD_CHOICES },
  { title: "Diminished Triad", difficulty: "hard", type: "dim",   answer: "Diminished",    choices: HARD_CHOICES },
  { title: "Major 7th",        difficulty: "hard", type: "maj7",  answer: "Major 7th",     choices: HARD_CHOICES },
  { title: "Minor 7th",        difficulty: "hard", type: "min7",  answer: "Minor 7th",     choices: HARD_CHOICES },
  { title: "Augmented Triad",  difficulty: "hard", type: "aug",   answer: "Augmented",    choices: HARD_CHOICES },
  // Hard — new
  { title: "Diminished 7th",      difficulty: "hard", type: "dim7",   answer: "Diminished 7th",   choices: HARD_CHOICES },
  { title: "Half-Diminished 7th", difficulty: "hard", type: "min7b5", answer: "Half-Diminished",  choices: HARD_CHOICES },
  { title: "Major 9th",           difficulty: "hard", type: "maj9",   answer: "Major 9th",        choices: HARD_CHOICES },
  { title: "Minor 9th",           difficulty: "hard", type: "min9",   answer: "Minor 9th",        choices: HARD_CHOICES },
  { title: "Major 6th",           difficulty: "hard", type: "maj6",   answer: "Major 6th",        choices: HARD_CHOICES },
  { title: "Minor 6th",           difficulty: "hard", type: "min6",   answer: "Minor 6th",        choices: HARD_CHOICES },
  { title: "Suspended 4th",       difficulty: "hard", type: "sus4",   answer: "Sus4",             choices: HARD_CHOICES },
  { title: "Suspended 9th",       difficulty: "hard", type: "sus9",   answer: "Sus9",             choices: HARD_CHOICES },
  { title: "Major add2",          difficulty: "hard", type: "add2",   answer: "Major add2",       choices: HARD_CHOICES },
  { title: "Major add4",          difficulty: "hard", type: "add4",   answer: "Major add4",       choices: HARD_CHOICES },
];

// ─── Inversions ──────────────────────────────────────────────────────────────

const INVERSION_LABELS = ["Root Position", "1st Inversion", "2nd Inversion", "3rd Inversion"];

const TRIAD_CHOICES = JSON.stringify(
  ["Major", "Minor"].flatMap((label) => [0, 1, 2].map((i) => `${label} - ${INVERSION_LABELS[i]}`))
);

const SEVENTH_ADJACENT: Record<string, string[]> = {
  "Dominant 7th": ["Major 7th", "Minor 7th"],
  "Major 7th": ["Dominant 7th", "Minor 7th"],
  "Minor 7th": ["Major 7th", "Dominant 7th"],
  "Half-Diminished": ["Diminished 7th", "Minor 7th"],
};

function seventhChoices(chordLabel: string, inv: number): string {
  const sameType = [0, 1, 2, 3].map((i) => `${chordLabel} - ${INVERSION_LABELS[i]}`);
  const adjacent = (SEVENTH_ADJACENT[chordLabel] ?? []).map((l) => `${l} - ${INVERSION_LABELS[inv]}`);
  return JSON.stringify([...new Set([...sameType, ...adjacent])]);
}

const inversionExercises = [
  // Major/minor triads — only 1st + 2nd (root already covered by the plain chord), at medium
  ...["major", "minor"].flatMap((type) => {
    const label = type === "major" ? "Major" : "Minor";
    return [1, 2].map((inv) => ({
      type,
      inversion: inv,
      difficulty: "medium",
      answer: `${label} - ${INVERSION_LABELS[inv]}`,
      choices: TRIAD_CHOICES,
    }));
  }),
  // All septachords except diminished 7th — full root+1st+2nd+3rd, at hard
  ...[
    { type: "dom7", label: "Dominant 7th" },
    { type: "maj7", label: "Major 7th" },
    { type: "min7", label: "Minor 7th" },
    { type: "min7b5", label: "Half-Diminished" },
  ].flatMap(({ type, label }) =>
    [0, 1, 2, 3].map((inv) => ({
      type,
      inversion: inv,
      difficulty: "hard",
      answer: `${label} - ${INVERSION_LABELS[inv]}`,
      choices: seventhChoices(label, inv),
    }))
  ),
];

async function run() {
  const deleted = await db
    .delete(exercises)
    .where(and(eq(exercises.category, "chord"), ne(exercises.difficulty, "jazz")))
    .returning({ id: exercises.id });
  console.log(`Deleted ${deleted.length} existing non-jazz chord exercises.`);

  let inserted = 0;

  for (const ex of plainExercises) {
    await db.insert(exercises).values({
      category: "chord",
      title: ex.title,
      prompt: PROMPT,
      difficulty: ex.difficulty as "easy" | "medium" | "hard",
      config: JSON.stringify({ type: ex.type }),
      choices: ex.choices,
      answer: ex.answer,
      explanation: EXPLANATIONS[ex.type],
    });
    inserted++;
  }

  for (const ex of inversionExercises) {
    const label = ex.answer.split(" - ")[0];
    const invLabel = INVERSION_LABELS[ex.inversion];
    await db.insert(exercises).values({
      category: "chord",
      title: `${label} Chord — ${invLabel}`,
      prompt: INVERSION_PROMPT,
      difficulty: ex.difficulty as "medium" | "hard",
      config: JSON.stringify({ type: ex.type, inversion: ex.inversion, topic: "inversions" }),
      choices: ex.choices,
      answer: ex.answer,
      explanation: EXPLANATIONS[ex.type],
    });
    inserted++;
  }

  console.log(`Inserted ${inserted} exercises (${plainExercises.length} plain + ${inversionExercises.length} inversions).`);
}

run().catch(console.error).finally(() => client.end());

// One-off bootstrap for Phase 2 verification: the admin editor (Phase 4) doesn't
// exist yet, so this seeds the first real topic+lessons directly. From Phase 5
// onward, all further content goes through the admin UI, not scripts like this.
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const now = Math.floor(Date.now() / 1000);

const [topic] = await sql`
  insert into topics (slug, title, description, sort_order, created_at, updated_at)
  values ('musical-alphabet', 'Musical Alphabet & Octaves', 'The seven letter names music is built from, and how octave numbers work.', 0, ${now}, ${now})
  returning id
`;

const lesson1Body = JSON.stringify([
  { type: "text", body: "Western music names pitches using just seven letters: A, B, C, D, E, F, G. After G, the pattern repeats back to A — there is no H." },
  { type: "text", body: "Play a note, then its next-door letter an octave higher. Notice it sounds like \"the same note, but higher\" — that's because doubling a pitch's frequency produces the next occurrence of the same letter name." },
  { type: "audioExample", label: "Play C4", play: { kind: "note", root: "C4" }, compareLabel: "Play C5", comparePlay: { kind: "note", root: "C5" } },
  { type: "tip", body: "You don't need to memorize frequencies — just that going up by one octave means \"same letter, twice as high-sounding.\"" },
  { type: "commonMistake", body: "It's tempting to assume the alphabet restarts at some other letter, or that there's an \"H\" note in some countries' notation. In the notation Eardle uses, it's always A through G, then back to A." },
  { type: "summary", body: "Pitches are named A-G, repeating. The next occurrence of the same letter, higher up, is one octave away." },
])

const lesson2Body = JSON.stringify([
  { type: "text", body: "Because letter names repeat every octave, we need a way to tell C4 apart from C5. The octave number does that — it increases by one each time you pass the next C going up." },
  { type: "text", body: "Middle C — the C nearest the middle of a piano keyboard, and a common reference point in notation — is written C4." },
  { type: "audioExample", label: "Play Middle C (C4)", play: { kind: "note", root: "C4" } },
  { type: "commonMistake", body: "It's natural to assume the octave number changes at A, since the alphabet \"starts\" there. It actually changes at C — so B3 is followed by C4, not B4 by C5." },
  { type: "audioExample", label: "Play B3", play: { kind: "note", root: "B3" }, compareLabel: "Play C4", comparePlay: { kind: "note", root: "C4" } },
  { type: "summary", body: "Octave numbers increase at C, not at A. C4 (\"middle C\") is a common reference point." },
])

await sql`
  insert into lessons (topic_id, slug, title, sort_order, practice_category, practice_exercise_ids, body, published, created_at, updated_at)
  values
    (${topic.id}, 'the-musical-alphabet', 'The Musical Alphabet', 0, 'note', ${JSON.stringify([314,315,316,317,318])}, ${lesson1Body}, true, ${now}, ${now}),
    (${topic.id}, 'octaves-and-middle-c', 'Octaves and Middle C', 1, null, null, ${lesson2Body}, true, ${now}, ${now})
`;

console.log("Seeded topic + 2 lessons.");
await sql.end();

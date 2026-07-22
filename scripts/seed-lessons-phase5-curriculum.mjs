// Phase 5: bulk-populates the ~22-topic curriculum outline (docs/lessons-planning/
// curriculum-outline.md) researched and approved earlier. Written directly against
// the DB rather than clicked through one-by-one in the admin UI, purely because of
// the sheer volume of content — Phase 4 already proved the admin UI itself works
// end-to-end (topic/lesson create, edit, delete, block editor, practice-picker
// reuse, revision snapshotting). Every row this script creates is fully editable
// afterward through that same admin UI — nothing here is a special case.
//
// Topic 1 ("Musical Alphabet & Octaves") already exists from the Phase 2 bootstrap
// script. This script adds topics 2-22.
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const now = Math.floor(Date.now() / 1000);

const topicDefs = [
  { slug: "note-reading-staff-basics", title: "Note Reading & Staff Basics",
    description: "A minimal reading primer — Eardle trains your ear, but this helps you follow the notation used in explanations." },
  { slug: "accidentals-enharmonic-equivalence", title: "Accidentals & Enharmonic Equivalence",
    description: "Sharps, flats, and why C# and Db are the exact same pitch." },
  { slug: "semitones-and-whole-tones", title: "Semitones and Whole Tones",
    description: "The smallest unit of musical distance, and the building block for every interval, scale, and chord." },
  { slug: "scale-degrees-movable-do", title: "Scale Degrees & Movable-Do Hearing",
    description: "Hearing notes by their function in a key, not their absolute pitch — the foundation relative pitch is built on." },
  { slug: "major-scale-construction", title: "Major Scale Construction",
    description: "The whole-whole-half step recipe that builds a major scale starting on any note." },
  { slug: "key-signatures-circle-of-fifths", title: "Key Signatures & the Circle of Fifths",
    description: "How the twelve major keys relate to each other, one perfect fifth at a time." },
  { slug: "minor-scales", title: "Minor Scales: Natural, Harmonic, Melodic",
    description: "Three closely related scale forms sharing one tonic, each used for a different musical purpose." },
  { slug: "interval-naming-quality", title: "Interval Naming & Quality",
    description: "How an interval's number and quality combine into its full name." },
  { slug: "interval-reference-songs", title: "Interval Ear-Recognition via Reference Songs",
    description: "Using songs you already know as memorable anchors for each interval." },
  { slug: "compound-intervals", title: "Compound Intervals",
    description: "Intervals that stretch beyond a single octave — 9ths, 10ths, and beyond." },
  { slug: "triad-construction", title: "Triad Construction as Stacked Intervals",
    description: "Every triad quality is just two stacked 3rds — major or minor, in one of two orders." },
  { slug: "seventh-chords", title: "Seventh Chords",
    description: "Stacking one more 3rd onto a triad for a richer, more harmonically active sound." },
  { slug: "chord-inversions", title: "Chord Inversions",
    description: "Rearranging which chord tone sits at the bottom, without changing the chord's identity." },
  { slug: "functional-harmony-basics", title: "Functional Harmony Basics",
    description: "Tonic, subdominant, and dominant — the three roles every chord in a key can play." },
  { slug: "common-progressions", title: "Common Progressions",
    description: "The pop I-V-vi-IV loop, the 12-bar blues, and the other chord skeletons behind popular music." },
  { slug: "minor-key-modal-progressions", title: "Minor-Key & Modal Progressions",
    description: "How the minor scale you use shapes a progression's dominant, and how borrowed chords add color." },
  { slug: "jazz-ii-v-i", title: "Jazz ii-V-I and Extended Harmony",
    description: "The most common chord movement in jazz, and the extensions built on top of it." },
  { slug: "modes-of-major-scale", title: "Modes of the Major Scale",
    description: "The same seven notes, renumbered from a different starting degree." },
  { slug: "pentatonic-blues-scales", title: "Pentatonic & Blues Scales",
    description: "Stripping the major scale down to five forgiving notes, then adding one 'blue' note back in." },
  { slug: "melodic-minor-modes", title: "Melodic Minor Modes",
    description: "Melodic minor's own family of seven modes, central to jazz improvisation." },
  { slug: "symmetric-scales", title: "Whole Tone & Diminished (Symmetric) Scales",
    description: "Scales that repeat one interval pattern around the octave, with no single strong tonic." },
];

const topicIds = {};
// topic 1 already exists — look it up so later lessons can reference it as a prerequisite
const [existingTopic1] = await sql`select id from topics where slug = 'musical-alphabet'`;
topicIds["musical-alphabet"] = existingTopic1.id;

for (let i = 0; i < topicDefs.length; i++) {
  const t = topicDefs[i];
  const [row] = await sql`
    insert into topics (slug, title, description, sort_order, created_at, updated_at)
    values (${t.slug}, ${t.title}, ${t.description}, ${i + 1}, ${now}, ${now})
    returning id
  `;
  topicIds[t.slug] = row.id;
}

function lesson({ topicSlug, slug, title, prereqSlug, practiceCategory, practiceExerciseIds, body }) {
  return {
    topicId: topicIds[topicSlug],
    slug,
    title,
    sortOrder: 0,
    prerequisiteTopicId: prereqSlug ? topicIds[prereqSlug] : null,
    practiceCategory: practiceCategory ?? null,
    practiceExerciseIds: practiceExerciseIds ?? null,
    body: JSON.stringify(body),
  };
}

const lessons = [
  lesson({
    topicSlug: "note-reading-staff-basics", slug: "reading-the-staff", title: "Reading the Staff",
    prereqSlug: "musical-alphabet",
    body: [
      { type: "text", body: "Eardle trains your ear, not your eyes — but a little reading fluency helps you follow explanations, chord names, and interval labels used throughout the app." },
      { type: "text", body: "The staff is five horizontal lines with four spaces between them. A clef at the start tells you which pitch each line and space represents. The treble clef is used for higher-pitched instruments and the right hand of piano; the bass clef is used for lower pitches and the left hand." },
      { type: "tip", body: "A common trick for the treble clef's lines (bottom to top): Every Good Boy Does Fine (E-G-B-D-F). The spaces spell FACE." },
      { type: "commonMistake", body: "Don't assume the same line or space means the same note in every clef — a note on the bottom line of the treble clef (E) is a completely different pitch than the bottom line of the bass clef (G)." },
      { type: "audioExample", label: "Bottom line of the treble clef (E4)", play: { kind: "note", root: "E4" }, compareLabel: "Bottom line of the bass clef (G2)", comparePlay: { kind: "note", root: "G2" } },
      { type: "summary", body: "The staff shows pitch by vertical position, and the clef defines what those positions mean. Treble and bass clef read the same-looking positions as different notes." },
    ],
  }),
  lesson({
    topicSlug: "accidentals-enharmonic-equivalence", slug: "sharps-flats-and-enharmonics", title: "Sharps, Flats, and Enharmonics",
    prereqSlug: "note-reading-staff-basics",
    practiceCategory: "note", practiceExerciseIds: [328, 329, 330, 331, 332],
    body: [
      { type: "text", body: "A sharp (♯) raises a pitch by one semitone; a flat (♭) lowers it by one semitone. Together with the seven natural letters, they fill in every pitch a piano keyboard can produce." },
      { type: "text", body: "Because there's no black key between B and C, or between E and F, raising B by a semitone lands you on the same key as C — not a new black key. That note has two valid names, B♯ and C, and they're called enharmonic equivalents: different names, identical pitch." },
      { type: "tip", body: "Whether a pitch gets called by its sharp name or its flat name usually depends on the musical context (the key you're in), not any difference in sound — a piano can't distinguish D♯ from E♭." },
      { type: "commonMistake", body: "Assuming every pitch has exactly one correct name. C♯ and D♭ are the same key on a keyboard — Eardle's answer choices may present either spelling for the same sound, and both are correct." },
      { type: "audioExample", label: "Play C♯4", play: { kind: "note", root: "C#4" }, compareLabel: "Play D♭4 (the exact same pitch, spelled differently)", comparePlay: { kind: "note", root: "C#4" } },
      { type: "summary", body: "Sharps raise and flats lower a pitch by a semitone. Enharmonic pairs (like C♯/D♭) name the identical pitch two different ways." },
    ],
  }),
  lesson({
    topicSlug: "semitones-and-whole-tones", slug: "semitones-vs-whole-tones", title: "Semitones vs Whole Tones",
    prereqSlug: "accidentals-enharmonic-equivalence",
    practiceCategory: "interval", practiceExerciseIds: [627, 628],
    body: [
      { type: "text", body: "A semitone (half step) is the smallest interval in Western music — the distance between any key and the very next one, black or white. A whole tone (whole step) is two semitones stacked together." },
      { type: "text", body: "Every major scale is built from a specific pattern of whole and half steps: W-W-H-W-W-W-H. Recognizing that pattern by ear is the first step toward recognizing scales and modes." },
      { type: "tip", body: "Play two adjacent keys on a piano (including black keys) to hear a semitone. Skip one key to hear a whole tone." },
      { type: "commonMistake", body: "Beginners often confuse the visual gap between two white keys (like E-F) with an actual whole tone — but E to F is only a semitone since there's no black key between them." },
      { type: "audioExample", label: "Semitone (C4 to C♯4)", play: { kind: "interval", noteA: "C4", noteB: "C#4" }, compareLabel: "Whole Tone (C4 to D4)", comparePlay: { kind: "interval", noteA: "C4", noteB: "D4" } },
      { type: "summary", body: "Semitone = smallest step. Whole tone = two semitones. Not every adjacent white key pair is a whole tone — check for a black key between them." },
    ],
  }),
  lesson({
    topicSlug: "scale-degrees-movable-do", slug: "hearing-scale-degrees", title: "Hearing Scale Degrees",
    prereqSlug: "semitones-and-whole-tones",
    practiceCategory: "scale", practiceExerciseIds: [418],
    body: [
      { type: "text", body: "Absolute pitch — recognizing 'that note is a C' — is rare and mostly irrelevant to ear training. Relative pitch — recognizing 'that note is the 5th degree of whatever key we're in' — is the skill that actually transfers between songs, keys, and instruments." },
      { type: "text", body: "Movable-do solfège gives scale degrees names: do (1st), re (2nd), mi (3rd), fa (4th), sol (5th), la (6th), ti (7th), and back to do. 'Movable' means do always means 'the tonic of the current key,' whatever pitch that happens to be — unlike a fixed-do system where do always means C." },
      { type: "tip", body: "Sing or hum 'do' as the tonic before you start an exercise, then measure new notes against it in your head. That anchor is what makes a fifth 'feel' different from a third, rather than sounding like an abstract distance." },
      { type: "commonMistake", body: "Confusing scale-degree numbers with counting from wherever a melody happens to start. The 1st scale degree is always the tonic — the 'home' note of the key — not necessarily the first note you happen to hear." },
      { type: "audioExample", label: "Play a major scale (do to do)", play: { kind: "scale", root: "C4", scaleType: "major" } },
      { type: "summary", body: "Scale degrees describe a note's function relative to a movable 'do' (the tonic), not its absolute pitch. This relative hearing is the foundation interval and chord recognition build on." },
    ],
  }),
  lesson({
    topicSlug: "major-scale-construction", slug: "building-the-major-scale", title: "Building the Major Scale",
    prereqSlug: "scale-degrees-movable-do",
    practiceCategory: "scale", practiceExerciseIds: [418],
    body: [
      { type: "text", body: "The major scale is built from a fixed recipe of whole and half steps, starting on any note: Whole-Whole-Half-Whole-Whole-Whole-Half (W-W-H-W-W-W-H). Apply that pattern starting on any pitch and you get 'that pitch, major.'" },
      { type: "text", body: "For a C major scale: C(W)D(W)E(H)F(W)G(W)A(W)B(H)C. Notice the two half-steps land between scale degrees 3-4 and 7-8 — those two half-steps give the major scale its recognizable, resolved sound, especially the pull from the 7th degree (the leading tone) back up to the tonic." },
      { type: "tip", body: "Play the pattern starting on a few different white and black keys — the pattern of spacing you feel is identical every time, even though the actual notes change completely." },
      { type: "commonMistake", body: "Assuming a major scale is just 'the white keys.' That's only true starting from C. Starting from any other note, you need the right mix of sharps or flats to preserve the W-W-H-W-W-W-H spacing." },
      { type: "audioExample", label: "Play C major scale", play: { kind: "scale", root: "C4", scaleType: "major" }, compareLabel: "Play F major scale (same pattern, new starting note)", comparePlay: { kind: "scale", root: "F4", scaleType: "major" } },
      { type: "summary", body: "Every major scale follows W-W-H-W-W-W-H starting from its tonic. The half-steps between degrees 3-4 and 7-8 define its characteristic sound." },
    ],
  }),
  lesson({
    topicSlug: "key-signatures-circle-of-fifths", slug: "the-circle-of-fifths", title: "The Circle of Fifths",
    prereqSlug: "major-scale-construction",
    practiceCategory: "progression", practiceExerciseIds: [478],
    body: [
      { type: "text", body: "Each major key has its own key signature — a fixed set of sharps or flats applied throughout a piece so its notes fall into that key's major scale automatically, without marking every accidental individually." },
      { type: "text", body: "The circle of fifths arranges all twelve major keys so each step clockwise is a perfect fifth higher and adds exactly one sharp; each step counter-clockwise is a fifth lower and adds one flat. C major (no sharps or flats) sits at the top; going clockwise: G (1 sharp), D (2 sharps), A (3 sharps), and so on." },
      { type: "tip", body: "You don't need to memorize all twelve key signatures by rote — memorize the circle's shape (fifths going up add sharps) and you can derive any key signature from it." },
      { type: "commonMistake", body: "Mixing up 'sharp keys' and 'flat keys' direction. Moving up in fifths (clockwise) adds sharps; moving down in fifths (counter-clockwise) adds flats — it's easy to flip this backwards from memory." },
      { type: "audioExample", label: "Play a perfect 5th (the circle's building block)", play: { kind: "interval", noteA: "C4", noteB: "G4" }, compareLabel: "Play the next fifth up (G to D)", comparePlay: { kind: "interval", noteA: "G4", noteB: "D5" } },
      { type: "summary", body: "The circle of fifths orders the twelve major keys by ascending perfect fifths, and doubles as a map of how many sharps or flats each key's signature has." },
    ],
  }),
  lesson({
    topicSlug: "minor-scales", slug: "three-minor-scales", title: "Three Minor Scales",
    prereqSlug: "major-scale-construction",
    practiceCategory: "scale", practiceExerciseIds: [491, 420, 429],
    body: [
      { type: "text", body: "Major isn't the only 7-note scale family — minor keys draw on three closely related scale forms, each used for a different musical purpose, all sharing one tonic." },
      { type: "text", body: "Natural minor (also called the Aeolian mode) simply lowers the 3rd, 6th, and 7th scale degrees of the major scale. Harmonic minor raises that 7th degree back up, restoring a strong pull toward the tonic (a leading tone) at the cost of an unusual gap — an augmented 2nd — between the 6th and 7th degrees. Melodic minor traditionally raises both the 6th and 7th degrees on the way up, smoothing out that gap." },
      { type: "tip", body: "Harmonic minor's augmented 2nd (between degrees 6 and 7) has an exotic, almost Middle-Eastern flavor that immediately distinguishes it from natural minor once you know to listen for it." },
      { type: "commonMistake", body: "Treating 'minor scale' as if it were a single fixed thing the way the major scale is. Which of the three forms is being used changes the 6th and/or 7th scale degree — always check which one an exercise or piece is drawing from." },
      { type: "audioExample", label: "Play A natural minor", play: { kind: "scale", root: "A3", scaleType: "aeolian" }, compareLabel: "Play A harmonic minor", comparePlay: { kind: "scale", root: "A3", scaleType: "harmonic_minor" } },
      { type: "summary", body: "Natural minor lowers the 3rd, 6th, 7th of major. Harmonic minor raises the 7th back up for a stronger cadence. Melodic minor also raises the 6th when ascending. All three share the same tonic and lowered 3rd." },
    ],
  }),
  lesson({
    topicSlug: "interval-naming-quality", slug: "naming-intervals", title: "Naming Intervals",
    prereqSlug: "major-scale-construction",
    practiceCategory: "interval", practiceExerciseIds: [626, 627, 628, 629, 630, 631, 632, 633],
    body: [
      { type: "text", body: "An interval's full name has two parts: a number (how many letter-names it spans, counting both endpoints) and a quality (major, minor, perfect, augmented, or diminished — describing its exact size within that number)." },
      { type: "text", body: "Unisons, 4ths, 5ths, and octaves are called 'perfect' because they stay consonant and structurally stable when inverted; 2nds, 3rds, 6ths, and 7ths come in major or minor versions, with minor always one semitone smaller than major." },
      { type: "tip", body: "Anchor each interval to a song you already know by heart — for example, the opening notes of 'Here Comes the Bride' rise by a perfect 4th. Once an interval has a memorable sound attached, you stop having to count semitones." },
      { type: "commonMistake", body: "Counting only the semitone distance and forgetting the letter-count. An augmented 4th and a diminished 5th both span 6 semitones and sound identical on a piano, but are named differently depending on spelling and context — Eardle groups these under the common name 'tritone.'" },
      { type: "audioExample", label: "Play a major 3rd", play: { kind: "interval", noteA: "C4", noteB: "E4" }, compareLabel: "Play a minor 3rd", comparePlay: { kind: "interval", noteA: "C4", noteB: "D#4" } },
      { type: "summary", body: "Intervals are named by number (letter-span) and quality (major/minor/perfect/augmented/diminished). Perfect intervals are unison, 4th, 5th, and octave; the rest are major or minor." },
    ],
  }),
  lesson({
    topicSlug: "interval-reference-songs", slug: "song-anchors-for-intervals", title: "Song Anchors for Intervals",
    prereqSlug: "interval-naming-quality",
    practiceCategory: "interval", practiceExerciseIds: [626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638],
    body: [
      { type: "text", body: "Cold recognition of 'that's a major 6th' is hard to build directly — but almost everyone can recognize a familiar song within one or two notes. The reference-song method exploits that: pair each interval with a song opening that uses it, drill the association until it's automatic, then let the song fade into the background as pure interval recognition takes over." },
      { type: "text", body: "A few widely used anchors: minor 2nd ascending resembles the 'Jaws' theme; major 2nd ascending resembles 'Happy Birthday'; minor 3rd descending resembles the opening of 'Hey Jude'; perfect 4th ascending resembles 'Here Comes the Bride'; perfect 5th ascending resembles the 'Star Wars' main theme; and an ascending octave resembles 'Somewhere Over the Rainbow.'" },
      { type: "tip", body: "Pick your own anchor songs if the standard ones don't stick for you — the method works with any song you already know, not just the traditional examples." },
      { type: "commonMistake", body: "Relying on the song crutch forever instead of gradually testing yourself without it. The goal is for the song to train your ear, then get out of the way — periodically try to name an interval before the song comes to mind." },
      { type: "audioExample", label: "Perfect 5th (a 'Star Wars'-style opening)", play: { kind: "interval", noteA: "C4", noteB: "G4" } },
      { type: "summary", body: "Attach each interval to a song opening you already know, drill the pairing, then practice naming the interval directly as the song association fades." },
    ],
  }),
  lesson({
    topicSlug: "compound-intervals", slug: "intervals-beyond-the-octave", title: "Intervals Beyond the Octave",
    prereqSlug: "interval-naming-quality",
    practiceCategory: "interval", practiceExerciseIds: [639, 640, 641, 642],
    body: [
      { type: "text", body: "A compound interval is simply a simple interval (2nd through 7th) plus one or more extra octaves. A 9th is an octave plus a 2nd; a 10th is an octave plus a 3rd — the ear-recognition skill is identical, since a compound interval keeps the same quality (major/minor) as its simple counterpart, just spread further apart." },
      { type: "text", body: "Compound intervals matter most once chords stack pitches beyond a single octave, which is common in jazz voicings — a '9th chord' literally adds the pitch a 9th above the root." },
      { type: "tip", body: "When an interval sounds bigger than an octave, first identify which simple interval it would reduce to if you dropped the top note down an octave — a minor 9th is still fundamentally a minor 2nd's sound, just spread out." },
      { type: "commonMistake", body: "Trying to count semitones from scratch across two octaves. It's faster to recognize 'octave plus a 2nd' as two already-familiar chunks than to count all 13-16 semitones directly." },
      { type: "audioExample", label: "Play a major 9th (octave + major 2nd)", play: { kind: "interval", noteA: "C4", noteB: "D5" }, compareLabel: "Play the major 2nd it's built from", comparePlay: { kind: "interval", noteA: "C4", noteB: "D4" } },
      { type: "summary", body: "Compound intervals = an octave + a simple interval, keeping that simple interval's quality. A 9th behaves like a 2nd, a 10th like a 3rd, spread further apart." },
    ],
  }),
  lesson({
    topicSlug: "triad-construction", slug: "triads-as-stacked-thirds", title: "Triads as Stacked Thirds",
    prereqSlug: "interval-naming-quality",
    practiceCategory: "chord", practiceExerciseIds: [643, 644, 646, 653],
    body: [
      { type: "text", body: "A triad is just two intervals of a 3rd stacked on top of each other — root, third, fifth. Which triad quality you get depends only on whether each of those two 3rds is major (4 semitones) or minor (3 semitones)." },
      { type: "text", body: "Major triad = major 3rd + minor 3rd (e.g. C-E-G). Minor triad = minor 3rd + major 3rd (e.g. C-E♭-G) — the same two interval sizes, swapped. Diminished triad = minor 3rd + minor 3rd (both small, e.g. C-E♭-G♭). Augmented triad = major 3rd + major 3rd (both large, e.g. C-E-G♯)." },
      { type: "tip", body: "Once you can hear the quality of the bottom 3rd (root to middle note) in isolation, you've already narrowed it down to major/augmented (major 3rd on bottom) or minor/diminished (minor 3rd on bottom) — the top 3rd tells you the rest." },
      { type: "commonMistake", body: "Trying to recognize a whole triad's sound from scratch every time instead of decomposing it into its two intervals. Since interval recognition is already trained, reuse it here rather than starting over." },
      { type: "audioExample", label: "Play a C major triad", play: { kind: "chord", root: "C4", chordType: "major" }, compareLabel: "Play a C minor triad (swap the bottom 3rd)", comparePlay: { kind: "chord", root: "C4", chordType: "minor" } },
      { type: "summary", body: "Triads = two stacked 3rds. Major = major+minor 3rd. Minor = minor+major 3rd. Diminished = minor+minor 3rd. Augmented = major+major 3rd." },
    ],
  }),
  lesson({
    topicSlug: "seventh-chords", slug: "adding-the-seventh", title: "Adding the Seventh",
    prereqSlug: "triad-construction",
    practiceCategory: "chord", practiceExerciseIds: [645, 651, 652, 661, 662],
    body: [
      { type: "text", body: "A seventh chord takes a triad and stacks one more 3rd on top, adding a fourth note a 7th above the root. That extra note gives seventh chords their richer, more 'suspended in motion' sound compared to plain triads." },
      { type: "text", body: "The most common seventh-chord qualities: major 7th (major triad + a major 7th above the root), dominant 7th (major triad + a minor 7th — the workhorse of blues and functional cadences), minor 7th (minor triad + a minor 7th), diminished 7th (diminished triad + a diminished 7th, splitting the octave into four equal minor 3rds), and half-diminished 7th, written m7♭5 (a diminished triad + a minor 7th — one semitone 'kinder' than a fully diminished 7th)." },
      { type: "tip", body: "Dominant 7th chords have a built-in restlessness — the interval between the 3rd and the 7th of the chord is a tritone, the same unstable interval you already trained, and it's what makes a dominant 7th 'want' to resolve." },
      { type: "commonMistake", body: "Confusing diminished 7th and half-diminished 7th (m7♭5) — they share the same diminished triad base, but differ in that 7th: fully diminished uses a diminished 7th (very dark, symmetrical), half-diminished uses a minor 7th (slightly less tense)." },
      { type: "audioExample", label: "Play a dominant 7th chord", play: { kind: "chord", root: "C4", chordType: "dom7" }, compareLabel: "Play a major 7th chord", comparePlay: { kind: "chord", root: "C4", chordType: "maj7" } },
      { type: "summary", body: "A seventh chord = a triad + one more stacked 3rd. Common qualities: major7, dominant7, minor7, diminished7, half-diminished7 (m7♭5) — each defined by its triad plus the exact size of that added 7th." },
    ],
  }),
  lesson({
    topicSlug: "chord-inversions", slug: "root-position-and-inversions", title: "Root Position and Inversions",
    prereqSlug: "seventh-chords",
    practiceCategory: "chord", practiceExerciseIds: [671, 672, 673, 674, 675, 676, 677, 678],
    body: [
      { type: "text", body: "So far every chord has been in root position — root on the bottom, third and fifth stacked above. An inversion simply moves the root (or another chord tone) to a different position in the stack, usually because the lowest-sounding note needs to be something other than the root." },
      { type: "text", body: "In 1st inversion, the 3rd is the lowest note (the root moves up an octave). In 2nd inversion, the 5th is the lowest note. Seventh chords add a 3rd inversion, where the 7th itself sits on the bottom. The chord's letter-name and quality don't change — only which chord tone is lowest." },
      { type: "tip", body: "Listen for the bass note first, then work out which chord tone it is. A chord that 'feels' major but has an unusually tense, floaty bass is often a major or minor chord in 2nd inversion, since a 5th-in-the-bass sound is naturally less stable than root-in-the-bass." },
      { type: "commonMistake", body: "Assuming an inverted chord is a different chord entirely. C major in 1st inversion (E-G-C) is still a C major chord — same three notes, same letter name — just rearranged so E is lowest." },
      { type: "audioExample", label: "C major, root position (C-E-G)", play: { kind: "arpeggio", notes: ["C4", "E4", "G4"] }, compareLabel: "C major, 1st inversion (E-G-C)", comparePlay: { kind: "arpeggio", notes: ["E4", "G4", "C5"] } },
      { type: "summary", body: "Inversions rearrange which chord tone sits at the bottom (root, 3rd, 5th, or for sevenths, the 7th) without changing the chord's underlying identity." },
    ],
  }),
  lesson({
    topicSlug: "functional-harmony-basics", slug: "tonic-subdominant-dominant", title: "Tonic, Subdominant, Dominant",
    prereqSlug: "triad-construction",
    practiceCategory: "progression", practiceExerciseIds: [402],
    body: [
      { type: "text", body: "Every chord in a key plays one of three functional roles: tonic (rest, 'home' — built on scale degree 1), subdominant (motion away from home — degree 4), and dominant (maximum tension, pulling back to tonic — degree 5, especially when it's a dominant 7th chord)." },
      { type: "text", body: "Roman numerals label a chord by which scale degree it's built on and whether it's major or minor in that key: uppercase for major triads (I, IV, V in a major key), lowercase for minor (ii, iii, vi). The V chord's tension comes from its leading tone — scale degree 7 — sitting a half-step below the tonic, pulling the ear to resolve upward." },
      { type: "tip", body: "Listen for where a progression 'wants to go' rather than only naming isolated chords — dominant function is defined by that pull toward tonic, which is easiest to hear in context, not in isolation." },
      { type: "commonMistake", body: "Assuming roman numeral case tells you the chord's role directly. Case only encodes major vs. minor triad quality — role (tonic/subdominant/dominant) still depends on which scale degree the chord is built on." },
      { type: "audioExample", label: "Play I - IV - V - I in C", play: { kind: "progression", chords: [["C4", "E4", "G4"], ["F4", "A4", "C5"], ["G4", "B4", "D5"], ["C4", "E4", "G4"]], tempo: 90 } },
      { type: "summary", body: "Chords group into tonic (rest), subdominant (departure), and dominant (tension, resolves to tonic) functions. Roman numerals label chords by scale degree and triad quality within a key." },
    ],
  }),
  lesson({
    topicSlug: "common-progressions", slug: "pop-diatonic-and-blues-progressions", title: "Pop, Diatonic, and Blues Progressions",
    prereqSlug: "functional-harmony-basics",
    practiceCategory: "progression", practiceExerciseIds: [472, 403, 517],
    body: [
      { type: "text", body: "Certain chord sequences recur across huge swaths of popular music because they set up and resolve tension in satisfying, predictable ways. The pop I-V-vi-IV loop (heard in hundreds of songs) cycles through all three functional roles smoothly. The 12-bar blues compresses I, IV, and V into a repeating 12-measure form that underlies blues, early rock and roll, and much of jazz." },
      { type: "text", body: "Diatonic progressions stay entirely within one key's seven natural chords; pop/rock progressions are a subset of diatonic writing chosen for how catchy and singable the resulting motion is." },
      { type: "tip", body: "Try to sing the bass note of each chord as it changes — the bass line of a I-V-vi-IV progression outlines a simple, memorable shape (scale degrees 1-5-6-4) that's often easier to latch onto by ear than the full chords." },
      { type: "commonMistake", body: "Assuming a familiar-sounding progression must be in a major key. Many blues and rock progressions use the same I-IV-V chord letters but built on a scale with a lowered 3rd and 7th, giving a fundamentally different color despite similar-looking roman numerals." },
      { type: "audioExample", label: "Play the pop I-V-vi-IV loop", play: { kind: "progression", chords: [["C4", "E4", "G4"], ["G4", "B4", "D5"], ["A4", "C5", "E5"], ["F4", "A4", "C5"]], tempo: 100 } },
      { type: "summary", body: "The I-V-vi-IV pop loop and the 12-bar blues are two of the most common chord skeletons in popular music, both built from diatonic tonic/subdominant/dominant chords." },
    ],
  }),
  lesson({
    topicSlug: "minor-key-modal-progressions", slug: "minor-key-and-modal-color", title: "Minor-Key and Modal Color",
    prereqSlug: "minor-scales",
    practiceCategory: "progression", practiceExerciseIds: [477, 484, 476],
    body: [
      { type: "text", body: "Minor-key progressions borrow their chord qualities from whichever minor scale form is in use — natural minor gives a lowered 7th degree, so the chord built on scale degree 5 comes out minor rather than major, softening the pull back to tonic. Using harmonic minor's raised 7th restores a proper major V (often V7) for a stronger cadence, at the cost of an accidental not found in the key signature." },
      { type: "text", body: "'Modal' progressions borrow chords from scale degrees outside standard major/minor entirely — most commonly a lowered 7th degree chord (♭VII) borrowed from Mixolydian, giving rock and folk music a floatier, less strongly resolved sound than a leading-tone-driven major cadence." },
      { type: "tip", body: "If a progression 'sounds minor' but the dominant tension you expect is missing, suspect natural minor's minor v chord rather than a harmonic-minor-style major V7 — the absence of that pull is itself a diagnostic clue." },
      { type: "commonMistake", body: "Hearing a ♭VII chord and assuming it must be a mistake or an out-of-key note. Borrowed chords like ♭VII are a deliberate, common coloristic device in rock, folk, and modal jazz — not an error to be 'corrected' back to a diatonic vii°." },
      { type: "audioExample", label: "Play i - VII - VI - VII in A minor", play: { kind: "progression", chords: [["A3", "C4", "E4"], ["G3", "B3", "D4"], ["F3", "A3", "C4"], ["G3", "B3", "D4"]], tempo: 90 } },
      { type: "summary", body: "Minor-key progressions vary their dominant chord's quality depending on which minor scale form is used. Modal progressions deliberately borrow chords like ♭VII from outside standard major/minor for color." },
    ],
  }),
  lesson({
    topicSlug: "jazz-ii-v-i", slug: "the-ii-v-i-progression", title: "The ii-V-I Progression",
    prereqSlug: "seventh-chords",
    practiceCategory: "progression", practiceExerciseIds: [410, 411],
    body: [
      { type: "text", body: "The ii-V-I is the single most common chord movement in jazz — a minor 7th chord (ii7) moves to a dominant 7th (V7), which resolves to a major 7th tonic (Imaj7). Each chord change moves the bass down a perfect 5th, and each chord shares several notes with the next, giving unusually smooth voice-leading." },
      { type: "text", body: "Jazz harmony extends triads and sevenths further — 9ths, 11ths, and 13ths stack additional 3rds beyond the 7th, and 'altered' dominants raise or lower the 9th and/or 5th for extra tension before resolving. These extensions color the same underlying ii-V-I skeleton rather than replacing it." },
      { type: "tip", body: "Listen for the bass motion in perfect 5ths first — once you can track ii-to-V-to-I by root movement alone, adding the extended color tones on top becomes much easier to parse by ear." },
      { type: "commonMistake", body: "Treating every dominant 7th chord followed by a major chord as automatically a 'ii-V-I.' The label specifically requires the preceding ii chord (a minor 7th a whole step below the dominant) — a V-I alone is just a plain authentic cadence, not a ii-V-I." },
      { type: "audioExample", label: "Play ii7 - V7 - Imaj7 in C", play: { kind: "progression", chords: [["D4", "F4", "A4", "C5"], ["G3", "B3", "D4", "F4"], ["C4", "E4", "G4", "B4"]], tempo: 90 } },
      { type: "summary", body: "ii-V-I moves a minor7 chord down a 5th to a dominant7, then down another 5th to a major7 tonic. Jazz extends this skeleton with 9ths, 11ths, 13ths, and altered dominants for color." },
    ],
  }),
  lesson({
    topicSlug: "modes-of-major-scale", slug: "the-seven-modes", title: "The Seven Modes",
    prereqSlug: "major-scale-construction",
    practiceCategory: "scale", practiceExerciseIds: [491, 423, 424, 494, 496],
    body: [
      { type: "text", body: "A mode is simply the major scale's own notes, renumbered to start from a different scale degree — same key signature, same pitches, different tonic. Starting a C major scale from its 2nd degree (D) gives you D Dorian; from its 5th degree (G) gives you G Mixolydian; and so on through all seven degrees." },
      { type: "text", body: "Each mode gets its distinct flavor from where its two half-steps land relative to the new tonic. Dorian (start on 2) has a minor 3rd but a raised 6th, giving it a bittersweet, jazzy minor color. Mixolydian (start on 5) has a major 3rd but a lowered 7th, sounding like major with a bluesy, unresolved edge. Phrygian (start on 3) has a lowered 2nd degree right next to the tonic, giving it a dark, Spanish-tinged color. Locrian (start on 7) even lowers the 5th degree, making it the least stable, rarely-used-as-a-tonic mode of the seven." },
      { type: "tip", body: "Compare each mode against the nearest familiar scale rather than the major scale itself — Dorian against natural minor (only the 6th degree differs), Mixolydian against major (only the 7th degree differs) — a single altered note is much easier to hear than the whole scale's gestalt." },
      { type: "commonMistake", body: "Thinking modes require learning seven entirely new note sets. Every mode of C major uses exactly the same seven pitches as C major — only the starting point (tonic) changes, which changes which intervals are measured from that new center." },
      { type: "audioExample", label: "Play D Dorian", play: { kind: "scale", root: "D4", scaleType: "dorian" }, compareLabel: "Play D natural minor (only the 6th differs)", comparePlay: { kind: "scale", root: "D4", scaleType: "aeolian" } },
      { type: "summary", body: "The seven modes reuse one scale's pitches starting from each of its seven degrees. Dorian, Mixolydian, Phrygian, and Locrian each get their color from one or two scale degrees that differ from the nearest major or minor scale." },
    ],
  }),
  lesson({
    topicSlug: "pentatonic-blues-scales", slug: "pentatonic-and-blues-scales", title: "Pentatonic and Blues Scales",
    prereqSlug: "minor-scales",
    practiceCategory: "scale", practiceExerciseIds: [422, 421, 425],
    body: [
      { type: "text", body: "The major pentatonic scale strips the major scale down to just five notes, removing the 4th and 7th degrees — the two notes most likely to clash or demand resolution. What's left is a scale where almost any combination of notes sounds consonant, which is why it's so common in folk melodies, guitar solos, and beginner improvisation." },
      { type: "text", body: "The blues scale takes the minor pentatonic (the relative-minor five-note scale) and adds one extra chromatic note — a lowered 5th degree sometimes called the 'blue note' — sitting right between the 4th and 5th. That single added note is responsible for blues music's signature bent, vocal-like quality." },
      { type: "tip", body: "Because pentatonic scales omit the tension-creating 4th and 7th degrees, they're a forgiving scale to practice recognizing by ear first — almost any note you land on sounds 'right,' letting you focus purely on the scale's overall shape." },
      { type: "commonMistake", body: "Confusing major pentatonic with its relative minor pentatonic. They contain the exact same five pitches (e.g. C major pentatonic = A minor pentatonic) — only the tonic differs, exactly like major/minor keys sharing a key signature." },
      { type: "audioExample", label: "Play C major pentatonic", play: { kind: "scale", root: "C4", scaleType: "pentatonic_major" }, compareLabel: "Play C blues scale", comparePlay: { kind: "scale", root: "C4", scaleType: "blues" } },
      { type: "summary", body: "Major pentatonic removes the major scale's 4th and 7th degrees. The blues scale adds one chromatic 'blue note' (a lowered 5th) to the minor pentatonic for blues' signature bent sound." },
    ],
  }),
  lesson({
    topicSlug: "melodic-minor-modes", slug: "modes-of-melodic-minor", title: "Modes of Melodic Minor",
    prereqSlug: "modes-of-major-scale",
    practiceCategory: "scale", practiceExerciseIds: [429, 497, 498, 499, 500],
    body: [
      { type: "text", body: "Just as the major scale generates seven modes, the (ascending) melodic minor scale generates its own family of seven modes — widely used in jazz improvisation for the extra tension and color they add over specific chord types." },
      { type: "text", body: "Two of the most commonly named: Lydian dominant (melodic minor's 4th mode) — a major scale with a raised 4th and lowered 7th, used over dominant 7th chords with a ♯11; and the altered scale (melodic minor's 7th mode) — used over altered dominant chords, containing a flatted 9th, sharped 9th, sharped 11th, and flatted 13th all at once." },
      { type: "tip", body: "Rather than memorizing all seven melodic-minor modes as isolated formulas, learn them the same way as major-scale modes — as melodic minor, renumbered from a different starting degree — and listen for which single note differs from a mode you already know." },
      { type: "commonMistake", body: "Assuming melodic minor's descending form (which reverts to natural minor in classical usage) applies in a jazz context. Jazz theory almost always uses the same ascending melodic-minor pitches in both directions." },
      { type: "audioExample", label: "Play C melodic minor", play: { kind: "scale", root: "C4", scaleType: "melodic_minor" }, compareLabel: "Play F Lydian dominant (its 4th mode)", comparePlay: { kind: "scale", root: "F4", scaleType: "lydian_b7" } },
      { type: "summary", body: "Melodic minor generates seven modes the same way the major scale does. Lydian dominant and the altered scale are the two most commonly used in jazz, each defined by one or two altered degrees relative to familiar scales." },
    ],
  }),
  lesson({
    topicSlug: "symmetric-scales", slug: "whole-tone-and-diminished-scales", title: "Whole Tone and Diminished Scales",
    prereqSlug: "melodic-minor-modes",
    practiceCategory: "scale", practiceExerciseIds: [501, 502, 503],
    body: [
      { type: "text", body: "Symmetric scales repeat the same interval pattern all the way around the octave, which means they have no single strong 'home' tonic the way major or minor scales do — every starting point sounds equally plausible as the tonic." },
      { type: "text", body: "The whole tone scale stacks six whole steps in a row (only two whole-tone scales exist in total, since starting on any of its six notes just gives you the same six pitches again). The diminished scale alternates whole and half steps around the octave in one of two orders — half-whole or whole-half — producing eight notes total, commonly used over dominant 7th and fully diminished 7th chords respectively." },
      { type: "tip", body: "Because these scales repeat their pattern every whole step (whole tone) or every minor 3rd (diminished), you can often identify them just from hearing 2-3 consecutive notes and recognizing that the same gap keeps repeating." },
      { type: "commonMistake", body: "Trying to assign a single obvious tonic to a symmetric scale the way you would for major or minor. Their whole appeal — and their identifying feature — is that repeated symmetry; there often isn't one uniquely 'correct' resting note." },
      { type: "audioExample", label: "Play C whole tone scale", play: { kind: "scale", root: "C4", scaleType: "whole_tone" }, compareLabel: "Play C half-whole diminished scale", comparePlay: { kind: "scale", root: "C4", scaleType: "half_whole" } },
      { type: "summary", body: "Symmetric scales repeat one interval pattern around the octave with no single strong tonic: whole tone (all whole steps) and diminished (alternating whole/half steps, in half-whole or whole-half order)." },
    ],
  }),
];

for (const l of lessons) {
  await sql`
    insert into lessons
      (topic_id, slug, title, sort_order, prerequisite_topic_id, practice_category, practice_exercise_ids, body, published, created_at, updated_at)
    values
      (${l.topicId}, ${l.slug}, ${l.title}, ${l.sortOrder}, ${l.prerequisiteTopicId},
       ${l.practiceCategory}, ${l.practiceExerciseIds ? JSON.stringify(l.practiceExerciseIds) : null},
       ${l.body}, true, ${now}, ${now})
  `;
}

console.log(`Seeded ${topicDefs.length} topics and ${lessons.length} lessons.`);
await sql.end();

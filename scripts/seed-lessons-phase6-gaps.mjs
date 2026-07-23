// Phase 6: fills gaps in the curriculum found two ways —
//   1. Music theory concepts not yet covered that are genuinely useful
//      (consonance/dissonance, cadence types, secondary dominants).
//   2. Chord qualities that already exist in the exercises table but that no
//      lesson currently explains (sus4/add2/add4, 6th chords, 9th/11th/13th
//      extensions, altered dominants) — found by cross-referencing
//      lib/audio/theory.ts's CHORD_TYPES against what Phase 5 linked.
//
// Inserts 8 new topics and re-sequences sort_order for ALL topics so the new
// ones land in a pedagogically sensible spot in the suggested path, rather
// than being appended at the end. Also updates two existing lessons'
// prerequisiteTopicId to point at new, more specific prerequisite topics.
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const now = Math.floor(Date.now() / 1000);

// ── 1. Re-sequence existing topics ──────────────────────────────────────────
const existingOrder = [
  "musical-alphabet", "note-reading-staff-basics", "accidentals-enharmonic-equivalence",
  "semitones-and-whole-tones", "scale-degrees-movable-do", "major-scale-construction",
  "key-signatures-circle-of-fifths", "minor-scales", "interval-naming-quality",
  "__consonance-and-dissonance__",
  "interval-reference-songs", "compound-intervals", "triad-construction", "seventh-chords",
  "__sixth-chords__", "__suspended-added-tone-chords__", "__extended-chords__",
  "chord-inversions",
  "__chord-voicings-playback__",
  "functional-harmony-basics",
  "__cadences__",
  "common-progressions",
  "__secondary-dominants__",
  "minor-key-modal-progressions",
  "__altered-dominants__",
  "jazz-ii-v-i", "modes-of-major-scale", "pentatonic-blues-scales", "melodic-minor-modes", "symmetric-scales",
];

const topicIds = {};
for (let i = 0; i < existingOrder.length; i++) {
  const slug = existingOrder[i];
  if (slug.startsWith("__")) continue; // new topic placeholder, inserted below
  const [row] = await sql`select id from topics where slug = ${slug}`;
  if (!row) throw new Error(`Existing topic not found: ${slug}`);
  topicIds[slug] = row.id;
  await sql`update topics set sort_order = ${i}, updated_at = ${now} where id = ${row.id}`;
}

// ── 2. Insert new topics at their resolved sort_order ───────────────────────
const newTopicDefs = [
  { slug: "consonance-and-dissonance", title: "Consonance & Dissonance",
    description: "Why some intervals sound stable and restful, and others sound tense and want to resolve." },
  { slug: "sixth-chords", title: "Sixth Chords",
    description: "A close cousin of seventh chords — stacking a 6th on top of a triad instead." },
  { slug: "suspended-added-tone-chords", title: "Suspended & Added-Tone Chords",
    description: "Chords that replace or supplement a triad's 3rd for an open, ambiguous color." },
  { slug: "extended-chords", title: "Extended Chords: 9ths, 11ths, 13ths",
    description: "Stacking 3rds past the 7th for jazz harmony's rich, layered sound." },
  { slug: "chord-voicings-playback", title: "Chord Voicings & Playback",
    description: "Close vs. open spacing, and harmonic vs. arpeggiated vs. bass-note-first playback." },
  { slug: "cadences", title: "Cadences",
    description: "The harmonic punctuation marks at the end of a phrase — authentic, plagal, half, and deceptive." },
  { slug: "secondary-dominants", title: "Secondary Dominants",
    description: "How any diatonic chord can temporarily borrow its own dominant." },
  { slug: "altered-dominants", title: "Altered Dominants",
    description: "Raising or lowering a dominant chord's upper extensions for extra pre-resolution tension." },
];

for (let i = 0; i < existingOrder.length; i++) {
  const slug = existingOrder[i];
  if (!slug.startsWith("__")) continue;
  const realSlug = slug.replaceAll("__", "");
  const def = newTopicDefs.find((t) => t.slug === realSlug);
  const [row] = await sql`
    insert into topics (slug, title, description, sort_order, created_at, updated_at)
    values (${def.slug}, ${def.title}, ${def.description}, ${i}, ${now}, ${now})
    returning id
  `;
  topicIds[def.slug] = row.id;
}

// ── 3. New lessons ───────────────────────────────────────────────────────────
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
    topicSlug: "consonance-and-dissonance", slug: "consonance-vs-dissonance", title: "Consonance vs Dissonance",
    prereqSlug: "interval-naming-quality",
    practiceCategory: "interval", practiceExerciseIds: [626, 630, 633, 632],
    body: [
      { type: "text", body: "Some intervals sound stable and 'resolved' the moment they're played; others sound restless, almost demanding to move somewhere else. That perceptual difference is called consonance (stable, restful) versus dissonance (tense, active) — and it's the engine behind almost all harmonic motion in Western music." },
      { type: "text", body: "Unisons, octaves, perfect 5ths, and perfect 4ths are the most consonant intervals — their frequency ratios are simple, which the ear parses as 'two notes agreeing.' Major and minor 3rds and 6ths are still consonant, just slightly less pure. 2nds, 7ths, and the tritone are dissonant — their frequency ratios are more complex, and the ear hears them as wanting to resolve to something simpler." },
      { type: "tip", body: "The tritone is sometimes called 'diabolus in musica' (the devil in music) historically, for how unresolved it sounds — that's exactly the tension a dominant 7th chord relies on to pull toward its tonic." },
      { type: "commonMistake", body: "Assuming 'dissonant' means 'wrong' or 'bad-sounding.' Dissonance is a tool, not a flaw — it's what creates the pull that makes resolution satisfying. Music made of only consonant intervals can sound static and directionless." },
      { type: "audioExample", label: "Play a perfect 5th (consonant)", play: { kind: "interval", noteA: "C4", noteB: "G4" }, compareLabel: "Play a tritone (dissonant)", comparePlay: { kind: "interval", noteA: "C4", noteB: "F#4" } },
      { type: "summary", body: "Consonant intervals (unison, octave, 4th, 5th, 3rds, 6ths) sound stable; dissonant intervals (2nds, 7ths, the tritone) sound tense and want to resolve. Dissonance is what drives harmonic motion forward." },
    ],
  }),
  lesson({
    topicSlug: "sixth-chords", slug: "major-and-minor-sixth-chords", title: "Major and Minor Sixth Chords",
    prereqSlug: "seventh-chords",
    practiceCategory: "chord", practiceExerciseIds: [665, 666, 362],
    body: [
      { type: "text", body: "A 6th chord adds the note a major 6th above the root to a plain triad, instead of a 7th. It's a close cousin of seventh chords — same idea (stack one more note), different added interval." },
      { type: "text", body: "Major 6th chords (major triad + a major 6th) have a bright, unresolved-but-comfortable sound, often used as a substitute for a major 7th chord to end a phrase without the major 7th's slightly 'dreamy' pull. Minor 6th chords (minor triad + a major 6th above the root) are common in jazz and film-score minor cadences. Add a 9th on top of a major 6th chord and you get the '6/9' chord — a lush, ambiguous, very common jazz-comping sound." },
      { type: "tip", body: "Listen for the 6th chord's added note sitting a whole step below the octave — that's what distinguishes it from a 7th chord, whose added note sits closer to the octave above. Comparing 'distance from the top note to the octave above the root' is often the fastest way to tell 6ths and 7ths apart by ear." },
      { type: "commonMistake", body: "Confusing a major 6th chord with a minor 7th chord built a third lower — they share three notes in common (C6 = C-E-G-A, and Am7 = A-C-E-G, the same four pitches), so which note feels like 'home' matters more than the raw pitch content." },
      { type: "audioExample", label: "Play a C major 6th chord", play: { kind: "chord", root: "C4", chordType: "maj6" }, compareLabel: "Play a C minor 6th chord", comparePlay: { kind: "chord", root: "C4", chordType: "min6" } },
      { type: "summary", body: "A 6th chord = triad + a major 6th above the root. Major 6th substitutes comfortably for major 7th; minor 6th is common in jazz/film minor cadences; 6/9 adds a 9th on top for a lush comping sound." },
    ],
  }),
  lesson({
    topicSlug: "suspended-added-tone-chords", slug: "sus-and-add-chords", title: "Sus4, Add2, and Add4 Chords",
    prereqSlug: "triad-construction",
    practiceCategory: "chord", practiceExerciseIds: [667, 669, 670],
    body: [
      { type: "text", body: "Suspended and added-tone chords modify a triad without using its 3rd the normal way — they replace or supplement it, producing an open, ambiguous sound that's neither clearly major nor minor." },
      { type: "text", body: "A sus4 chord replaces the 3rd entirely with a 4th (root-4th-5th) — the missing 3rd is what makes it sound suspended, neither major nor minor, until it resolves (traditionally down to the 3rd). Add2 and add4 chords, by contrast, keep the ordinary 3rd but add an extra color tone on top — a 2nd or 4th — without adding a full 7th." },
      { type: "tip", body: "If a chord sounds like a plain triad but with something 'else' hovering in it — neither a clear major nor minor color, nor a full seventh-chord richness — suspect a sus4 or add-tone chord before reaching for a more exotic explanation." },
      { type: "commonMistake", body: "Assuming any chord with a '4' or '2' in its name must be complicated. Sus4/add2/add4 are structurally simpler than seventh chords — they only ever contain three or four notes, no seventh involved at all." },
      { type: "audioExample", label: "Play a C major triad", play: { kind: "chord", root: "C4", chordType: "major" }, compareLabel: "Play a Csus4 (3rd replaced by a 4th)", comparePlay: { kind: "chord", root: "C4", chordType: "sus4" } },
      { type: "summary", body: "Sus4 replaces a triad's 3rd with a 4th, sounding neither major nor minor. Add2/add4 keep the 3rd and add one extra color tone on top, without a full 7th." },
    ],
  }),
  lesson({
    topicSlug: "extended-chords", slug: "ninths-elevenths-thirteenths", title: "9ths, 11ths, and 13ths",
    prereqSlug: "seventh-chords",
    practiceCategory: "chord", practiceExerciseIds: [663, 664, 373, 367, 368],
    body: [
      { type: "text", body: "Once a seventh chord is in place, you can keep stacking 3rds past the 7th: a 9th (an octave plus a 2nd above the root), an 11th (an octave plus a 4th), and a 13th (an octave plus a 6th). Each extension adds one more color tone without necessarily changing the chord's basic major/minor/dominant identity." },
      { type: "text", body: "In practice, extended chords are rarely played with every note below the top extension intact — a voicing might quietly drop the 9th or 11th and jump straight to the 13th, since the ear mostly cares about the highest, most colorful extension present plus the defining 3rd and 7th. Extended chords are the backbone of jazz harmony's rich, layered sound." },
      { type: "tip", body: "Rather than trying to count every note in a 13th chord, first identify the underlying 7th-chord quality (major7/minor7/dominant7), then listen for just the highest, added color tone on top — that's usually enough to name the extension correctly." },
      { type: "commonMistake", body: "Assuming a 9th, 11th, or 13th chord must sound 'more dissonant' in proportion to how many notes it has. Extensions are chosen specifically because they add color without clashing — a dom9 or maj9 often sounds smoother than the plain 7th chord it's built from, not harsher." },
      { type: "audioExample", label: "Play a dominant 9th chord", play: { kind: "chord", root: "C4", chordType: "dom9" }, compareLabel: "Play a minor 11th chord", comparePlay: { kind: "chord", root: "D4", chordType: "min11" } },
      { type: "summary", body: "Extended chords keep stacking 3rds past the 7th: 9th, 11th, 13th. Each adds one color tone above the underlying 7th-chord quality, and jazz voicings often thin out the middle notes and keep just the top extension." },
    ],
  }),
  lesson({
    topicSlug: "chord-voicings-playback", slug: "close-open-and-arpeggiated-voicings", title: "Close, Open, and Arpeggiated Voicings",
    prereqSlug: "chord-inversions",
    practiceCategory: "chord", practiceExerciseIds: [643, 644],
    body: [
      { type: "text", body: "The exact same chord — same root, same quality — can be arranged (voiced) in more than one way, and it can be played back in more than one way. Neither changes what chord it is, but both change how it sounds and how easy it is to recognize by ear." },
      { type: "text", body: "A 'close' voicing stacks the chord tones as tightly as possible; an 'open' voicing spreads them out, usually by moving the middle note up an octave, giving a wider, airier sound. Eardle can also play a chord as a single simultaneous strike (harmonic), as a rolled arpeggio (notes played quickly one after another), or bass-note-first (the root sounds alone briefly before the full chord joins in) — that last option is especially useful for anchoring your ear to the root before judging the chord's quality." },
      { type: "tip", body: "If a chord quality feels harder to identify than usual, try switching how you listen to it: hearing the bass-note-first playback lets you lock in the root, then judge the quality of everything stacked above it, rather than trying to parse the whole cluster of notes at once." },
      { type: "commonMistake", body: "Assuming an open-voiced chord (wider spacing) must be a different or more complex chord than the same notes in close voicing. Voicing only changes which octave each note lands in — the chord's letter name, root, and quality are unchanged." },
      { type: "audioExample", label: "C major, close voicing (arpeggiated)", play: { kind: "arpeggio", notes: ["C4", "E4", "G4"] }, compareLabel: "C major, open voicing (arpeggiated)", comparePlay: { kind: "arpeggio", notes: ["C4", "G4", "E5"] } },
      { type: "summary", body: "Voicing (close vs. open, and beyond) rearranges the octave placement of a chord's notes without changing its identity. Playback style (harmonic, arpeggiated, bass-note-first) is a listening aid — bass-note-first is especially useful for anchoring the root before judging quality." },
    ],
  }),
  lesson({
    topicSlug: "cadences", slug: "authentic-plagal-half-and-deceptive-cadences", title: "Authentic, Plagal, Half, and Deceptive Cadences",
    prereqSlug: "functional-harmony-basics",
    practiceCategory: "progression", practiceExerciseIds: [402, 405, 406],
    body: [
      { type: "text", body: "A cadence is the harmonic punctuation at the end of a musical phrase — a specific chord-to-chord move that signals varying degrees of finality, the way a period, comma, or question mark signals different things at the end of a sentence." },
      { type: "text", body: "An authentic cadence (V to I) is the strongest, most conclusive resolution — the leading tone pulls up to the tonic and the bass falls a 5th, landing squarely on 'home.' A plagal cadence (IV to I) is gentler and less tense (sometimes called the 'Amen cadence' from its use in hymns), since it has no leading tone pulling hard toward tonic. A half cadence ends on V itself, left hanging — it sounds like a comma, not a full stop, and expects more music to follow. A deceptive cadence sets up a V chord as if heading to I, then resolves instead to vi, subverting the expected resolution for a surprising, unresolved effect." },
      { type: "tip", body: "Listen for where the bass note lands at the very end of a phrase: home (I) after a strong pull = authentic; home (I) via a softer approach = plagal; stuck on the dominant = half; landing somewhere unexpected (vi) = deceptive." },
      { type: "commonMistake", body: "Assuming any V-to-something motion is 'the same kind of ending.' The chord a phrase actually lands on — I, vi, or staying on V — is what defines which cadence type it is, not just the fact that a dominant chord was involved somewhere in the phrase." },
      { type: "audioExample", label: "Authentic cadence: V - I", play: { kind: "progression", chords: [["G4", "B4", "D5"], ["C4", "E4", "G4"]], tempo: 80 }, compareLabel: "Deceptive cadence: V - vi", comparePlay: { kind: "progression", chords: [["G4", "B4", "D5"], ["A4", "C5", "E5"]], tempo: 80 } },
      { type: "summary", body: "Cadences are the ending-punctuation of a phrase: authentic (V-I, strongest), plagal (IV-I, gentler), half (ends on V, left hanging), and deceptive (V resolves to vi instead of I, surprising)." },
    ],
  }),
  lesson({
    topicSlug: "secondary-dominants", slug: "dominants-of-dominants", title: "Dominants of Dominants",
    prereqSlug: "common-progressions",
    practiceCategory: "progression", practiceExerciseIds: [482],
    body: [
      { type: "text", body: "Every diatonic chord in a key can temporarily borrow its own 'dominant' — a chord built a 5th above it, made major (or dominant 7th), that pulls toward it exactly the way the real V pulls toward I. That borrowed chord is called a secondary dominant, labeled V/x ('five of x') for whichever chord x it's targeting." },
      { type: "text", body: "The most common example is V/V (the 'five of five') — in the key of C, that's a D major (or D7) chord, borrowing the note F♯ (not naturally in C major) to strongly pull toward G, the real V chord. This briefly tonicizes G — makes it feel like a momentary 'home' — before the progression continues on its way, usually back to the real tonic." },
      { type: "tip", body: "Any unexpected accidental appearing briefly in an otherwise diatonic progression, right before a chord change that still 'makes sense' functionally, is a strong clue you're hearing a secondary dominant rather than a wrong note." },
      { type: "commonMistake", body: "Treating the borrowed accidental in a secondary dominant as evidence of a full key change (modulation). A secondary dominant is a brief, local pull toward one chord — the music usually returns to the original key immediately after, unlike a true modulation which settles into the new key for a while." },
      { type: "audioExample", label: "Play V/V - V - I in C (D - G - C)", play: { kind: "progression", chords: [["D4", "F#4", "A4"], ["G4", "B4", "D5"], ["C4", "E4", "G4"]], tempo: 85 } },
      { type: "summary", body: "A secondary dominant briefly borrows the 'V of' any diatonic chord, using an out-of-key accidental to pull strongly toward that chord before the progression continues — most commonly V/V, the five-of-five." },
    ],
  }),
  lesson({
    topicSlug: "altered-dominants", slug: "altering-the-9th-11th-13th", title: "Altering the 9th, 11th, and 13th",
    prereqSlug: "extended-chords",
    practiceCategory: "chord", practiceExerciseIds: [381, 382, 389, 388],
    body: [
      { type: "text", body: "An altered dominant raises or lowers one of a dominant chord's upper extensions — the 9th, 11th, or 13th — by a semitone, adding extra tension before an especially strong resolution. Altered dominants are a jazz-harmony staple, almost always appearing right before a resolution to a minor (or sometimes major) tonic." },
      { type: "text", body: "Common alterations: ♭9 and ♯9 (a minor or augmented 9th above the root — the ♯9 is the famous 'Hendrix chord' sound), and ♯11 or ♭13. Multiple alterations can even stack in the same chord. The 'altered scale' from an earlier lesson covers exactly these alteration options — a dominant chord and the altered scale built on the same root share the same available tensions." },
      { type: "tip", body: "Altered dominants tend to sound 'crunchier' and more urgent than a plain dominant 7th — if a dominant chord sounds unusually spicy right before a satisfying minor resolution, listen specifically for whether the 9th or 5th has been bent up or down from its plain form." },
      { type: "commonMistake", body: "Assuming any dissonant-sounding dominant chord must be altered. A plain dominant 7th is already dissonant by design — 'altered' specifically means one of the upper extensions has been raised or lowered from its usual diatonic form, not just 'sounds tense.'" },
      { type: "audioExample", label: "Play a C7♯9 (the 'Hendrix chord')", play: { kind: "chord", root: "C4", chordType: "dom7s9" }, compareLabel: "Play a plain C7 for comparison", comparePlay: { kind: "chord", root: "C4", chordType: "dom7" } },
      { type: "summary", body: "Altered dominants raise or lower a dominant chord's 9th, 11th, or 13th for extra tension before resolving — ♯9 (the 'Hendrix chord'), ♭9, ♯11, and ♭13 are the most common alterations, often stacked together in jazz harmony." },
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

// ── 4. Sharpen two existing lessons' prerequisites now that more specific
//      topics exist between them in the sequence ──────────────────────────
await sql`
  update lessons set prerequisite_topic_id = ${topicIds["cadences"]}, updated_at = ${now}
  where slug = 'pop-diatonic-and-blues-progressions'
`;
await sql`
  update lessons set prerequisite_topic_id = ${topicIds["altered-dominants"]}, updated_at = ${now}
  where slug = 'the-ii-v-i-progression'
`;

console.log(`Re-sequenced ${existingOrder.length - newTopicDefs.length} existing topics, added ${newTopicDefs.length} topics and ${lessons.length} lessons.`);
await sql.end();

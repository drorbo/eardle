// One-time data-repair script: remaps lessons.practice_exercise_ids from
// this-database ids to whatever ids the SAME exercises actually have in the
// database this script is run against.
//
// Why this exists: lessons reference practice exercises by numeric row id.
// Those ids are only stable within the database they were assigned in — if
// a lesson was authored (or its exercise ids captured) against one database
// and then read against a different one (e.g. dev vs. production, seeded/
// migrated independently over time), the ids drift and no longer point at
// the same exercises, or at anything at all.
//
// This script does NOT trust raw ids as portable. Instead it identifies
// each referenced exercise by its actual content — (category, difficulty,
// config) — which is what an exercise semantically IS, captured below from
// a known-good source database. For each lesson, it looks up the CURRENT
// database's own id for that same (category, difficulty, config) combo and
// rewrites practice_exercise_ids to point at it.
//
// Usage (run inside the app container so DATABASE_URL is already set):
//   npx tsx scripts/remap-lesson-practice-ids.ts             # dry run — reports only, writes nothing
//   npx tsx scripts/remap-lesson-practice-ids.ts --apply     # actually updates the database
//
// Safe to re-run: it always recomputes from the embedded snapshot below, so
// running it twice (e.g. after re-seeding exercises) just re-resolves ids
// from scratch rather than compounding any previous run.

import { asc, eq } from "drizzle-orm";
import { db, client } from "../lib/db";
import { lessons as lessonsTable, exercises as exercisesTable } from "../lib/db/schema";

// Snapshot captured from the database these lessons were authored against —
// every exercise currently referenced by any lesson's practice_exercise_ids,
// identified by content rather than id.
const KNOWN_LESSONS: { id: number; title: string; practiceCategory: string; practiceExerciseIds: number[] }[] =
  [
    {
      "id": 1,
      "title": "The Musical Alphabet",
      "practiceCategory": "note",
      "practiceExerciseIds": [
        314,
        315,
        316,
        317,
        318
      ]
    },
    {
      "id": 5,
      "title": "Sharps, Flats, and Enharmonics",
      "practiceCategory": "note",
      "practiceExerciseIds": [
        328,
        329,
        330,
        331,
        332
      ]
    },
    {
      "id": 6,
      "title": "Semitones vs Whole Tones",
      "practiceCategory": "interval",
      "practiceExerciseIds": [
        627,
        628
      ]
    },
    {
      "id": 7,
      "title": "Hearing Scale Degrees",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        418
      ]
    },
    {
      "id": 8,
      "title": "Building the Major Scale",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        418
      ]
    },
    {
      "id": 10,
      "title": "Three Minor Scales",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        491,
        420,
        429
      ]
    },
    {
      "id": 11,
      "title": "Naming Intervals",
      "practiceCategory": "interval",
      "practiceExerciseIds": [
        626,
        627,
        628,
        629,
        630,
        631,
        632,
        633
      ]
    },
    {
      "id": 13,
      "title": "Intervals Beyond the Octave",
      "practiceCategory": "interval",
      "practiceExerciseIds": [
        639,
        640,
        641,
        642
      ]
    },
    {
      "id": 14,
      "title": "Triads as Stacked Thirds",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        643,
        644,
        646,
        653
      ]
    },
    {
      "id": 27,
      "title": "Sus4, Add2, and Add4 Chords",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        667,
        669,
        670
      ]
    },
    {
      "id": 15,
      "title": "Adding the Seventh",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        645,
        651,
        652,
        661,
        662
      ]
    },
    {
      "id": 16,
      "title": "Root Position and Inversions",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        671,
        672,
        673,
        674,
        675,
        676,
        677,
        678
      ]
    },
    {
      "id": 21,
      "title": "The Seven Modes",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        491,
        423,
        424,
        494,
        496
      ]
    },
    {
      "id": 22,
      "title": "Pentatonic and Blues Scales",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        422,
        421,
        425
      ]
    },
    {
      "id": 19,
      "title": "Minor-Key and Modal Color",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        477,
        484,
        476
      ]
    },
    {
      "id": 23,
      "title": "Modes of Melodic Minor",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        429,
        497,
        498,
        499,
        500
      ]
    },
    {
      "id": 24,
      "title": "Whole Tone and Diminished Scales",
      "practiceCategory": "scale",
      "practiceExerciseIds": [
        501,
        502,
        503
      ]
    },
    {
      "id": 25,
      "title": "Consonance vs Dissonance",
      "practiceCategory": "interval",
      "practiceExerciseIds": [
        626,
        630,
        633,
        632
      ]
    },
    {
      "id": 26,
      "title": "Major and Minor Sixth Chords",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        665,
        666,
        362
      ]
    },
    {
      "id": 28,
      "title": "9ths, 11ths, and 13ths",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        663,
        664,
        373,
        367,
        368
      ]
    },
    {
      "id": 29,
      "title": "Close, Open, and Arpeggiated Voicings",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        643,
        644
      ]
    },
    {
      "id": 31,
      "title": "Dominants of Dominants",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        482
      ]
    },
    {
      "id": 32,
      "title": "Altering the 9th, 11th, and 13th",
      "practiceCategory": "chord",
      "practiceExerciseIds": [
        381,
        382,
        389,
        388
      ]
    },
    {
      "id": 17,
      "title": "Tonic, Subdominant, Dominant",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        402
      ]
    },
    {
      "id": 20,
      "title": "The ii-V-I Progression",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        410,
        411
      ]
    },
    {
      "id": 30,
      "title": "Authentic, Plagal, Half, and Deceptive Cadences",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        402,
        405,
        406
      ]
    },
    {
      "id": 18,
      "title": "Pop, Diatonic, and Blues Progressions",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        472,
        403,
        517
      ]
    },
    {
      "id": 12,
      "title": "Song Anchors for Intervals",
      "practiceCategory": "interval",
      "practiceExerciseIds": [
        626,
        627,
        628,
        629,
        630,
        631,
        632,
        633,
        634,
        635,
        636,
        637,
        638
      ]
    },
    {
      "id": 9,
      "title": "The Circle of Fifths",
      "practiceCategory": "progression",
      "practiceExerciseIds": [
        478
      ]
    }
  ];

const KNOWN_EXERCISES: { id: number; category: string; difficulty: string; config: string }[] =
  [
    {
      "id": 626,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":0,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 627,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":1,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 628,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":2,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 629,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":3,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 402,
      "category": "progression",
      "difficulty": "easy",
      "config": "{\"key\":\"C\",\"chords\":[[\"C4\",\"E4\",\"G4\"],[\"F4\",\"A4\",\"C5\"],[\"G4\",\"B4\",\"D5\"]],\"romanNumerals\":[\"I\",\"IV\",\"V\"],\"tempo\":80}"
    },
    {
      "id": 411,
      "category": "progression",
      "difficulty": "jazz",
      "config": "{\"key\":\"Am\",\"chords\":[[\"B3\",\"D4\",\"F4\",\"A4\"],[\"E3\",\"G#3\",\"B3\",\"D4\",\"F4\"],[\"A3\",\"C4\",\"E4\",\"G4\"]],\"romanNumerals\":[\"iim7b5\",\"V7b9\",\"im7\"],\"tempo\":76}"
    },
    {
      "id": 630,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":4,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 631,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":5,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 632,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":6,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 517,
      "category": "progression",
      "difficulty": "easy",
      "config": "{\"key\":\"C\",\"chords\":[[\"C3\",\"E3\",\"G3\"],[\"F3\",\"A3\",\"C4\"],[\"C3\",\"E3\",\"G3\"],[\"G3\",\"B3\",\"D4\"]],\"romanNumerals\":[\"I\",\"IV\",\"I\",\"V\"],\"tempo\":88,\"topic\":\"blues\"}"
    },
    {
      "id": 633,
      "category": "interval",
      "difficulty": "easy",
      "config": "{\"semitones\":7,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 425,
      "category": "scale",
      "difficulty": "hard",
      "config": "{\"type\":\"blues\"}"
    },
    {
      "id": 634,
      "category": "interval",
      "difficulty": "medium",
      "config": "{\"semitones\":8,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 635,
      "category": "interval",
      "difficulty": "medium",
      "config": "{\"semitones\":9,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 636,
      "category": "interval",
      "difficulty": "medium",
      "config": "{\"semitones\":10,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 637,
      "category": "interval",
      "difficulty": "medium",
      "config": "{\"semitones\":11,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 422,
      "category": "scale",
      "difficulty": "medium",
      "config": "{\"type\":\"pentatonic_major\"}"
    },
    {
      "id": 638,
      "category": "interval",
      "difficulty": "medium",
      "config": "{\"semitones\":12,\"playMode\":\"harmonic\"}"
    },
    {
      "id": 503,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"whole_half\",\"topic\":\"jazz_symmetric\"}"
    },
    {
      "id": 639,
      "category": "interval",
      "difficulty": "hard",
      "config": "{\"semitones\":13,\"playMode\":\"melodic\"}"
    },
    {
      "id": 640,
      "category": "interval",
      "difficulty": "hard",
      "config": "{\"semitones\":14,\"playMode\":\"melodic\"}"
    },
    {
      "id": 498,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"lydian_aug\",\"topic\":\"melodic_minor_modes\"}"
    },
    {
      "id": 499,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"mixolydian_b6\",\"topic\":\"melodic_minor_modes\"}"
    },
    {
      "id": 501,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"whole_tone\",\"topic\":\"jazz_symmetric\"}"
    },
    {
      "id": 491,
      "category": "scale",
      "difficulty": "easy",
      "config": "{\"type\":\"aeolian\",\"topic\":\"major_modes\"}"
    },
    {
      "id": 497,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"dorian_b2\",\"topic\":\"melodic_minor_modes\"}"
    },
    {
      "id": 641,
      "category": "interval",
      "difficulty": "hard",
      "config": "{\"semitones\":15,\"playMode\":\"melodic\"}"
    },
    {
      "id": 642,
      "category": "interval",
      "difficulty": "hard",
      "config": "{\"semitones\":16,\"playMode\":\"melodic\"}"
    },
    {
      "id": 643,
      "category": "chord",
      "difficulty": "easy",
      "config": "{\"type\":\"major\"}"
    },
    {
      "id": 644,
      "category": "chord",
      "difficulty": "easy",
      "config": "{\"type\":\"minor\"}"
    },
    {
      "id": 645,
      "category": "chord",
      "difficulty": "easy",
      "config": "{\"type\":\"dom7\"}"
    },
    {
      "id": 646,
      "category": "chord",
      "difficulty": "easy",
      "config": "{\"type\":\"dim\"}"
    },
    {
      "id": 651,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"maj7\"}"
    },
    {
      "id": 652,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"min7\"}"
    },
    {
      "id": 653,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"aug\"}"
    },
    {
      "id": 661,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"dim7\"}"
    },
    {
      "id": 662,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"min7b5\"}"
    },
    {
      "id": 663,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"maj9\"}"
    },
    {
      "id": 664,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"min9\"}"
    },
    {
      "id": 665,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"maj6\"}"
    },
    {
      "id": 666,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"min6\"}"
    },
    {
      "id": 667,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"sus4\"}"
    },
    {
      "id": 669,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"add2\"}"
    },
    {
      "id": 670,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"add4\"}"
    },
    {
      "id": 671,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"major\",\"inversion\":1,\"topic\":\"inversions\"}"
    },
    {
      "id": 672,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"major\",\"inversion\":2,\"topic\":\"inversions\"}"
    },
    {
      "id": 673,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"minor\",\"inversion\":1,\"topic\":\"inversions\"}"
    },
    {
      "id": 674,
      "category": "chord",
      "difficulty": "medium",
      "config": "{\"type\":\"minor\",\"inversion\":2,\"topic\":\"inversions\"}"
    },
    {
      "id": 675,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"dom7\",\"inversion\":0,\"topic\":\"inversions\"}"
    },
    {
      "id": 676,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"dom7\",\"inversion\":1,\"topic\":\"inversions\"}"
    },
    {
      "id": 677,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"dom7\",\"inversion\":2,\"topic\":\"inversions\"}"
    },
    {
      "id": 678,
      "category": "chord",
      "difficulty": "hard",
      "config": "{\"type\":\"dom7\",\"inversion\":3,\"topic\":\"inversions\"}"
    },
    {
      "id": 314,
      "category": "note",
      "difficulty": "easy",
      "config": "{\"note\":\"C\"}"
    },
    {
      "id": 315,
      "category": "note",
      "difficulty": "easy",
      "config": "{\"note\":\"D\"}"
    },
    {
      "id": 316,
      "category": "note",
      "difficulty": "easy",
      "config": "{\"note\":\"E\"}"
    },
    {
      "id": 317,
      "category": "note",
      "difficulty": "easy",
      "config": "{\"note\":\"F\"}"
    },
    {
      "id": 318,
      "category": "note",
      "difficulty": "easy",
      "config": "{\"note\":\"G\"}"
    },
    {
      "id": 328,
      "category": "note",
      "difficulty": "hard",
      "config": "{\"note\":\"C#\"}"
    },
    {
      "id": 329,
      "category": "note",
      "difficulty": "hard",
      "config": "{\"note\":\"D#\"}"
    },
    {
      "id": 330,
      "category": "note",
      "difficulty": "hard",
      "config": "{\"note\":\"F#\"}"
    },
    {
      "id": 331,
      "category": "note",
      "difficulty": "hard",
      "config": "{\"note\":\"G#\"}"
    },
    {
      "id": 332,
      "category": "note",
      "difficulty": "hard",
      "config": "{\"note\":\"A#\"}"
    },
    {
      "id": 362,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"maj6_9\",\"family\":\"major\"}"
    },
    {
      "id": 367,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"min11\",\"family\":\"minor\"}"
    },
    {
      "id": 368,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"min13\",\"family\":\"minor\"}"
    },
    {
      "id": 373,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"dom9\",\"family\":\"dominant\"}"
    },
    {
      "id": 381,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"dom7s9\",\"family\":\"altered\"}"
    },
    {
      "id": 382,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"dom7b9\",\"family\":\"altered\"}"
    },
    {
      "id": 388,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"dom7s5\",\"family\":\"altered\"}"
    },
    {
      "id": 389,
      "category": "chord",
      "difficulty": "jazz",
      "config": "{\"type\":\"dom7b5\",\"family\":\"altered\"}"
    },
    {
      "id": 405,
      "category": "progression",
      "difficulty": "medium",
      "config": "{\"key\":\"C\",\"chords\":[[\"C4\",\"E4\",\"G4\"],[\"A4\",\"C5\",\"E5\"],[\"F4\",\"A4\",\"C5\"],[\"G4\",\"B4\",\"D5\"]],\"romanNumerals\":[\"I\",\"vi\",\"IV\",\"V\"],\"tempo\":80}"
    },
    {
      "id": 406,
      "category": "progression",
      "difficulty": "medium",
      "config": "{\"key\":\"C\",\"chords\":[[\"C4\",\"E4\",\"G4\"],[\"F4\",\"A4\",\"C5\"],[\"A4\",\"C5\",\"E5\"],[\"G4\",\"B4\",\"D5\"]],\"romanNumerals\":[\"I\",\"IV\",\"vi\",\"V\"],\"tempo\":80}"
    },
    {
      "id": 410,
      "category": "progression",
      "difficulty": "jazz",
      "config": "{\"key\":\"C\",\"chords\":[[\"D3\",\"F3\",\"A3\",\"C4\"],[\"G3\",\"B3\",\"D4\",\"F4\"],[\"C3\",\"E3\",\"G3\",\"B3\"]],\"romanNumerals\":[\"ii7\",\"V7\",\"Imaj7\"],\"tempo\":80}"
    },
    {
      "id": 403,
      "category": "progression",
      "difficulty": "easy",
      "config": "{\"key\":\"C\",\"chords\":[[\"C4\",\"E4\",\"G4\"],[\"G4\",\"B4\",\"D5\"],[\"A4\",\"C5\",\"E5\"],[\"F4\",\"A4\",\"C5\"]],\"romanNumerals\":[\"I\",\"V\",\"vi\",\"IV\"],\"tempo\":76}"
    },
    {
      "id": 424,
      "category": "scale",
      "difficulty": "medium",
      "config": "{\"type\":\"mixolydian\"}"
    },
    {
      "id": 429,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"melodic_minor\"}"
    },
    {
      "id": 418,
      "category": "scale",
      "difficulty": "easy",
      "config": "{\"type\":\"major\"}"
    },
    {
      "id": 420,
      "category": "scale",
      "difficulty": "easy",
      "config": "{\"type\":\"harmonic_minor\"}"
    },
    {
      "id": 421,
      "category": "scale",
      "difficulty": "medium",
      "config": "{\"type\":\"blues\"}"
    },
    {
      "id": 423,
      "category": "scale",
      "difficulty": "medium",
      "config": "{\"type\":\"dorian\"}"
    },
    {
      "id": 472,
      "category": "progression",
      "difficulty": "easy",
      "config": "{\"key\":\"C\",\"chords\":[[\"C4\",\"E4\",\"G4\"],[\"F4\",\"A4\",\"C5\"],[\"G4\",\"B4\",\"D5\"],[\"C4\",\"E4\",\"G4\"]],\"romanNumerals\":[\"I\",\"IV\",\"V\",\"I\"],\"tempo\":80,\"topic\":\"pop\"}"
    },
    {
      "id": 476,
      "category": "progression",
      "difficulty": "medium",
      "config": "{\"key\":\"C\",\"chords\":[[\"C3\",\"E3\",\"G3\"],[\"Bb3\",\"D4\",\"F4\"],[\"F3\",\"A3\",\"C4\"],[\"C3\",\"E3\",\"G3\"]],\"romanNumerals\":[\"I\",\"bVII\",\"IV\",\"I\"],\"tempo\":80,\"topic\":\"modal\"}"
    },
    {
      "id": 477,
      "category": "progression",
      "difficulty": "medium",
      "config": "{\"key\":\"Am\",\"chords\":[[\"A3\",\"C4\",\"E4\"],[\"G3\",\"B3\",\"D4\"],[\"F3\",\"A3\",\"C4\"],[\"G3\",\"B3\",\"D4\"]],\"romanNumerals\":[\"i\",\"VII\",\"VI\",\"VII\"],\"tempo\":76,\"topic\":\"minor\"}"
    },
    {
      "id": 478,
      "category": "progression",
      "difficulty": "medium",
      "config": "{\"key\":\"C\",\"chords\":[[\"C3\",\"E3\",\"G3\"],[\"A3\",\"C4\",\"E4\"],[\"D3\",\"F3\",\"A3\"],[\"G3\",\"B3\",\"D4\"]],\"romanNumerals\":[\"I\",\"vi\",\"ii\",\"V\"],\"tempo\":80,\"topic\":\"diatonic\"}"
    },
    {
      "id": 482,
      "category": "progression",
      "difficulty": "hard",
      "config": "{\"key\":\"C\",\"chords\":[[\"C3\",\"E3\",\"G3\"],[\"D3\",\"F#3\",\"A3\"],[\"F3\",\"A3\",\"C4\"],[\"G3\",\"B3\",\"D4\"]],\"romanNumerals\":[\"I\",\"II\",\"IV\",\"V\"],\"tempo\":80,\"topic\":\"diatonic\"}"
    },
    {
      "id": 484,
      "category": "progression",
      "difficulty": "hard",
      "config": "{\"key\":\"Am\",\"chords\":[[\"A3\",\"C4\",\"E4\"],[\"E3\",\"G#3\",\"B3\",\"D4\"],[\"F3\",\"A3\",\"C4\"],[\"C3\",\"E3\",\"G3\"]],\"romanNumerals\":[\"i\",\"V7\",\"bVI\",\"III\"],\"tempo\":76,\"topic\":\"minor\"}"
    },
    {
      "id": 500,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"locrian_s2\",\"topic\":\"melodic_minor_modes\"}"
    },
    {
      "id": 502,
      "category": "scale",
      "difficulty": "jazz",
      "config": "{\"type\":\"half_whole\",\"topic\":\"jazz_symmetric\"}"
    },
    {
      "id": 494,
      "category": "scale",
      "difficulty": "medium",
      "config": "{\"type\":\"phrygian\",\"topic\":\"major_modes\"}"
    },
    {
      "id": 496,
      "category": "scale",
      "difficulty": "hard",
      "config": "{\"type\":\"locrian\",\"topic\":\"major_modes\"}"
    }
  ];

// Deterministic key independent of JSON key ORDER (the raw config text
// column is not guaranteed to serialize keys in the same order across
// insertions, even for semantically identical exercises).
function fingerprint(category: string, difficulty: string, configJson: string): string {
  const config = JSON.parse(configJson) as Record<string, unknown>;
  const sortedConfig = Object.fromEntries(Object.entries(config).sort(([a], [b]) => a.localeCompare(b)));
  return `${category}|${difficulty}|${JSON.stringify(sortedConfig)}`;
}

async function main() {
  const apply = process.argv.includes("--apply");

  const devFingerprintById = new Map(KNOWN_EXERCISES.map((e) => [e.id, fingerprint(e.category, e.difficulty, e.config)]));

  // Ordered by id so that when duplicate (category, difficulty, config)
  // rows exist (a pre-existing data-hygiene wrinkle, not something this
  // script fixes), the lowest/original id is picked consistently rather
  // than an arbitrary one that could vary between runs.
  const targetExercises = await db.select().from(exercisesTable).orderBy(asc(exercisesTable.id));
  console.log(`Target database has ${targetExercises.length} exercises total.`);

  const targetIdsByFingerprint = new Map<string, number[]>();
  for (const ex of targetExercises) {
    const key = fingerprint(ex.category, ex.difficulty, ex.config);
    const list = targetIdsByFingerprint.get(key) ?? [];
    list.push(ex.id);
    targetIdsByFingerprint.set(key, list);
  }

  let lessonsResolvable = 0;
  let lessonsPartial = 0;
  let lessonsUnresolvable = 0;
  let totalRefs = 0;
  let totalResolved = 0;

  for (const lesson of KNOWN_LESSONS) {
    const newIds: number[] = [];
    const unresolvedDevIds: number[] = [];

    for (const devId of lesson.practiceExerciseIds) {
      totalRefs++;
      const fp = devFingerprintById.get(devId);
      const matches = fp ? targetIdsByFingerprint.get(fp) : undefined;
      if (matches && matches.length > 0) {
        newIds.push(matches[0]);
        totalResolved++;
      } else {
        unresolvedDevIds.push(devId);
      }
    }

    const status = newIds.length === lesson.practiceExerciseIds.length
      ? "full"
      : newIds.length > 0
      ? "partial"
      : "none";
    if (status === "full") lessonsResolvable++;
    else if (status === "partial") lessonsPartial++;
    else lessonsUnresolvable++;

    const label = `Lesson ${lesson.id} "${lesson.title}" [${lesson.practiceCategory}]`;
    if (status === "full") {
      console.log(`${label}: OK — all ${newIds.length} exercises resolved -> [${newIds.join(",")}]`);
    } else if (status === "partial") {
      console.log(`${label}: PARTIAL — ${newIds.length}/${lesson.practiceExerciseIds.length} resolved -> [${newIds.join(",")}] (unresolved dev ids: ${unresolvedDevIds.join(",")})`);
    } else {
      console.log(`${label}: UNRESOLVABLE — 0/${lesson.practiceExerciseIds.length} exercises exist in target db (dev ids: ${unresolvedDevIds.join(",")}) — left unchanged, practice button will stay hidden`);
    }

    if (apply && newIds.length > 0) {
      await db.update(lessonsTable).set({ practiceExerciseIds: JSON.stringify(newIds) }).where(eq(lessonsTable.id, lesson.id));
    }
  }

  console.log("");
  console.log(`${lessonsResolvable} lessons fully resolved, ${lessonsPartial} partially resolved, ${lessonsUnresolvable} unresolvable, out of ${KNOWN_LESSONS.length} total.`);
  console.log(`${totalResolved}/${totalRefs} individual exercise references resolved.`);
  console.log(apply ? "Applied — lessons.practice_exercise_ids updated in the database." : "Dry run only — nothing written. Re-run with --apply to write these changes.");

  await client.end();
}

main();

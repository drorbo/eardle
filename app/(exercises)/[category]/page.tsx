import { notFound } from "next/navigation";
import clsx from "clsx";
import { CATEGORY_META, CATEGORY_TOPICS, Category, Difficulty } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

interface Props {
  params: Promise<{ category: string }>;
}

const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   dot: "bg-green-400",  hover: "hover:bg-green-50  hover:border-green-300  dark:hover:bg-green-900/20  dark:hover:border-green-700/50" },
  { id: "medium", label: "Medium", dot: "bg-yellow-400", hover: "hover:bg-yellow-50 hover:border-yellow-300 dark:hover:bg-yellow-900/20 dark:hover:border-yellow-700/50" },
  { id: "hard",   label: "Hard",   dot: "bg-red-400",    hover: "hover:bg-red-50    hover:border-red-300    dark:hover:bg-red-900/20    dark:hover:border-red-700/50" },
  { id: "jazz",   label: "Jazz",   dot: "bg-amber-400",  hover: "hover:bg-amber-50  hover:border-amber-300  dark:hover:bg-amber-900/20  dark:hover:border-amber-700/50" },
];

const DIFF_DESC: Record<Category, Partial<Record<string, string>>> = {
  note: {
    easy:   "The 7 natural notes — C D E F G A B",
    medium: "The 7 natural notes, spread across 3 octaves",
    hard:   "All 12 notes — naturals and accidentals — across 3 octaves",
  },
  interval: {
    easy:   "Unison through perfect 5th — P1 to P5",
    medium: "Minor 6th through the octave — m6 to P8",
    hard:   "Compound intervals — 9ths and 10ths",
  },
  chord: {
    easy:   "Major & minor triads, root and 1st inversion",
    medium: "Dominant, major & minor 7ths, 2nd inversions",
    hard:   "Diminished, augmented, and all 7th chord inversions",
    jazz:   "Extended chords — 9ths, 11ths, 13ths and altered dominants",
  },
  progression: {
    easy:   "Classic pop & rock patterns — I-IV-V, I-V-vi-IV",
    medium: "Jazz ii-V-I, 50s progression, modal and diatonic patterns",
    hard:   "Borrowed chords, secondary dominants, chromatic steps",
    jazz:   "Tritone subs, rhythm changes, jazz blues, minor ii-V",
  },
  scale: {
    easy:   "Major, harmonic minor, and minor scale",
    medium: "Blues, pentatonic major, and 3 church modes",
    hard:   "All 7 church modes plus the blues scale",
    jazz:   "Melodic minor modes, whole tone, and diminished scales",
  },
};

const TOPIC_DESC: Record<Category, Record<string, string>> = {
  note: {
    natural:     "C D E F G A B — the white keys only",
    accidentals: "Sharps and flats — the black keys",
  },
  interval: {},
  chord: {
    major:       "Major triads and extensions (maj7, maj9, maj13, maj7♯11)",
    minor:       "Minor triads and extensions (min7, min9, min11, min-maj7)",
    dominant:    "Dominant 7th and unaltered extensions (9th, 13th, sus)",
    altered:     "Dominant 7th with chromatic tensions (♯9, ♭9, ♭13, ♯11)",
    suspended:   "Sus4 and sus9 — open, ambiguous sound",
    diminished:  "Diminished triad and fully diminished 7th",
    augmented:   "Augmented triad and augmented major 7th",
    inversions:  "Chords in non-root position — 1st, 2nd, and 3rd",
  },
  progression: {
    pop:      "I-IV-V, I-V-vi-IV, and other common radio-friendly patterns",
    diatonic: "All chords stay within the key — no borrowed notes",
    modal:    "Borrowed chords and chromatic movement (Mixolydian, etc.)",
    minor:    "Natural and harmonic minor key progressions",
    jazz:     "ii7-V7-Imaj7, tritone substitutions, rhythm changes",
    blues:    "12-bar blues structure",
  },
  scale: {
    major_modes:         "Ionian (major scale) through all 7 church modes",
    minor:               "Minor scale and harmonic minor",
    pentatonic_blues:    "5-note pentatonic + 6-note blues scale",
    melodic_minor_modes: "Lydian dominant, altered scale, Dorian ♭2, and more",
    jazz_symmetric:      "Whole tone and half/whole diminished scales",
  },
};

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!CATEGORY_META[category as Category]) notFound();

  const cat = category as Category;
  const meta = CATEGORY_META[cat];
  const topics = CATEGORY_TOPICS[cat];

  const [{ jazzCnt }] = await db
    .select({ jazzCnt: sql<number>`count(*)` })
    .from(exercisesTable)
    .where(and(eq(exercisesTable.category, cat), eq(exercisesTable.difficulty, "jazz" as Difficulty)));
  const hasJazz = jazzCnt > 0;

  const activeDifficulties = DIFFICULTIES.filter((d) => d.id !== "jazz" || hasJazz);
  const topicCols = topics.length > 4 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight">{meta.label}</h1>
          <p className="text-text-muted text-sm mt-0.5">{meta.description}</p>
        </div>
      </div>

      <div className={clsx("grid gap-8", topics.length > 0 ? "lg:grid-cols-2" : "max-w-sm")}>

        {/* ── By Difficulty ── */}
        <section>
          <p className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-3">
            By Difficulty
          </p>
          <div className="space-y-2">
            {activeDifficulties.map((d) => (
              <a
                key={d.id}
                href={`/${cat}/practice?difficulty=${d.id}`}
                className={clsx("flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border border-border-subtle transition group", d.hover)}
              >
                <span className={clsx("mt-[5px] flex-shrink-0 w-2 h-2 rounded-full", d.dot)} />
                <div>
                  <span className="font-semibold text-text text-sm">{d.label}</span>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {DIFF_DESC[cat][d.id]}
                  </p>
                </div>
              </a>
            ))}

            {cat !== "note" && (
              <a
                href={`/${cat}/practice?difficulty=all`}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800/40 dark:hover:bg-indigo-900/40 dark:hover:border-indigo-700/60 transition"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-sm">All Levels</span>
                  <span className="text-indigo-500 text-xs">shuffle everything</span>
                </div>
                <span className="text-indigo-600 text-sm">→</span>
              </a>
            )}

            <a
              href={`/${cat}/practice/custom`}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:border-violet-300 dark:bg-violet-950/60 dark:border-violet-800/40 dark:hover:bg-violet-900/40 dark:hover:border-violet-700/60 transition"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-violet-700 dark:text-violet-300 font-semibold text-sm">Custom Package</span>
                <span className="text-violet-500 text-xs">pick exactly which ones</span>
              </div>
              <span className="text-violet-600 text-sm">→</span>
            </a>
          </div>
        </section>

        {/* ── By Topic ── */}
        {topics.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-3">
              By Topic
            </p>
            <div className={clsx("grid gap-2", topicCols)}>
              {topics.map((t) => (
                <a
                  key={t.id}
                  href={`/${cat}/practice?topic=${t.id}`}
                  className={clsx("px-3 py-2.5 rounded-xl border border-white/10 transition", t.color)}
                >
                  <span className="font-semibold text-white text-sm block">{t.label}</span>
                  <span className="text-xs text-white/60 mt-0.5 block leading-relaxed">
                    {TOPIC_DESC[cat][t.id] ?? ""}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

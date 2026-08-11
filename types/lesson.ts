import type { Category, ChordType, ScaleType } from "@/types/exercise";
import type { VoicingId } from "@/lib/audio/theory";

// Closed set of content block types — the admin editor only ever produces
// blocks of these shapes, never freeform HTML/JSX (see docs/lessons-planning).
export interface TextBlock {
  type: "text";
  body: string;
}

export interface TipBlock {
  type: "tip";
  body: string;
}

export interface CommonMistakeBlock {
  type: "commonMistake";
  body: string;
}

export interface SummaryBlock {
  type: "summary";
  body: string;
}

// One playable example, built directly from lib/audio/theory.ts + played via
// lib/audio/engine.ts's audioEngine — no new audio code, just parameters.
export interface AudioExamplePlayable {
  kind: "note" | "interval" | "chord" | "scale" | "arpeggio" | "progression";
  root?: string; // e.g. "C4" — used by note/chord/scale/arpeggio
  noteA?: string; // interval
  noteB?: string; // interval
  intervalMode?: "harmonic" | "melodic";
  chordType?: ChordType;
  scaleType?: ScaleType;
  notes?: string[]; // arpeggio: explicit note list (wins over chordType-derived notes)
  inversion?: number; // arpeggio, ignored if notes is set
  voicing?: VoicingId; // arpeggio, ignored if notes is set; takes priority over inversion
  chords?: string[][]; // progression: chord-by-chord note lists
  chordRoots?: string[]; // progression: parallel to chords, enables degree coloring
  chordTypes?: ChordType[]; // progression: parallel to chords, enables degree coloring
  tempo?: number; // progression
}

export interface AudioExampleBlock {
  type: "audioExample";
  label: string;
  play: AudioExamplePlayable;
  // Optional second example for A/B comparison listening (the pedagogy
  // research flagged this as a high-value recurring pattern — e.g. major vs
  // minor, ascending vs descending).
  compareLabel?: string;
  comparePlay?: AudioExamplePlayable;
}

export type LessonBlock = TextBlock | TipBlock | CommonMistakeBlock | SummaryBlock | AudioExampleBlock;

export interface LessonSummary {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
  topicId: number;
  topicSlug: string;
  topicTitle: string;
  published: boolean;
  // Which topic this lesson assumes you've already covered — undefined only
  // for detail views that don't need it; used by the Learning Path view to
  // flag cross-topic jumps that aren't simply "the lesson right before this
  // one" (see components/lesson/LearningPathView.tsx).
  prerequisiteTopicId: number | null;
}

// A topic's nav category is derived from its lessons' practiceCategory (the
// first lesson that has one) — "fundamentals" for prerequisite-only topics
// with no direct practice link. No separate schema field: it falls out of
// data that already exists, so it can't drift out of sync.
export type NavCategoryId = Category | "fundamentals";

export interface TopicWithLessons {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  category: NavCategoryId;
  lessons: LessonSummary[];
}

// A lesson's linked "Practice what you've learned" package. A lesson can
// have several (e.g. "Thirds", "Fourths & Fifths", "All Naturals" as three
// separate packages) — `label` is shown as that package's button/card text;
// an empty label means "the lesson's only package," rendered as a single
// generic "Start Practicing" CTA rather than a named one.
export interface PracticePackage {
  label: string;
  category: Category;
  exerciseIds: number[];
}

export interface LessonDetail {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
  topicId: number;
  topicSlug: string;
  topicTitle: string;
  prerequisiteTopicId: number | null;
  prerequisiteTopicSlug: string | null;
  prerequisiteTopicTitle: string | null;
  practicePackages: PracticePackage[];
  body: LessonBlock[];
  published: boolean;
}

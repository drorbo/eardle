import type { Category, ChordType, ScaleType } from "@/types/exercise";

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
  notes?: string[]; // arpeggio: explicit note list
  chords?: string[][]; // progression: chord-by-chord note lists
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
}

export interface TopicWithLessons {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: LessonSummary[];
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
  practiceCategory: Category | null;
  practiceExerciseIds: number[] | null;
  body: LessonBlock[];
  published: boolean;
}

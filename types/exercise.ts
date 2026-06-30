import type { ChordType, ScaleType } from "@/lib/audio/theory";

export type { ChordType, ScaleType };
export type Category = "note" | "interval" | "chord" | "progression" | "scale";
export type Difficulty = "easy" | "medium" | "hard" | "jazz";
export type ChordFamily = "major" | "minor" | "dominant" | "altered" | "suspended" | "diminished";

export interface NoteConfig {
  note: string;
  topic?: string;
}

export type UiPlayMode = "harmonic" | "melodic-up" | "melodic-down" | "random";

export interface IntervalConfig {
  semitones: number;
  playMode: "harmonic" | "melodic";
  topic?: string;
}

export interface ChordConfig {
  type: ChordType;
  family?: ChordFamily;
  topic?: string;
  inversion?: number; // 0=root, 1=1st, 2=2nd, 3=3rd; undefined → existing exercise (voicings apply)
}

export interface ProgressionConfig {
  key: string;
  chords: string[][];
  romanNumerals: string[];
  tempo: number;
  topic?: string;
}

export interface ScaleConfig {
  type: ScaleType;
  topic?: string;
}

export type ExerciseConfig =
  | NoteConfig
  | IntervalConfig
  | ChordConfig
  | ProgressionConfig
  | ScaleConfig;

export interface Exercise {
  id: number;
  category: Category;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  config: ExerciseConfig;
  choices: string[];
  answer: string;
  createdAt: number;
  updatedAt: number;
}

export const CATEGORY_META: Record<Category, { label: string; description: string; emoji: string; color: string }> = {
  note:        { label: "Note ID",      description: "Identify individual pitches by ear",       emoji: "🎵", color: "indigo" },
  interval:    { label: "Intervals",    description: "Recognize the distance between two notes",  emoji: "🎼", color: "violet" },
  chord:       { label: "Chords",       description: "Identify chord qualities — major, minor…",  emoji: "🎹", color: "purple" },
  progression: { label: "Progressions", description: "Hear and name common chord progressions",   emoji: "🎸", color: "fuchsia" },
  scale:       { label: "Scales",       description: "Distinguish major, minor, modes and more",  emoji: "🎶", color: "pink" },
};

export interface TopicMeta {
  id: string;
  label: string;
  color: string;
}

export const CATEGORY_TOPICS: Record<Category, TopicMeta[]> = {
  note: [
    { id: "natural",     label: "Natural Notes", color: "bg-sky-700 hover:bg-sky-600" },
    { id: "accidentals", label: "Accidentals",   color: "bg-slate-600 hover:bg-slate-500" },
  ],
  interval: [], // organized purely by difficulty (easy=unison–5th, medium=–octave, hard=–decima)
  chord: [
    { id: "major",      label: "Major",      color: "bg-sky-700 hover:bg-sky-600" },
    { id: "minor",      label: "Minor",      color: "bg-violet-700 hover:bg-violet-600" },
    { id: "dominant",   label: "Dominant",   color: "bg-orange-700 hover:bg-orange-600" },
    { id: "altered",    label: "Altered",    color: "bg-rose-700 hover:bg-rose-600" },
    { id: "suspended",  label: "Suspended",  color: "bg-teal-700 hover:bg-teal-600" },
    { id: "diminished", label: "Diminished", color: "bg-slate-600 hover:bg-slate-500" },
    { id: "augmented",  label: "Augmented",  color: "bg-amber-700 hover:bg-amber-600" },
    { id: "inversions", label: "Inversions", color: "bg-indigo-700 hover:bg-indigo-600" },
  ],
  progression: [
    { id: "pop",      label: "Pop / Rock",        color: "bg-sky-700 hover:bg-sky-600" },
    { id: "diatonic", label: "Diatonic",           color: "bg-emerald-700 hover:bg-emerald-600" },
    { id: "minor",    label: "Minor Keys",         color: "bg-violet-700 hover:bg-violet-600" },
    { id: "modal",    label: "Modal / Chromatic",  color: "bg-rose-700 hover:bg-rose-600" },
    { id: "jazz",     label: "Jazz",               color: "bg-amber-700 hover:bg-amber-600" },
    { id: "blues",    label: "Blues",              color: "bg-blue-700 hover:bg-blue-600" },
  ],
  scale: [
    { id: "major_modes",         label: "Major Modes",         color: "bg-sky-700 hover:bg-sky-600" },
    { id: "minor",               label: "Minor",               color: "bg-violet-700 hover:bg-violet-600" },
    { id: "pentatonic_blues",    label: "Pentatonic & Blues",  color: "bg-orange-700 hover:bg-orange-600" },
    { id: "melodic_minor_modes", label: "Melodic Minor Modes", color: "bg-amber-700 hover:bg-amber-600" },
    { id: "jazz_symmetric",      label: "Symmetric Scales",    color: "bg-rose-700 hover:bg-rose-600" },
  ],
};

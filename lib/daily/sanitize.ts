import { Category, Difficulty, ExerciseConfig, ProgressionConfig } from "@/types/exercise";

export interface DailyExerciseSnapshot {
  id: number;
  category: Category;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  config: ExerciseConfig;
  choices: string[];
  answer: string;
  explanation: string | null;
}

/**
 * The anti-leak boundary. Two things must never reach the client before the
 * puzzle is solved/failed: `title` (for progression/chord/scale exercises this
 * directly is or trivially reveals the answer), and — for progressions only —
 * `config.romanNumerals`, which is effectively the same as the answer.
 * useAudio's progression branch only reads `config.chords`/`config.tempo`, so
 * stripping `romanNumerals` doesn't affect playback.
 */
export function toDailyPayload(snapshot: DailyExerciseSnapshot, revealed: boolean) {
  if (revealed) return snapshot;

  const { id, category, difficulty, prompt, choices, config } = snapshot;
  const safeConfig =
    category === "progression"
      ? (({ romanNumerals: _drop, ...rest }: ProgressionConfig) => rest)(config as ProgressionConfig)
      : config;

  return { id, category, difficulty, prompt, choices, config: safeConfig };
}

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import type { Category, Difficulty, ExerciseConfig } from "@/types/exercise";

// choice label -> the config that plays that label's sound
export type ChoiceVariants = Record<string, ExerciseConfig>;

export interface VariantRow {
  id: number;
  answer: string;
  difficulty: Difficulty;
  config: ExerciseConfig;
}

/**
 * Choices are plain label strings with no sound attached, so each label borrows
 * the config of an existing exercise whose answer equals it: same difficulty
 * first (so e.g. a chord's inversion/voicing family matches), else lowest id.
 */
export function pickVariants(
  choices: string[],
  rows: VariantRow[],
  difficulty: Difficulty,
  answer: string,
  ownConfig: ExerciseConfig
): ChoiceVariants {
  const out: ChoiceVariants = {};
  for (const label of choices) {
    if (label === answer) {
      out[label] = ownConfig;
      continue;
    }
    const matches = rows.filter((r) => r.answer === label).sort((a, b) => a.id - b.id);
    const best = matches.find((r) => r.difficulty === difficulty) ?? matches[0];
    if (best) {
      out[label] = best.config;
      continue;
    }
    // Some inversion sets list "X - Root Position" as a choice without ever having an exercise for it
    // (triads): derive it from the sibling "X - 1st Inversion" exercise with inversion forced to 0.
    const root = label.match(/^(.*) - Root Position$/);
    const sibling = root && rows.find((r) => r.answer === `${root[1]} - 1st Inversion`);
    if (sibling) out[label] = { ...sibling.config, inversion: 0 } as ExerciseConfig;
  }
  return out;
}

export async function getChoiceVariants(exercise: {
  category: Category;
  difficulty: Difficulty;
  choices: string[];
  answer: string;
  config: ExerciseConfig;
}): Promise<ChoiceVariants> {
  const rows = await db
    .select({ id: exercises.id, answer: exercises.answer, difficulty: exercises.difficulty, config: exercises.config })
    .from(exercises)
    .where(and(eq(exercises.category, exercise.category), inArray(exercises.answer, exercise.choices)));
  return pickVariants(
    exercise.choices,
    rows.map((r) => ({ ...r, config: JSON.parse(r.config) as ExerciseConfig })),
    exercise.difficulty,
    exercise.answer,
    exercise.config
  );
}

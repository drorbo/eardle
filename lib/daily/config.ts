import { Category, Difficulty } from "@/types/exercise";

// Single edit point for adding a category to the daily rotation later.
export const DAILY_ELIGIBLE_CATEGORIES: Category[] = ["chord", "progression", "scale"];

// Date#getUTCDay(): 0=Sunday … 6=Saturday.
export const DAILY_DIFFICULTY_BY_WEEKDAY: Record<number, Difficulty> = {
  1: "easy", // Mon
  2: "medium", // Tue
  3: "medium", // Wed
  4: "hard", // Thu
  5: "hard", // Fri
  6: "jazz", // Sat
  0: "jazz", // Sun
};

export const MAX_GUESSES = 5;

/** Today's puzzle date as a UTC calendar-day string, e.g. "2026-07-05". */
export function todaysPuzzleDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

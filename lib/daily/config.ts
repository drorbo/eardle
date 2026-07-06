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

export const DAILY_INFO_TEXT =
  "One shared puzzle every day — the same exercise for everyone. Difficulty ramps up through the week: Easy Monday, Medium Tue–Wed, Hard Thu–Fri, Jazz on weekends. Stuck on a category? Head to the practice exercises to sharpen up before the next one!";

export const DAILY_WON_LINES = [
  "Miles Davis would have been proud.",
  "John Coltrane is jealous.",
  "Bach appreciates what you did there.",
  "Mozart is taking notes.",
  "Beethoven heard that one loud and clear.",
  "Ella Fitzgerald just nodded in approval.",
  "Jimi Hendrix salutes your ear.",
  "Stevie Wonder didn't need to see that coming — but you heard it.",
];

export const DAILY_LOST_LINES = [
  "Even Beethoven went deaf eventually.",
  "Mozart wrote plenty of drafts too.",
  "Rome wasn't tuned in a day.",
  "Even Yo-Yo Ma has an off day.",
  "The Rolling Stones needed dozens of takes sometimes.",
  "Miles Davis missed a few notes in his time too — probably.",
];

// en-CA formats as YYYY-MM-DD — the standard trick for getting an ISO-shaped
// date string out of Intl.DateTimeFormat. Asia/Jerusalem correctly accounts
// for Israel's DST transitions (IST/IDT), unlike a fixed UTC+2/+3 offset.
const ISRAEL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" });

/** Today's puzzle date as a calendar-day string in Israel time, e.g. "2026-07-06". */
export function todaysPuzzleDateStr(): string {
  return ISRAEL_DATE_FORMATTER.format(new Date());
}

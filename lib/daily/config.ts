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
  "Chopin just added your name to his Liszt.",
  "Haydn nothing from you — that ear is sharp.",
  "Bach is adding another organ stop just for you.",
  "Tchaikovsky's clapping somewhere in 4/4 time.",
  "Handel would call that one Baroque — in the best way.",
  "Hendrix would set his guitar on fire for that one.",
  "Freddie Mercury just stood up and took a bow.",
  "Aretha Franklin says you've earned a little R-E-S-P-E-C-T.",
  "Prince is somewhere doing a little dance for you.",
  "Louis Armstrong just smiled that smile.",
  "Duke Ellington is swinging in approval.",
  "Björk just raised an eyebrow — impressed, not confused.",
  "Beyoncé would put a ring on that ear.",
  "Thelonious Monk tipped his hat, crooked as ever.",
  "Whitney Houston held that note a little longer for you.",
  "Bob Marley's one love just got a little louder.",
  "Adele's applauding, tissue in hand.",
  "Beethoven's Fifth just got a sixth movement — for you.",
  "Vivaldi says that was music to his ears, in any season.",
  "Ray Charles didn't need to see that coming — he heard it perfectly.",
];

export const DAILY_LOST_LINES = [
  "Even Beethoven went deaf eventually.",
  "Mozart wrote plenty of drafts too.",
  "Rome wasn't tuned in a day.",
  "Even Yo-Yo Ma has an off day.",
  "The Rolling Stones needed dozens of takes sometimes.",
  "Miles Davis missed a few notes in his time too — probably.",
  "Even Handel had his broke periods.",
  "Bach occasionally ran out of organ stops too.",
  "Haydn nothing — everyone misses a note sometimes.",
  "Chopin lost his Liszt once or twice too.",
  "Tchaikovsky needed a few tries to land his overtures.",
  "Even a Stradivarius drifts out of tune sometimes.",
  "Elvis left a few wrong notes in the building too.",
  "Freddie Mercury didn't nail every rehearsal either.",
  "Even Hendrix broke a string now and then.",
  "The Beatles needed dozens of takes for some of their biggest songs.",
  "Nina Simone had an off night once too, and it didn't stop her.",
  "Even Sinatra had an off night at the mic.",
  "Bob Dylan's harmonica has missed a cue or two.",
  "Whitney Houston cracked a note here and there — nobody's perfect.",
  "Vivaldi wrote four seasons — you've got plenty more rounds.",
  "Even perfect pitch lands flat sometimes.",
  "Mozart's rough drafts outnumbered his masterpieces.",
  "A chainsaw's easier to tune than this one — you'll get the next.",
  "Miles Davis said there are no mistakes, just happy accidents in disguise.",
  "Ella Fitzgerald scatted through plenty of wrong notes on the way to right ones.",
];

// en-CA formats as YYYY-MM-DD — the standard trick for getting an ISO-shaped
// date string out of Intl.DateTimeFormat. Asia/Jerusalem correctly accounts
// for Israel's DST transitions (IST/IDT), unlike a fixed UTC+2/+3 offset.
const ISRAEL_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" });

/** Today's puzzle date as a calendar-day string in Israel time, e.g. "2026-07-06". */
export function todaysPuzzleDateStr(): string {
  return ISRAEL_DATE_FORMATTER.format(new Date());
}

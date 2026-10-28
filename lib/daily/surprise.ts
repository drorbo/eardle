// A private surprise: the listed accounts always win the Daily Eardle on their first guess and get a flower and a heart.
// Remove an id (or this file and its three call sites) to switch it off.
export const SURPRISE_USER_IDS: readonly number[] = [7];

export const SURPRISE_MESSAGE = "Love you shushu";

export function isSurpriseUser(userId: number | null | undefined): boolean {
  return userId != null && SURPRISE_USER_IDS.includes(userId);
}

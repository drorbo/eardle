interface BuildShareTextArgs {
  date: string; // "YYYY-MM-DD"
  categoryEmoji: string;
  categoryLabel: string;
  difficulty: string;
  guesses: string[];
  answer: string;
  maxGuesses: number;
  status: "won" | "lost";
}

export function buildDailyShareText({
  date,
  categoryEmoji,
  categoryLabel,
  difficulty,
  guesses,
  answer,
  maxGuesses,
  status,
}: BuildShareTextArgs): string {
  const formattedDate = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const squares = guesses.map((g) => (g === answer ? "🟩" : "⬛")).join("");
  const score = status === "won" ? `${guesses.length}/${maxGuesses}` : `X/${maxGuesses}`;
  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return [
    `🎧 Eardle Daily — ${formattedDate}`,
    `${categoryEmoji} ${categoryLabel} · ${difficultyLabel} — ${score}`,
    squares,
    "https://eardle.com/daily",
  ].join("\n");
}

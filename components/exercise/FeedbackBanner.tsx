"use client";

interface FeedbackBannerProps {
  correct: boolean;
  correctAnswer: string;
  selected: string;
}

export function FeedbackBanner({ correct, correctAnswer, selected }: FeedbackBannerProps) {
  return (
    <div
      className={`
        w-full max-w-lg rounded-2xl p-5 text-center
        ${correct
          ? "bg-green-100 border border-green-400 dark:bg-green-900/50 dark:border-green-600"
          : "bg-red-100 border border-red-400 dark:bg-red-900/50 dark:border-red-600"}
      `}
    >
      {correct ? (
        <p className="text-green-700 dark:text-green-300 text-xl font-bold">Correct! 🎉</p>
      ) : (
        <>
          <p className="text-red-700 dark:text-red-300 text-xl font-bold mb-1">Not quite</p>
          <p className="text-text-secondary text-sm">
            You answered <span className="font-semibold text-text">{selected}</span>
            {" — "}the correct answer is{" "}
            <span className="font-semibold text-green-700 dark:text-green-300">{correctAnswer}</span>
          </p>
        </>
      )}
    </div>
  );
}

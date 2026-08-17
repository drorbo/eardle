"use client";

import clsx from "clsx";

const FLAT_EQUIVALENT: Record<string, string> = {
  "C#": "C# / D♭",
  "D#": "D# / E♭",
  "F#": "F# / G♭",
  "G#": "G# / A♭",
  "A#": "A# / B♭",
};

function displayLabel(choice: string): string {
  return FLAT_EQUIVALENT[choice] ?? choice;
}

interface ChoiceGridProps {
  choices: string[];
  selected?: string;
  answer?: string;
  // Choices already guessed wrong this run (Daily EarDle multi-guess flow). Only
  // meaningful while `answer` is NOT yet passed — this path never reads `answer`,
  // so a wrong guess can never accidentally reveal the correct one early.
  triedWrong?: string[];
  disabled: boolean;
  onSelect: (choice: string) => void;
  cols?: 2 | 3 | 4;
}

export function ChoiceGrid({ choices, selected, answer, triedWrong, disabled, onSelect, cols = 2 }: ChoiceGridProps) {
  function getStyle(choice: string) {
    // Correct answer always wins, even if it happens to also be in `triedWrong`
    // (can't actually happen, but keeps priority unambiguous).
    if (answer && choice === answer) {
      return "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/60 dark:text-green-200";
    }
    if (triedWrong?.includes(choice)) {
      return answer
        ? "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/60 dark:text-red-200" // revealed: show every wrong guess made
        : "bg-surface-2/60 border-border text-text-faint line-through"; // still in progress: just "tried"
    }
    if (!selected) {
      return "bg-surface-2 border-border hover:border-indigo-500 hover:bg-surface text-text";
    }
    if (choice === answer) {
      return "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/60 dark:text-green-200";
    }
    if (choice === selected && choice !== answer) {
      return "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/60 dark:text-red-200";
    }
    return "bg-surface-2 border-border text-text-subtle";
  }

  // 4-col grids drop to 3 cols on mobile for better tap targets
  const gridClass = cols === 4 ? "grid-cols-3 sm:grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
  const textAlign = cols >= 3 ? "text-center" : "text-left";

  return (
    <div className={clsx("grid gap-2 w-full max-w-lg", gridClass)}>
      {choices.map((choice, i) => {
        const isTriedWrong = !answer && !!triedWrong?.includes(choice);
        return (
        <button
          key={choice}
          onClick={() => !disabled && !isTriedWrong && onSelect(choice)}
          disabled={disabled || isTriedWrong}
          aria-label={`Choice ${i + 1}: ${displayLabel(choice)}`}
          className={clsx(
            "relative px-3 py-3 sm:py-2 rounded-lg border text-sm font-medium",
            "transition-all duration-150 active:scale-[0.97]",
            "disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400",
            "min-h-[44px]",
            textAlign,
            getStyle(choice)
          )}
        >
          {i < 9 && (
            <span className="hidden sm:inline text-xs font-bold opacity-40 mr-1">{i + 1}</span>
          )}
          {displayLabel(choice)}
        </button>
        );
      })}
    </div>
  );
}

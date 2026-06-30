"use client";

interface ChoiceGridProps {
  choices: string[];
  selected?: string;
  answer?: string;
  disabled: boolean;
  onSelect: (choice: string) => void;
  cols?: 2 | 3 | 4;
}

export function ChoiceGrid({ choices, selected, answer, disabled, onSelect, cols = 2 }: ChoiceGridProps) {
  function getStyle(choice: string) {
    if (!selected) {
      return "bg-gray-800 border-gray-700 hover:border-indigo-500 hover:bg-gray-750 text-white";
    }
    if (choice === answer) {
      return "bg-green-900/60 border-green-500 text-green-200";
    }
    if (choice === selected && choice !== answer) {
      return "bg-red-900/60 border-red-500 text-red-200";
    }
    return "bg-gray-800 border-gray-700 text-gray-500";
  }

  // 4-col grids drop to 3 cols on mobile for better tap targets
  const gridClass =
    cols === 4 ? "grid-cols-3 sm:grid-cols-4" :
    cols === 3 ? "grid-cols-3" :
                 "grid-cols-2";
  const textAlign = cols >= 3 ? "text-center" : "text-left";

  return (
    <div className={`grid ${gridClass} gap-2 w-full max-w-lg`}>
      {choices.map((choice, i) => (
        <button
          key={choice}
          onClick={() => !disabled && onSelect(choice)}
          disabled={disabled}
          aria-label={`Choice ${i + 1}: ${choice}`}
          className={`
            relative px-3 py-3 sm:py-2 rounded-lg border text-sm font-medium
            transition-all duration-150 active:scale-[0.97]
            disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400
            min-h-[44px]
            ${textAlign} ${getStyle(choice)}
          `}
        >
          {i < 9 && (
            <span className="hidden sm:inline text-xs font-bold opacity-40 mr-1">{i + 1}</span>
          )}
          {choice}
        </button>
      ))}
    </div>
  );
}

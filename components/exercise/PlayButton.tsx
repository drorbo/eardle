"use client";

interface PlayButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PlayButton({ onClick, isPlaying, isLoading, disabled }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isLoading ? "Loading sound…" : isPlaying ? "Playing…" : "Play audio"}
      className="
        relative flex items-center justify-center
        w-24 h-24 sm:w-28 sm:h-28
        rounded-full
        bg-indigo-600 hover:bg-indigo-500 active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-150 shadow-lg shadow-indigo-900/40
        focus:outline-none focus:ring-4 focus:ring-indigo-400
      "
    >
      {isLoading ? (
        <svg className="w-9 h-9 text-white animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : isPlaying ? (
        <span className="flex gap-1 items-end h-6">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-1.5 bg-white rounded-full animate-bounce"
              style={{ height: `${12 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white ml-1">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}

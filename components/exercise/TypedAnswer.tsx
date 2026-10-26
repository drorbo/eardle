"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { resolveAnswer } from "@/lib/answers/normalize";
import type { Category } from "@/types/exercise";

const EXAMPLE: Record<Category, string> = {
  note: "C#",
  interval: "m3",
  chord: "Cmaj7",
  progression: "ii V I",
  scale: "Dorian",
};

interface TypedAnswerProps {
  category: Category;
  vocabulary: string[];
  // Locked until the sound has been played once (same rule as the answer buttons).
  disabled: boolean;
  // True when the input should grab focus (sound just finished, on devices with a real keyboard).
  focusWhenReady: boolean;
  onSubmit: (label: string) => void;
}

export function TypedAnswer({ category, vocabulary, disabled, focusWhenReady, onSubmit }: TypedAnswerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resolution = useMemo(() => resolveAnswer(category, text, vocabulary), [category, text, vocabulary]);

  useEffect(() => {
    if (focusWhenReady) inputRef.current?.focus();
  }, [focusWhenReady]);

  const canSubmit = !disabled && resolution.kind !== "none";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Enter on unrecognized text does nothing: it is never counted as a wrong answer.
    if (!disabled && resolution.kind !== "none") onSubmit(resolution.label);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-lg flex flex-col gap-2">
      {/* Above the input (not below) so the on-screen keyboard never hides it; height is reserved so nothing jumps. */}
      <div id="typed-answer-chip" aria-live="polite" className="min-h-[28px] text-sm">
        {text.trim() && resolution.kind === "match" && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200">
            <span aria-hidden="true">→</span> {resolution.label} <span aria-hidden="true">✓</span>
          </span>
        )}
        {text.trim() && resolution.kind === "suggest" && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
            Did you mean <strong>{resolution.label}</strong>? Press Enter
          </span>
        )}
        {text.trim() && resolution.kind === "none" && (
          <span className="text-text-subtle">Not sure what that is — try e.g. “{EXAMPLE[category]}”</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Play the sound first…" : "Type your answer…"}
          aria-label="Type your answer"
          aria-describedby="typed-answer-chip"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          className={clsx(
            "min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-4 py-3 min-h-[48px]",
            "text-base text-text placeholder:text-text-faint",
            "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="shrink-0 px-5 min-h-[48px] rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>

    </form>
  );
}

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

// Category-specific cheat sheet shown behind the "?" button: [what to type, what it means]
const HELP: Record<Category, Array<[string, string]>> = {
  note: [["c, C#, db, e flat, g sharp", "flats and sharps both work"]],
  interval: [
    ["m3, M3, P4, P5, P8", "m = minor, M = major, P = perfect"],
    ["b3, b7, b9, #4, tt", "flat/sharp shorthand, tt = tritone"],
    ["minor third, perfect fifth", "full names work too"],
  ],
  chord: [
    ["maj7, M7, Δ7, m7, -7, 7, dim, ø, aug", "M = major, m = minor"],
    ["Cmaj7, Bb7, Dm7", "a root note in front is ignored"],
    ["b9, #9b13, 7b9, 9#11, sus4, 6/9", "a lone b or # in front means a 7 chord: b9 = 7♭9"],
    ["dom7 1st inv, 7 inv2, maj7 root", "inversions: 1st / 2nd / 3rd, or 1 / 2 / 3"],
    ["7/3, m7/b3, G7/B, C/E", "slash chords: the bass note picks the inversion"],
  ],
  progression: [
    ["ii V I, ii-V-I, ii > V > I", "any separator works"],
    ["I IV V, i iv v", "upper/lower case is forgiven when only one progression fits"],
    ["bVI, ♭VII, Imaj7, IM7, iim7b5", "flats and chord extensions as shown on the buttons"],
  ],
  scale: [
    ["dorian, D dorian, lydian b7", "a root note in front is ignored"],
    ["ionian, aeolian, natural minor", "mode names and other common names"],
    ["whole tone, half whole, super locrian", "spaces and dashes don't matter"],
  ],
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
  const [helpOpen, setHelpOpen] = useState(false);
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
    <form
      onSubmit={submit}
      onKeyDown={(e) => { if (e.key === "Escape" && helpOpen) setHelpOpen(false); }}
      className="w-full max-w-lg flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
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
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          aria-expanded={helpOpen}
          aria-controls="typed-answer-help"
          aria-label="How typing answers works"
          className={clsx(
            "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border text-sm font-semibold transition",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
            helpOpen ? "bg-indigo-600 border-indigo-600 text-white" : "border-border bg-surface-2 text-text-subtle hover:text-text"
          )}
        >
          ?
        </button>
      </div>
      {helpOpen && (
        <div id="typed-answer-help" className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-text flex flex-col gap-2">
          <p className="font-semibold">Type it your way — it understands shorthand</p>
          <ul className="flex flex-col gap-1.5">
            {HELP[category].map(([typed, note]) => (
              <li key={typed}>
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px]">{typed}</code>
                <span className="block text-text-subtle">{note}</span>
              </li>
            ))}
          </ul>
          <p className="text-text-subtle">
            The green chip shows what it understood. A small typo gets “Did you mean…?” — press Enter to accept.
            Anything it can’t read is never counted as a wrong answer.
          </p>
        </div>
      )}
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

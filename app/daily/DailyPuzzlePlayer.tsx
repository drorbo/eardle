"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDailyPuzzle } from "@/hooks/useDailyPuzzle";
import { useAudio } from "@/hooks/useAudio";
import { PlayButton } from "@/components/exercise/PlayButton";
import { ChoiceGrid } from "@/components/exercise/ChoiceGrid";
import { ChordStaff } from "@/components/exercise/ChordStaff";
import { ScaleStaff } from "@/components/exercise/ScaleStaff";
import { ProgressionStaff } from "@/components/exercise/ProgressionStaff";
import { StatsModal } from "@/components/daily/StatsModal";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { addSemitones } from "@/lib/audio/theory";
import { audioEngine } from "@/lib/audio/engine";
import { DAILY_INFO_TEXT, DAILY_WON_LINES, DAILY_LOST_LINES } from "@/lib/daily/config";
import { buildDailyShareText } from "@/lib/daily/share";
import { CATEGORY_META } from "@/types/exercise";
import type { Exercise, ProgressionConfig } from "@/types/exercise";

export function DailyPuzzlePlayer() {
  const { state, submitGuess, sessionToken } = useDailyPuzzle();
  const { play, isPlaying, playedNotes } = useAudio();
  const [statsOpen, setStatsOpen] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    audioEngine?.warm();
  }, []);

  useEffect(() => {
    if (state.phase !== "ready") return;
    const prevStatus = prevStatusRef.current;
    const wasPlayable = prevStatus === "in_progress" || prevStatus === "not_started";
    const finishedNow = state.status === "won" || state.status === "lost";
    // Covers two cases: (1) the user just finished this guess, transitioning
    // from playable to won/lost, and (2) the puzzle was already solved on a
    // previous visit, so it loads pre-finished (prevStatus still null here,
    // this is the first "ready" render) — either way, open stats on load.
    if (finishedNow && (wasPlayable || prevStatus === null)) {
      setStatsOpen(true);
    }
    if (wasPlayable && finishedNow) {
      // Navbar's streak badge is a persistent layout component that only
      // fetches on mount/navigation — this lets it update immediately even
      // if the user stays on this page after finishing.
      window.dispatchEvent(new Event("eardle:daily-completed"));
    }
    prevStatusRef.current = state.status;
  }, [state]);

  // Picked once per completed status (not on every render/guess) so it doesn't
  // shuffle underneath the user while they're looking at it.
  const status = state.phase === "ready" ? state.status : null;
  const funnyLine = useMemo(() => {
    if (status !== "won" && status !== "lost") return null;
    const pool = status === "won" ? DAILY_WON_LINES : DAILY_LOST_LINES;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [status]);

  const shareText = useMemo(() => {
    if (state.phase !== "ready") return null;
    if (state.status !== "won" && state.status !== "lost") return null;
    const meta = CATEGORY_META[state.category];
    return buildDailyShareText({
      date: state.date,
      categoryEmoji: meta.emoji,
      categoryLabel: meta.label,
      difficulty: state.difficulty,
      guesses: state.guesses,
      answer: state.exercise.answer ?? "",
      maxGuesses: state.maxGuesses,
      status: state.status,
    });
  }, [state]);

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-surface-2" />
        <div className="w-24 h-24 rounded-full bg-surface-2" />
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="text-center">
        <p className="text-text-muted">{state.message}</p>
      </div>
    );
  }

  const meta = CATEGORY_META[state.category];
  const finished = state.status === "won" || state.status === "lost";
  const guessNumber = Math.min(state.guesses.length + 1, state.maxGuesses);

  function handlePlay() {
    if (state.phase !== "ready") return;
    // The sanitized daily payload only has the fields useAudio actually reads
    // (id/category/difficulty/config) — cast is safe, title/answer/choices/
    // timestamps aren't touched by playback.
    play(state.exercise as unknown as Exercise, undefined, 3, state.performanceParams);
  }

  const cols = state.category === "chord" || state.category === "scale" ? 3 : 2;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-subtle uppercase tracking-widest mb-1">
          Daily EarDle
          <InfoTooltip text={DAILY_INFO_TEXT} />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
          <span>{meta.emoji} {meta.label}</span>
          <span className="text-text-faint">·</span>
          <span className="capitalize">{state.difficulty}</span>
        </div>
      </div>

      <p className="text-lg text-text text-center">{state.exercise.prompt}</p>

      {/* Confetti lives in StatsModal instead — that modal auto-opens the instant
          the puzzle finishes, immediately covering anything rendered here. */}
      <PlayButton onClick={handlePlay} isPlaying={isPlaying} disabled={state.submitting} />

      {!finished && (
        <p className="text-sm text-text-subtle">
          Guess {guessNumber} of {state.maxGuesses}
        </p>
      )}

      <ChoiceGrid
        choices={state.exercise.choices}
        answer={finished ? state.exercise.answer : undefined}
        triedWrong={state.guesses}
        disabled={finished || state.submitting}
        onSelect={submitGuess}
        cols={cols}
      />

      {finished && (
        <div className="text-center space-y-3">
          {state.status === "won" ? (
            <p className="text-green-600 dark:text-green-400 font-bold text-lg">🎉 Solved in {state.guesses.length}!</p>
          ) : (
            <p className="text-red-600 dark:text-red-400 font-bold text-lg">
              Out of guesses — it was <span className="text-text">{state.exercise.answer}</span>
            </p>
          )}
          {funnyLine && <p className="text-text-muted text-sm italic">{funnyLine}</p>}
          {state.exercise.title && <p className="text-text-subtle text-sm">{state.exercise.title}</p>}
          {state.exercise.explanation && (
            <div className="w-full max-w-lg mx-auto rounded-2xl p-4 bg-surface/60 border border-border-subtle text-sm text-text-secondary leading-relaxed text-left">
              <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-1.5">💡 Good to know</p>
              {state.exercise.explanation}
            </div>
          )}
          <button
            onClick={() => setStatsOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
          >
            View Statistics
          </button>

          {/* Notes only appear once you've actually pressed Play at least once this
              visit — matches how the regular exercise player reveals notation.
              White background matches ExercisePlayer.tsx — vexflow renders dark
              strokes with no background of its own, invisible on the dark theme. */}
          {state.category === "chord" && playedNotes && (
            <div className="w-full bg-white rounded-xl p-3">
              <ChordStaff notes={playedNotes} />
            </div>
          )}
          {state.category === "scale" && playedNotes && (
            <div className="w-full bg-white rounded-xl p-3">
              <ScaleStaff notes={playedNotes} />
            </div>
          )}
          {state.category === "progression" && (
            <div className="w-full bg-white rounded-xl p-3">
              <ProgressionStaff
                chords={(state.exercise.config as unknown as ProgressionConfig).chords.map((chord) =>
                  chord.map((n) => addSemitones(n, state.performanceParams.delta ?? 0))
                )}
              />
            </div>
          )}
        </div>
      )}

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        sessionToken={sessionToken}
        todaysResult={finished ? { status: state.status as "won" | "lost", finalGuessCount: state.guesses.length } : undefined}
        funnyLine={funnyLine}
        shareText={shareText}
      />
    </div>
  );
}

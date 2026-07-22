"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Exercise, IntervalConfig, UiPlayMode, ChordPlayMode } from "@/types/exercise";
import { useAudio } from "@/hooks/useAudio";
import { useExercise } from "@/hooks/useExercise";
import { PlayButton } from "./PlayButton";
import { ChoiceGrid } from "./ChoiceGrid";
import { FeedbackBanner } from "./FeedbackBanner";
import { ChordStaff } from "./ChordStaff";
import { IntervalStaff } from "./IntervalStaff";
import { ScaleStaff } from "./ScaleStaff";
import { ConfettiBurst } from "@/components/daily/ConfettiBurst";

interface ExercisePlayerProps {
  exercise: Exercise;
  nextHref?: string;
  sessionToken: string;
  onAnswered?: (correct: boolean) => void;
  initialStreak?: number;
}

const PLAY_MODES: Array<{ id: UiPlayMode; label: string; icon: string }> = [
  { id: "harmonic",     label: "Harmonic",     icon: "≡" },
  { id: "melodic-up",   label: "Melodic Up",   icon: "↑" },
  { id: "melodic-down", label: "Melodic Down", icon: "↓" },
  { id: "random",       label: "Random",       icon: "?" },
];

const SPEED_LEVELS: Array<{ level: number; label: string; icon: string }> = [
  { level: 1, label: "Very Slow", icon: "1" },
  { level: 2, label: "Slow",      icon: "2" },
  { level: 3, label: "Normal",    icon: "3" },
  { level: 4, label: "Fast",      icon: "4" },
  { level: 5, label: "Very Fast", icon: "5" },
];

export function ExercisePlayer({ exercise, nextHref, sessionToken, onAnswered, initialStreak = 0 }: ExercisePlayerProps) {
  const { play, stop, isPlaying, isLoadingSamples, playedNotes, lastPlayedMode, instrument, setInstrument } = useAudio();
  const { state, onPlay, onAudioDone, onSelect, onReset } = useExercise(exercise);
  const prevIdRef = useRef(exercise.id);
  const router = useRouter();
  const [currentStreak, setCurrentStreak] = useState(initialStreak);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // ExercisePlayer's component instance persists across exercise navigation
  // (Wrapper re-fetches per exercise.id, doesn't remount this component), so
  // this keeps the displayed streak in sync with each freshly-fetched value.
  useEffect(() => {
    setCurrentStreak(initialStreak);
  }, [initialStreak]);

  const [uiPlayMode, setUiPlayMode] = useState<UiPlayMode>(() => {
    if (exercise.category !== "interval") return "harmonic";
    try {
      const saved = localStorage.getItem("eardle-interval-play-mode") as UiPlayMode | null;
      const valid: UiPlayMode[] = ["harmonic", "melodic-up", "melodic-down", "random"];
      if (saved && valid.includes(saved)) return saved;
    } catch {
      // localStorage unavailable (SSR)
    }
    const db = (exercise.config as IntervalConfig).playMode;
    return db === "melodic" ? "melodic-up" : db as UiPlayMode;
  });

  const hasSpeedControl = exercise.category === "scale" || exercise.category === "progression";

  const [speedLevel, setSpeedLevel] = useState<number>(() => {
    if (!hasSpeedControl) return 3;
    try {
      const saved = parseInt(localStorage.getItem("eardle-speed-level") ?? "3", 10);
      if (saved >= 1 && saved <= 5) return saved;
    } catch { /* SSR */ }
    return 3;
  });

  const handlePlay = useCallback(async (chordMode: ChordPlayMode = "harmonic") => {
    // Deliberately allowed to fire again mid-playback — play() stops and
    // restarts from the beginning rather than being a no-op.
    if (state.phase !== "answered") onPlay();
    await play(exercise, uiPlayMode, speedLevel, undefined, chordMode);
  }, [state.phase, onPlay, play, exercise, uiPlayMode, speedLevel]);

  const handleSelect = useCallback(
    async (choice: string) => {
      const correct = choice === exercise.answer;
      onSelect(choice);
      onAnswered?.(correct);
      setIsNewRecord(false);
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken, exerciseId: exercise.id, answered: choice, correct }),
        });
        const data = await res.json();
        if (typeof data.currentStreak === "number") setCurrentStreak(data.currentStreak);
        if (data.isNewRecord) setIsNewRecord(true);
      } catch {
        // Non-critical — the streak display just won't update for this answer.
      }
    },
    [exercise.answer, exercise.id, onSelect, onAnswered, sessionToken]
  );

  // Reset when exercise changes
  useEffect(() => {
    if (prevIdRef.current !== exercise.id) {
      stop();
      onReset();
      setIsNewRecord(false);
      prevIdRef.current = exercise.id;
    }
  }, [exercise.id, stop, onReset]);

  // When isPlaying transitions false → trigger AUDIO_DONE if we were in playing phase
  useEffect(() => {
    if (!isPlaying && state.phase === "playing") {
      onAudioDone();
    }
  }, [isPlaying, state.phase, onAudioDone]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handlePlay();
      }
      if ((e.code === "Enter" || e.key === "n") && state.phase === "answered" && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= exercise.choices.length && (state.phase === "ready" || state.phase === "playing")) {
        handleSelect(exercise.choices[num - 1]);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase, handlePlay, handleSelect, exercise.choices, nextHref, router]);

  const isAnswered = state.phase === "answered";
  const choicesDisabled = state.phase === "idle";

  // Shared control buttons renderer
  function IntervalControls({ className }: { className?: string }) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {PLAY_MODES.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setUiPlayMode(id); localStorage.setItem("eardle-interval-play-mode", id); }}
            title={label}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
              uiPlayMode === id
                ? "bg-violet-600 text-white"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  }

  function SpeedControls({ className }: { className?: string }) {
    return (
      <div className={`flex gap-1 ${className}`}>
        {SPEED_LEVELS.map(({ level, label, icon }) => (
          <button
            key={level}
            onClick={() => { setSpeedLevel(level); localStorage.setItem("eardle-speed-level", String(level)); }}
            title={label}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
              speedLevel === level
                ? "bg-violet-600 text-white"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    );
  }

  const controlPanel = (
    <div className="flex gap-1 flex-col bg-surface/80 border border-border-subtle rounded-xl p-1.5 backdrop-blur-sm">
      {exercise.category === "interval"
        ? PLAY_MODES.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setUiPlayMode(id); localStorage.setItem("eardle-interval-play-mode", id); }}
              title={label}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                uiPlayMode === id
                  ? "bg-violet-600 text-white"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              {icon}
            </button>
          ))
        : SPEED_LEVELS.map(({ level, label, icon }) => (
            <button
              key={level}
              onClick={() => { setSpeedLevel(level); localStorage.setItem("eardle-speed-level", String(level)); }}
              title={label}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                speedLevel === level
                  ? "bg-violet-600 text-white"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              {icon}
            </button>
          ))
      }
    </div>
  );

  const hasControls = exercise.category === "interval" || hasSpeedControl;

  return (
    <div className="relative w-full">
      {isNewRecord && <ConfettiBurst />}

      {/* Floating Next button — fixed below navbar, always reachable without scrolling */}
      {isAnswered && nextHref && (
        <Link
          href={nextHref}
          className="fixed top-[7rem] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-900/40 transition"
        >
          Next Exercise →
          <span className="hidden sm:inline text-xs opacity-60 font-normal">Enter / N</span>
        </Link>
      )}

      <div className="flex flex-col items-center gap-5 sm:gap-8 w-full max-w-xl mx-auto">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            currentStreak > 0
              ? "bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900"
              : "bg-surface/60 text-text-subtle border border-border-subtle"
          }`}
        >
          🔥 Streak: {currentStreak}
        </div>

        <div className="text-center">
          <p className="text-text-muted text-sm uppercase tracking-widest mb-2">
            {state.phase === "idle"
              ? "Listening…"
              : state.phase === "answered"
              ? ""
              : "What do you hear?"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text">{exercise.prompt}</h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {exercise.category === "chord" && (
            <button
              onClick={() => handlePlay("bass")}
              title="Play bass note only"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg text-lg font-bold text-text-muted bg-surface/80 border border-border-subtle hover:text-text hover:bg-surface-2 active:scale-95 transition"
            >
              𝄢
            </button>
          )}
          <PlayButton onClick={() => handlePlay()} isPlaying={isPlaying} isLoading={isLoadingSamples} />
          {exercise.category === "chord" && (
            <button
              onClick={() => handlePlay("arpeggio")}
              title="Play as arpeggio"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg text-lg font-bold text-text-muted bg-surface/80 border border-border-subtle hover:text-text hover:bg-surface-2 active:scale-95 transition"
            >
              ∿
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-surface/80 border border-border-subtle rounded-xl p-1" role="group" aria-label="Sound">
          <button
            onClick={() => setInstrument("piano")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              instrument === "piano" ? "bg-violet-600 text-white" : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            🎹 Piano
          </button>
          <button
            onClick={() => setInstrument("synth")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              instrument === "synth" ? "bg-violet-600 text-white" : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
          >
            ⚡ Synth
          </button>
        </div>

        {/* Mobile controls: horizontal strip between play button and choices */}
        {hasControls && (
          <div className="sm:hidden flex items-center gap-1 bg-surface/80 border border-border-subtle rounded-xl p-1.5">
            {exercise.category === "interval"
              ? <IntervalControls />
              : <SpeedControls />
            }
          </div>
        )}

        <ChoiceGrid
          choices={exercise.choices}
          selected={isAnswered ? state.selected : undefined}
          answer={isAnswered ? exercise.answer : undefined}
          disabled={choicesDisabled}
          onSelect={handleSelect}
          cols={
            exercise.category === "note" ? 4 :
            exercise.category === "interval" ? 3 :
            exercise.category === "chord" ? 3 :
            exercise.category === "scale" ? 3 :
            2
          }
        />

        {isAnswered && (
          <FeedbackBanner
            correct={state.correct}
            correctAnswer={exercise.answer}
            selected={state.selected}
          />
        )}

        {isNewRecord && (
          <p className="text-orange-400 font-bold text-sm">🎉 New personal best streak!</p>
        )}

        {isAnswered && exercise.explanation && (
          <div className="w-full max-w-lg rounded-2xl p-4 bg-surface/60 border border-border-subtle text-sm text-text-secondary leading-relaxed">
            <p className="text-xs font-semibold text-text-subtle uppercase tracking-wider mb-1.5">💡 Good to know</p>
            {exercise.explanation}
          </div>
        )}

        {isAnswered && exercise.category === "chord" && playedNotes && (
          <div className="w-full bg-white rounded-xl p-3">
            <ChordStaff notes={playedNotes} />
          </div>
        )}

        {isAnswered && exercise.category === "scale" && playedNotes && (
          <div className="w-full bg-white rounded-xl p-3">
            <ScaleStaff notes={playedNotes} />
          </div>
        )}

        {isAnswered && exercise.category === "interval" && playedNotes?.length === 2 && (
          <div className="w-full bg-white rounded-xl p-3">
            <IntervalStaff
              notes={playedNotes as [string, string]}
              playMode={lastPlayedMode}
            />
          </div>
        )}

        {isAnswered && nextHref && (
          <Link
            href={nextHref}
            className="mt-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition"
          >
            Next Exercise →
            <span className="hidden sm:inline ml-2 text-xs opacity-60 font-normal">Enter / N</span>
          </Link>
        )}
      </div>

      {/* Desktop controls: absolute right panel */}
      {hasControls && (
        <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2">
          {controlPanel}
        </div>
      )}
    </div>
  );
}

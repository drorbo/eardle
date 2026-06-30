"use client";

import { useEffect, useRef, useState } from "react";
import { Exercise } from "@/types/exercise";
import { ExercisePlayer } from "@/components/exercise/ExercisePlayer";

interface Props {
  exercise: Exercise;
  nextHref?: string;
}

const C_MAJOR_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const ALL_ACCIDENTALS = ["C#", "D#", "F#", "G#", "A#"];
const CHROMATIC_ORDER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getOrCreateSessionToken(): string {
  const key = "eardle_session";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    try { localStorage.setItem(key, fresh); } catch { /* quota exceeded */ }
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSessionAccidentals(): string[] {
  const key = "eardle_note_accidentals";
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    const picked = [...ALL_ACCIDENTALS].sort(() => Math.random() - 0.5).slice(0, 3);
    try { localStorage.setItem(key, JSON.stringify(picked)); } catch { /* ignore */ }
    return picked;
  } catch {
    return [...ALL_ACCIDENTALS].sort(() => Math.random() - 0.5).slice(0, 3);
  }
}

function resolveChoices(exercise: Exercise): string[] {
  if (exercise.category === "note" || exercise.category === "interval") {
    if (exercise.category === "note" && exercise.difficulty === "medium") {
      const accidentals = getSessionAccidentals();
      return CHROMATIC_ORDER.filter((n) => C_MAJOR_NOTES.includes(n) || accidentals.includes(n));
    }
    return exercise.choices;
  }
  return shuffle(exercise.choices);
}

export function ExercisePlayerWrapper({ exercise, nextHref }: Props) {
  const [sessionToken, setSessionToken] = useState("");
  const [resolvedExercise, setResolvedExercise] = useState<Exercise>(exercise);
  const answeredRef = useRef(false);

  useEffect(() => {
    setSessionToken(getOrCreateSessionToken());
    try {
      setResolvedExercise({ ...exercise, choices: resolveChoices(exercise) });
    } catch { /* keep original choices */ }
    answeredRef.current = false;
  }, [exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAnswered(correct: boolean) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    try { localStorage.setItem(`eardle_result_${exercise.id}`, correct ? "correct" : "wrong"); } catch { /* ignore */ }
  }

  if (!sessionToken) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-gray-800" />
        <div className="w-24 h-24 rounded-full bg-gray-800" />
        <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
          {[...Array(4)].map((_, i) => <div key={i} className="h-11 rounded-lg bg-gray-800" />)}
        </div>
      </div>
    );
  }

  return (
    <ExercisePlayer
      exercise={resolvedExercise}
      nextHref={nextHref}
      sessionToken={sessionToken}
      onAnswered={handleAnswered}
    />
  );
}

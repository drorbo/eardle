"use client";

import { useEffect, useRef, useState } from "react";
import { Exercise } from "@/types/exercise";
import { ExercisePlayer } from "@/components/exercise/ExercisePlayer";
import { audioEngine } from "@/lib/audio/engine";

interface Props {
  exercise: Exercise;
  nextHref?: string;
}

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

function resolveChoices(exercise: Exercise): string[] {
  if (exercise.category === "note" || exercise.category === "interval") {
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
    // Start loading piano samples as soon as the exercise renders, well before
    // the user finishes reading the prompt and clicks Play. Idempotent/safe
    // to call again on every exercise navigation — a no-op once already warm.
    audioEngine?.warm();
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

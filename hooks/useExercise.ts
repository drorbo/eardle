"use client";

import { useReducer, useCallback } from "react";
import { Exercise } from "@/types/exercise";

type ExerciseState =
  | { phase: "idle" }
  | { phase: "playing" }
  | { phase: "ready" }
  | { phase: "answered"; selected: string; correct: boolean };

type Action =
  | { type: "PLAY" }
  | { type: "AUDIO_DONE" }
  | { type: "SELECT"; choice: string; answer: string }
  | { type: "RESET" };

function reducer(_state: ExerciseState, action: Action): ExerciseState {
  switch (action.type) {
    case "PLAY":
      return { phase: "playing" };
    case "AUDIO_DONE":
      return { phase: "ready" };
    case "SELECT":
      return { phase: "answered", selected: action.choice, correct: action.choice === action.answer };
    case "RESET":
      return { phase: "idle" };
    default:
      return _state;
  }
}

export function useExercise(exercise: Exercise) {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });

  const onPlay = useCallback(() => dispatch({ type: "PLAY" }), []);
  const onAudioDone = useCallback(() => dispatch({ type: "AUDIO_DONE" }), []);
  const onSelect = useCallback(
    (choice: string) => dispatch({ type: "SELECT", choice, answer: exercise.answer }),
    [exercise.answer]
  );
  const onReset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, onPlay, onAudioDone, onSelect, onReset };
}

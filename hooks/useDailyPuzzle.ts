"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { Category, Difficulty } from "@/types/exercise";
import { PerformanceParams } from "@/lib/audio/randomize";

export type DailyStatus = "not_started" | "in_progress" | "won" | "lost";

export interface DailyExercisePayload {
  id: number;
  category: Category;
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  config: Record<string, unknown>;
  title?: string;
  answer?: string;
}

interface TodayResponse {
  date: string;
  category: Category;
  difficulty: Difficulty;
  maxGuesses: number;
  status: DailyStatus;
  guesses: string[];
  performanceParams: PerformanceParams;
  exercise: DailyExercisePayload;
}

type DailyState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase: "ready";
      date: string;
      category: Category;
      difficulty: Difficulty;
      maxGuesses: number;
      status: DailyStatus;
      guesses: string[];
      performanceParams: PerformanceParams;
      exercise: DailyExercisePayload;
      submitting: boolean;
    };

type DailyAction =
  | { type: "LOADED"; payload: TodayResponse }
  | { type: "ERROR"; message: string }
  | { type: "SUBMITTING" }
  | { type: "GUESS_RESULT"; payload: { status: DailyStatus; guesses: string[]; exercise?: DailyExercisePayload } }
  | { type: "GUESS_FAILED" };

function reducer(state: DailyState, action: DailyAction): DailyState {
  switch (action.type) {
    case "LOADED":
      return {
        phase: "ready",
        date: action.payload.date,
        category: action.payload.category,
        difficulty: action.payload.difficulty,
        maxGuesses: action.payload.maxGuesses,
        status: action.payload.status,
        guesses: action.payload.guesses,
        performanceParams: action.payload.performanceParams,
        exercise: action.payload.exercise,
        submitting: false,
      };
    case "ERROR":
      return { phase: "error", message: action.message };
    case "SUBMITTING":
      return state.phase === "ready" ? { ...state, submitting: true } : state;
    case "GUESS_RESULT":
      if (state.phase !== "ready") return state;
      return {
        ...state,
        status: action.payload.status,
        guesses: action.payload.guesses,
        exercise: action.payload.exercise ?? state.exercise,
        submitting: false,
      };
    case "GUESS_FAILED":
      return state.phase === "ready" ? { ...state, submitting: false } : state;
    default:
      return state;
  }
}

function getOrCreateSessionToken(): string {
  const key = "eardle_session";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    try {
      localStorage.setItem(key, fresh);
    } catch {
      // quota exceeded
    }
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

export function useDailyPuzzle() {
  const [state, dispatch] = useReducer(reducer, { phase: "loading" });
  const tokenRef = useRef<string>("");

  useEffect(() => {
    tokenRef.current = getOrCreateSessionToken();
    (async () => {
      try {
        const res = await fetch(`/api/daily/today?token=${encodeURIComponent(tokenRef.current)}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          dispatch({ type: "ERROR", message: body.error ?? "Failed to load today's puzzle" });
          return;
        }
        const payload: TodayResponse = await res.json();
        dispatch({ type: "LOADED", payload });
      } catch {
        dispatch({ type: "ERROR", message: "Failed to load today's puzzle" });
      }
    })();
  }, []);

  const submitGuess = useCallback(
    async (choice: string) => {
      if (state.phase !== "ready" || state.submitting) return;
      if (state.status !== "not_started" && state.status !== "in_progress") return;
      dispatch({ type: "SUBMITTING" });
      try {
        const res = await fetch("/api/daily/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenRef.current, choice }),
        });
        if (!res.ok) {
          dispatch({ type: "GUESS_FAILED" });
          return;
        }
        const payload = await res.json();
        dispatch({ type: "GUESS_RESULT", payload });
      } catch {
        dispatch({ type: "GUESS_FAILED" });
      }
    },
    [state]
  );

  return { state, submitGuess, sessionToken: tokenRef.current };
}

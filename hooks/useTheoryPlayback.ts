"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine, SequenceEvent } from "@/lib/audio/engine";
import { resolvePlayable, ResolvedNoteEvent, Degree } from "@/lib/audio/lessonPlayback";
import type { AudioExamplePlayable } from "@/types/lesson";

const FREE_PLAY_FLASH_MS = 300;

interface ActiveExample {
  playable: AudioExamplePlayable;
  label: string;
}

export function useTheoryPlayback() {
  const [activeExample, setActiveExample] = useState<ActiveExample | null>(null);
  const [resolvedEvents, setResolvedEvents] = useState<ResolvedNoteEvent[]>([]);
  const [activeNoteKeys, setActiveNoteKeys] = useState<Map<string, Degree>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);

  // Guards against a stale/superseded sequence's late callback mutating
  // state after a newer request()/playNoteDirect() has already started.
  const generationRef = useRef(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lessons always play piano, regardless of whatever instrument a prior
  // page (e.g. an exercise) left the shared audioEngine singleton set to —
  // no picker, no per-page preference to track.
  useEffect(() => {
    audioEngine?.setInstrument("piano");
  }, []);

  const stop = useCallback(() => {
    generationRef.current++;
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    audioEngine?.stop();
    setIsPlaying(false);
    setActiveNoteKeys(new Map());
  }, []);

  const request = useCallback((playable: AudioExamplePlayable, label: string) => {
    if (!audioEngine) return;
    const gen = ++generationRef.current;
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    // Hard cutover — no residual sustain from the previous example bleeding
    // into this one, matching hooks/useAudio.ts's own play() convention.
    audioEngine.stop();

    const events = resolvePlayable(playable);
    setActiveExample({ playable, label });
    setResolvedEvents(events);
    setActiveNoteKeys(new Map());
    setIsPlaying(true);

    const sequenceEvents: SequenceEvent[] = events.map((e) => ({
      notes: e.notes,
      time: e.time,
      duration: e.duration,
    }));

    void audioEngine.playSequence(sequenceEvents, {
      onNoteStart: (_event, index) => {
        if (gen !== generationRef.current) return;
        const resolved = events[index];
        setActiveNoteKeys((prev) => {
          const next = new Map(prev);
          resolved.notes.forEach((note, i) => next.set(note, resolved.degrees[i]));
          return next;
        });
      },
      onNoteEnd: (_event, index) => {
        if (gen !== generationRef.current) return;
        const resolved = events[index];
        setActiveNoteKeys((prev) => {
          const next = new Map(prev);
          resolved.notes.forEach((note) => next.delete(note));
          return next;
        });
      },
      onComplete: () => {
        if (gen !== generationRef.current) return;
        setIsPlaying(false);
      },
    });
  }, []);

  // Free-play: keyboard key click, staff notehead click, glissando. Doesn't
  // touch activeExample/resolvedEvents — the Staff keeps showing the last
  // requested example while this only flashes the keyboard.
  const playNoteDirect = useCallback((note: string) => {
    if (!audioEngine) return;
    const gen = ++generationRef.current;
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    audioEngine.stop();

    setActiveNoteKeys(new Map([[note, "neutral"]]));
    void audioEngine.playNote(note);

    flashTimeoutRef.current = setTimeout(() => {
      if (gen !== generationRef.current) return;
      setActiveNoteKeys(new Map());
    }, FREE_PLAY_FLASH_MS);
  }, []);

  useEffect(() => {
    return () => {
      generationRef.current++;
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      audioEngine?.stop();
    };
  }, []);

  return {
    activeExample,
    resolvedEvents,
    activeNoteKeys,
    isPlaying,
    request,
    stop,
    playNoteDirect,
  };
}

export type TheoryPlayback = ReturnType<typeof useTheoryPlayback>;

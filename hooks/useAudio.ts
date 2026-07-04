"use client";

import { useCallback, useRef, useState } from "react";
import { audioEngine } from "@/lib/audio/engine";

// Speed level 1–5 mappings (index = level - 1)
const SCALE_GAPS  = [0.55, 0.375, 0.25, 0.15, 0.08] as const; // seconds between notes
const TEMPO_MULTS = [0.5,  0.7,   1.0,  1.4,  1.8 ] as const; // multiplier on stored BPM
// Fallback: if sampler loading hangs, unfreeze the exercise after this many ms
const SAFETY_MS = 30_000;
import { randomRoot, randomOctaveNote, addSemitones, randomVoicing, buildChord, buildScale, applyVoicing, applyInversion, VoicingId } from "@/lib/audio/theory";
import { Exercise, NoteConfig, IntervalConfig, ChordConfig, ProgressionConfig, ScaleConfig, UiPlayMode } from "@/types/exercise";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedNotes, setPlayedNotes] = useState<string[] | null>(null);
  const [lastPlayedMode, setLastPlayedMode] = useState<"harmonic" | "melodic-up" | "melodic-down">("harmonic");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const exerciseIdRef = useRef<number | null>(null);
  const randomizedRef = useRef<{
    root?: string;
    noteA?: string;
    noteB?: string;
    delta?: number;
    voicing?: VoicingId;
  } | null>(null);

  const play = useCallback(async (exercise: Exercise, playModeOverride?: UiPlayMode, speedLevel = 3) => {
    if (!audioEngine) return;
    // Ref-based guard: prevents concurrent play() calls regardless of stale React closures
    if (playingRef.current) return;
    playingRef.current = true;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Guarantee recovery if the sampler load hangs indefinitely
    timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, SAFETY_MS);
    audioEngine.stop();
    setIsPlaying(true);

    const { category, config } = exercise;

    // Reset randomized values when the exercise changes
    if (exerciseIdRef.current !== exercise.id) {
      exerciseIdRef.current = exercise.id;
      randomizedRef.current = null;
      setPlayedNotes(null);
    }

    try {
      if (category === "note") {
        const c = config as NoteConfig;
        if (!randomizedRef.current) {
          randomizedRef.current = exercise.difficulty === "easy"
            ? { root: `${c.note}4` }
            : { root: randomOctaveNote(c.note, 3, 5) };
        }
        await audioEngine.playNote(randomizedRef.current.root!);
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, 1800);
      } else if (category === "interval") {
        const c = config as IntervalConfig;
        if (!randomizedRef.current) {
          // Compound intervals (9ths/10ths) need a lower root so the upper note stays on-staff
          const maxOctave = c.semitones > 12 ? 3 : 4;
          const noteA = randomRoot(3, maxOctave);
          randomizedRef.current = { noteA, noteB: addSemitones(noteA, c.semitones) };
        }

        // Resolve which mode to actually use
        const dbMode = c.playMode === "melodic" ? "melodic-up" : c.playMode;
        const CONCRETE = ["harmonic", "melodic-up", "melodic-down"] as const;
        const chosen = (playModeOverride ?? dbMode) === "random"
          ? CONCRETE[Math.floor(Math.random() * 3)]
          : (playModeOverride ?? dbMode) as typeof CONCRETE[number];

        setLastPlayedMode(chosen);
        setPlayedNotes([randomizedRef.current.noteA!, randomizedRef.current.noteB!]);

        // melodic-down: swap note order so the engine plays high → low
        const [first, second] = chosen === "melodic-down"
          ? [randomizedRef.current.noteB!, randomizedRef.current.noteA!]
          : [randomizedRef.current.noteA!, randomizedRef.current.noteB!];
        await audioEngine.playInterval(first, second, chosen === "harmonic" ? "harmonic" : "melodic");

        const duration = chosen === "harmonic" ? 1800 : 2200;
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, duration);
      } else if (category === "chord") {
        const c = config as ChordConfig;
        const isInversionEx = typeof c.inversion === "number";

        if (!randomizedRef.current) {
          if (isInversionEx) {
            // Inversion exercises: fixed inversion from config, no random voicing.
            // Always root at octave 3 so the highest inverted note stays in octave 4-5.
            randomizedRef.current = { root: randomRoot(3, 3), voicing: "close" };
          } else {
            // Regular chord exercises: random voicing, octave 3-4.
            const voicing = randomVoicing(c.type);
            const maxOctave = voicing === "close" ? 4 : 3;
            randomizedRef.current = { root: randomRoot(3, maxOctave), voicing };
          }
        }

        const baseNotes = buildChord(randomizedRef.current.root!, c.type);
        const notes = isInversionEx
          ? applyInversion(baseNotes, c.inversion!)
          : applyVoicing(baseNotes, randomizedRef.current.voicing!);

        setPlayedNotes(notes);

        if (isInversionEx) {
          await audioEngine.playNotes(notes);
        } else {
          await audioEngine.playChord(randomizedRef.current.root!, c.type, randomizedRef.current.voicing!);
        }
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, 1800);
      } else if (category === "progression") {
        const c = config as ProgressionConfig;
        if (!randomizedRef.current) randomizedRef.current = { delta: Math.floor(Math.random() * 11) - 5 };
        const transposedChords = c.chords.map(chord => chord.map(n => addSemitones(n, randomizedRef.current!.delta!)));
        const tempoMult = TEMPO_MULTS[Math.max(0, Math.min(4, speedLevel - 1))];
        await audioEngine.playProgression(transposedChords, c.tempo, tempoMult);
        const totalDuration = (c.chords.length * 2 * 60) / (c.tempo * tempoMult) * 1000 + 1500;
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, totalDuration);
      } else if (category === "scale") {
        const c = config as ScaleConfig;
        if (!randomizedRef.current) randomizedRef.current = { root: randomRoot(3, 4) };
        const noteGap = SCALE_GAPS[Math.max(0, Math.min(4, speedLevel - 1))];
        const scaleNotes = buildScale(randomizedRef.current.root!, c.type);
        setPlayedNotes(scaleNotes);
        await audioEngine.playScale(randomizedRef.current.root!, c.type, noteGap);
        // Longest scale has 9 notes (octatonic); add 1.5s piano release
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, 9 * noteGap * 1000 + 1500);
      }
    } catch {
      setIsPlaying(false);
      playingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    audioEngine?.stop();
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  return { play, stop, isPlaying, playedNotes, lastPlayedMode };
}

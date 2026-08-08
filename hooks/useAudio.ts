"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine, InstrumentId } from "@/lib/audio/engine";

// Speed level 1–5 mappings (index = level - 1)
const SCALE_GAPS  = [0.55, 0.375, 0.25, 0.15, 0.08] as const; // seconds between notes
const TEMPO_MULTS = [0.5,  0.7,   1.0,  1.4,  1.8 ] as const; // multiplier on stored BPM
// Fallback: if sampler loading hangs, unfreeze the exercise after this many ms
const SAFETY_MS = 30_000;
import { randomRoot, randomOctaveNote, addSemitones, buildChord, buildScale, applyVoicing, applyInversion, VoicingId } from "@/lib/audio/theory";
import { generatePerformanceParams, PerformanceParams } from "@/lib/audio/randomize";
import { Exercise, NoteConfig, IntervalConfig, ChordConfig, ProgressionConfig, ScaleConfig, UiPlayMode, ChordPlayMode } from "@/types/exercise";

const INSTRUMENT_KEY = "eardle-instrument";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [playedNotes, setPlayedNotes] = useState<string[] | null>(null);
  const [playingChordIndex, setPlayingChordIndex] = useState<number | null>(null);
  const [lastPlayedMode, setLastPlayedMode] = useState<"harmonic" | "melodic-up" | "melodic-down">("harmonic");
  const [instrument, setInstrumentState] = useState<InstrumentId>(() => {
    if (typeof window === "undefined") return "piano";
    return localStorage.getItem(INSTRUMENT_KEY) === "synth" ? "synth" : "piano";
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const exerciseIdRef = useRef<number | null>(null);
  const randomizedRef = useRef<{
    root?: string;
    noteA?: string;
    noteB?: string;
    delta?: number;
    voicing?: VoicingId;
  } | null>(null);

  useEffect(() => {
    audioEngine?.setInstrument(instrument);
  }, [instrument]);

  const setInstrument = useCallback((id: InstrumentId) => {
    setInstrumentState(id);
    try { localStorage.setItem(INSTRUMENT_KEY, id); } catch {}
  }, []);

  const play = useCallback(async (exercise: Exercise, playModeOverride?: UiPlayMode, speedLevel = 3, forcedParams?: PerformanceParams, chordMode: ChordPlayMode = "harmonic") => {
    if (!audioEngine) return;
    // Restart-on-replay: a second click while already playing stops the
    // current sound and starts over, rather than being silently ignored.
    if (playingRef.current) {
      audioEngine.stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    playingRef.current = true;

    const needsLoad = !audioEngine.isReady();
    if (needsLoad) setIsLoadingSamples(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Guarantee recovery if the sampler load hangs indefinitely
    timeoutRef.current = setTimeout(() => { setIsPlaying(false); setIsLoadingSamples(false); playingRef.current = false; }, SAFETY_MS);
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
          const noteA = randomRoot(3, 5);
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
          randomizedRef.current = forcedParams ?? generatePerformanceParams(category, config);
        }

        const baseNotes = buildChord(randomizedRef.current.root!, c.type);
        const notes = isInversionEx
          ? applyInversion(baseNotes, c.inversion!)
          : applyVoicing(baseNotes, randomizedRef.current.voicing!);

        setPlayedNotes(notes);

        let duration = 1800;
        if (chordMode === "bass") {
          await audioEngine.playNote(notes[0], "2n");
        } else if (chordMode === "arpeggio") {
          const gap = 0.09;
          await audioEngine.playArpeggio(notes, gap);
          duration = notes.length * gap * 1000 + 1800;
        } else if (isInversionEx) {
          await audioEngine.playNotes(notes);
        } else {
          await audioEngine.playChord(randomizedRef.current.root!, c.type, randomizedRef.current.voicing!);
        }
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, duration);
      } else if (category === "progression") {
        const c = config as ProgressionConfig;
        if (!randomizedRef.current) randomizedRef.current = forcedParams ?? generatePerformanceParams(category, config);
        const transposedChords = c.chords.map(chord => chord.map(n => addSemitones(n, randomizedRef.current!.delta!)));
        const tempoMult = TEMPO_MULTS[Math.max(0, Math.min(4, speedLevel - 1))];
        await audioEngine.playProgression(transposedChords, c.tempo, tempoMult);
        const totalDuration = (c.chords.length * 2 * 60) / (c.tempo * tempoMult) * 1000 + 1500;
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, totalDuration);
      } else if (category === "scale") {
        const c = config as ScaleConfig;
        if (!randomizedRef.current) randomizedRef.current = forcedParams ?? generatePerformanceParams(category, config);
        const noteGap = SCALE_GAPS[Math.max(0, Math.min(4, speedLevel - 1))];
        const scaleNotes = buildScale(randomizedRef.current.root!, c.type);
        setPlayedNotes(scaleNotes);
        await audioEngine.playScale(randomizedRef.current.root!, c.type, noteGap);
        // Longest scale has 9 notes (octatonic); add 1.5s piano release
        timeoutRef.current = setTimeout(() => { setIsPlaying(false); playingRef.current = false; }, 9 * noteGap * 1000 + 1500);
      }
      if (needsLoad) setIsLoadingSamples(false);
    } catch {
      setIsPlaying(false);
      setIsLoadingSamples(false);
      playingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    audioEngine?.stop();
    setIsPlaying(false);
    setIsLoadingSamples(false);
    playingRef.current = false;
  }, []);

  // Plays a single chord out of a progression's `chords` array in isolation
  // (e.g. tapping "chord 2" of a 4-chord progression). Reuses the same cached
  // transposition delta as the full progression playthrough so the isolated
  // chord matches the pitch the user actually hears when playing the whole
  // progression, rather than sounding in a freshly re-randomized key.
  const playChord = useCallback(async (exercise: Exercise, index: number) => {
    if (!audioEngine) return;
    const config = exercise.config as ProgressionConfig;

    audioEngine.stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (chordTimeoutRef.current) clearTimeout(chordTimeoutRef.current);
    playingRef.current = false;
    setIsPlaying(false);

    if (exerciseIdRef.current !== exercise.id || !randomizedRef.current) {
      exerciseIdRef.current = exercise.id;
      randomizedRef.current = generatePerformanceParams("progression", config);
    }
    const notes = config.chords[index].map(n => addSemitones(n, randomizedRef.current!.delta!));

    setPlayingChordIndex(index);
    await audioEngine.playNotes(notes);
    chordTimeoutRef.current = setTimeout(() => setPlayingChordIndex(null), 1800);
  }, []);

  return { play, stop, playChord, isPlaying, isLoadingSamples, playedNotes, playingChordIndex, lastPlayedMode, instrument, setInstrument };
}

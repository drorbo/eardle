"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Category, Difficulty, Exercise } from "@/types/exercise";
import { INTERVAL_NAMES, NOTE_NAMES } from "@/lib/audio/theory";
import { NoteConfig } from "./ConfigFields/NoteConfig";
import { IntervalConfig } from "./ConfigFields/IntervalConfig";
import { ChordConfig } from "./ConfigFields/ChordConfig";
import { ProgressionConfig } from "./ConfigFields/ProgressionConfig";
import { ScaleConfig } from "./ConfigFields/ScaleConfig";
import { audioEngine } from "@/lib/audio/engine";
import { randomRoot } from "@/lib/audio/theory";

const DEFAULT_CHOICES: Record<Category, string[]> = {
  note:        NOTE_NAMES as unknown as string[],
  interval:    INTERVAL_NAMES as unknown as string[],
  chord:       ["Major", "Minor", "Dominant 7th", "Major 7th", "Diminished", "Augmented", "Minor 7th", "Half-Diminished", "Diminished 7th", "Major 9th", "Dominant 7th b9", "Major 6th", "Major 6/9", "Major 7th #11", "Major 9th #11", "Major 13th", "Augmented Major 7th", "Minor 9th", "Minor 11th", "Minor 13th", "Minor-Major 7th", "Minor-Major 9th", "Minor 6th", "Dominant 9th", "Dominant 13th", "Dominant 7th #11", "Dominant 9th #11", "Dominant 13th #11", "7♭9", "7♯9", "7♭13", "7♭9♭13", "7♯9♭13", "7♭9♯11", "7♯9♯11", "Augmented 7th", "Dominant 7th ♭5", "7sus4", "9sus4", "13sus4"],
  progression: ["I - IV - V", "I - V - vi - IV", "ii - V - I", "I - vi - IV - V", "I - IV - vi - V", "vi - IV - I - V", "I - III - IV - iv", "ii - IV - I - V", "ii7 - V7 - Imaj7", "iim7b5 - V7b9 - im7", "Imaj7 - VI7 - ii7 - V7", "I7 - IV7 - I7 - V7", "ii7 - bII7 - Imaj7", "iii7 - VI7 - ii7 - V7", "Imaj7 - IVmaj7 - iii7 - VI7", "im7 - bVII7 - bVI7 - V7"],
  scale:       ["Major", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian", "Harmonic Minor", "Melodic Minor", "Blues", "Pentatonic Major", "Dorian ♭2", "Lydian Augmented", "Lydian Dominant", "Mixolydian ♭6", "Locrian ♯2", "Altered", "Whole Tone", "Half-Whole Diminished", "Whole-Half Diminished"],
};

const DEFAULT_PROMPTS: Record<Category, string> = {
  note:        "What note is this?",
  interval:    "What interval is this?",
  chord:       "What type of chord is this?",
  progression: "What chord progression is this?",
  scale:       "What scale type is this?",
};

const DEFAULT_CONFIGS: Record<Category, any> = {
  note:        { note: "C" },
  interval:    { semitones: 7, playMode: "harmonic" },
  chord:       { type: "major" },
  progression: { key: "C", chords: [["C4","E4","G4"],["F4","A4","C5"],["G4","B4","D5"]], romanNumerals: ["I","IV","V"], tempo: 80 },
  scale:       { type: "major" },
};

interface Props {
  initial?: Exercise;
}

export function ExerciseForm({ initial }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(initial?.category ?? "note");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? DEFAULT_PROMPTS.note);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "easy");
  const [config, setConfig] = useState<any>(initial?.config ?? DEFAULT_CONFIGS.note);
  const [choices, setChoices] = useState<string[]>(initial?.choices ?? DEFAULT_CHOICES.note);
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // When category changes, reset config/choices/prompt (but keep if editing)
  useEffect(() => {
    if (!initial) {
      setConfig(DEFAULT_CONFIGS[category]);
      setChoices(DEFAULT_CHOICES[category]);
      setPrompt(DEFAULT_PROMPTS[category]);
      setAnswer("");
    }
  }, [category, initial]);

  async function handlePreview() {
    if (!audioEngine) return;
    try {
      const fakeExercise = { category, config } as any;
      if (category === "note") await audioEngine.playNote(`${config.note}4`);
      else if (category === "interval") await audioEngine.playInterval(config.noteA, config.noteB, config.playMode);
      else if (category === "chord") await audioEngine.playChord(randomRoot(3, 4), config.type);
      else if (category === "progression") await audioEngine.playProgression(config.chords, config.tempo);
      else if (category === "scale") await audioEngine.playScale(randomRoot(3, 4), config.type);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = initial ? `/api/exercises/${initial.id}` : "/api/exercises";
    const method = initial ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, prompt, difficulty, config, choices, answer }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
    } else {
      router.push("/admin/exercises");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Category */}
      <div>
        <label className="label">Category</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)} disabled={!!initial}>
          <option value="note">Note Identification</option>
          <option value="interval">Intervals</option>
          <option value="chord">Chords</option>
          <option value="progression">Chord Progressions</option>
          <option value="scale">Scales</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Perfect 5th — C to G" />
      </div>

      {/* Prompt */}
      <div>
        <label className="label">Prompt (question shown to user)</label>
        <input className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
      </div>

      {/* Difficulty */}
      <div>
        <label className="label">Difficulty</label>
        <div className="flex gap-3">
          {(["easy", "medium", "hard", "jazz"] as Difficulty[]).map((d) => (
            <label key={d} className={`flex-1 flex items-center justify-center py-3 rounded-xl border cursor-pointer capitalize font-medium text-sm transition ${
              difficulty === d
                ? d === "jazz" ? "bg-amber-700 border-amber-500 text-white" : "bg-indigo-700 border-indigo-500 text-white"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
            }`}>
              <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="sr-only" />
              {d}
            </label>
          ))}
        </div>
      </div>

      {/* Config fields */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Audio Configuration</h3>
          <button type="button" onClick={handlePreview} className="text-sm px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 transition">
            ▶ Preview
          </button>
        </div>
        {category === "note"        && <NoteConfig value={config} onChange={setConfig} />}
        {category === "interval"    && <IntervalConfig value={config} onChange={setConfig} />}
        {category === "chord"       && <ChordConfig value={config} onChange={setConfig} />}
        {category === "progression" && <ProgressionConfig value={config} onChange={setConfig} />}
        {category === "scale"       && <ScaleConfig value={config} onChange={setConfig} />}
      </div>

      {/* Answer */}
      <div>
        <label className="label">Correct Answer</label>
        <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} required placeholder="Must exactly match one of the choices" />
      </div>

      {/* Choices */}
      <div>
        <label className="label">Answer Choices (one per line)</label>
        <textarea
          className="input font-mono h-36"
          value={choices.join("\n")}
          onChange={(e) => setChoices(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
        />
        <p className="text-xs text-gray-500 mt-1">{choices.length} choices</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Save Changes" : "Create Exercise"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

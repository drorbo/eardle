"use client";

const PROGRESSION_TOPICS = [
  { value: "",         label: "— none —" },
  { value: "pop",      label: "Pop / Rock" },
  { value: "jazz",     label: "Jazz" },
  { value: "blues",    label: "Blues" },
  { value: "diatonic", label: "Diatonic" },
];

interface Props {
  value: { key: string; chords: string[][]; romanNumerals: string[]; tempo: number; topic?: string };
  onChange: (v: any) => void;
}

const KEYS = ["C", "D", "E", "F", "G", "A", "B", "C#", "D#", "F#", "G#", "A#"];

export function ProgressionConfig({ value, onChange }: Props) {
  const chordsJson = JSON.stringify(value.chords ?? []);
  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Key</label>
        <select className="field-input" value={value.key} onChange={(e) => onChange({ ...value, key: e.target.value })}>
          {KEYS.map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label">Chords (JSON array of arrays of note strings)</label>
        <textarea
          className="field-input font-mono text-sm h-28"
          value={chordsJson}
          onChange={(e) => {
            try { onChange({ ...value, chords: JSON.parse(e.target.value) }); } catch {}
          }}
        />
        <p className="text-xs text-text-subtle mt-1">Example: [["C4","E4","G4"],["F4","A4","C5"]]</p>
      </div>
      <div>
        <label className="field-label">Roman Numerals (comma-separated)</label>
        <input
          className="field-input"
          value={(value.romanNumerals ?? []).join(", ")}
          onChange={(e) => onChange({ ...value, romanNumerals: e.target.value.split(",").map((s) => s.trim()) })}
        />
      </div>
      <div>
        <label className="field-label">Tempo (BPM): {value.tempo}</label>
        <input
          type="range" min={50} max={140} step={4}
          className="w-full"
          value={value.tempo}
          onChange={(e) => onChange({ ...value, tempo: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="field-label">Topic</label>
        <select
          className="field-input"
          value={value.topic ?? ""}
          onChange={(e) => {
            const t = e.target.value;
            onChange({ ...value, topic: t || undefined });
          }}
        >
          {PROGRESSION_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

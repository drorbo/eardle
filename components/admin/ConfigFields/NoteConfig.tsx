"use client";

import { NOTE_NAMES } from "@/lib/audio/theory";

const NOTE_TOPICS = [
  { value: "",            label: "— none —" },
  { value: "natural",     label: "Natural Notes" },
  { value: "accidentals", label: "Accidentals" },
];

interface Props {
  value: { note: string; topic?: string };
  onChange: (v: { note: string; topic?: string }) => void;
}

const OCTAVES = ["3", "4", "5"];

export function NoteConfig({ value, onChange }: Props) {
  const [noteName, octave] = [value.note?.slice(0, -1) ?? "C", value.note?.slice(-1) ?? "4"];
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Note</label>
          <select
            className="input"
            value={noteName}
            onChange={(e) => onChange({ ...value, note: `${e.target.value}${octave}` })}
          >
            {NOTE_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Octave</label>
          <select
            className="input"
            value={octave}
            onChange={(e) => onChange({ ...value, note: `${noteName}${e.target.value}` })}
          >
            {OCTAVES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Topic</label>
        <select
          className="input"
          value={value.topic ?? ""}
          onChange={(e) => {
            const t = e.target.value;
            onChange({ ...value, topic: t || undefined });
          }}
        >
          {NOTE_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

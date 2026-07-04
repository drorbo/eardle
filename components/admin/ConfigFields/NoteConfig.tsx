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

export function NoteConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Note</label>
        <select
          className="input"
          value={value.note ?? "C"}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
        >
          {NOTE_NAMES.map((n) => <option key={n}>{n}</option>)}
        </select>
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

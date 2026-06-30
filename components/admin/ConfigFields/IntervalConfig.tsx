"use client";

const INTERVALS = [
  { label: "Unison",       semitones: 0  },
  { label: "Minor 2nd",    semitones: 1  },
  { label: "Major 2nd",    semitones: 2  },
  { label: "Minor 3rd",    semitones: 3  },
  { label: "Major 3rd",    semitones: 4  },
  { label: "Perfect 4th",  semitones: 5  },
  { label: "Tritone",      semitones: 6  },
  { label: "Perfect 5th",  semitones: 7  },
  { label: "Minor 6th",    semitones: 8  },
  { label: "Major 6th",    semitones: 9  },
  { label: "Minor 7th",    semitones: 10 },
  { label: "Major 7th",    semitones: 11 },
  { label: "Octave",       semitones: 12 },
  { label: "Minor 9th",    semitones: 13 },
  { label: "Major 9th",    semitones: 14 },
  { label: "Minor 10th",   semitones: 15 },
  { label: "Major 10th",   semitones: 16 },
];

const INTERVAL_TOPICS = [
  { value: "", label: "— none —" },
];

interface Props {
  value: { semitones: number; playMode: "harmonic" | "melodic"; topic?: string };
  onChange: (v: { semitones: number; playMode: "harmonic" | "melodic"; topic?: string }) => void;
}

export function IntervalConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Interval</label>
        <select
          className="input"
          value={value.semitones}
          onChange={(e) => onChange({ ...value, semitones: Number(e.target.value) })}
        >
          {INTERVALS.map((i) => (
            <option key={i.semitones} value={i.semitones}>{i.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Play Mode</label>
        <select className="input" value={value.playMode} onChange={(e) => onChange({ ...value, playMode: e.target.value as any })}>
          <option value="harmonic">Harmonic (together)</option>
          <option value="melodic">Melodic (sequential)</option>
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
          {INTERVAL_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

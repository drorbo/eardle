"use client";

const CHORD_TYPE_OPTIONS = [
  { group: "Triads",              value: "major",      label: "Major" },
  { group: "Triads",              value: "minor",      label: "Minor" },
  { group: "Triads",              value: "dim",        label: "Diminished" },
  { group: "Triads",              value: "aug",        label: "Augmented" },
  { group: "Triads",              value: "sus4",       label: "Sus4" },
  { group: "Triads",              value: "add2",       label: "Major add2" },
  { group: "Triads",              value: "add4",       label: "Major add4" },
  { group: "Major family",        value: "maj6",       label: "Major 6th" },
  { group: "Major family",        value: "maj6_9",     label: "Major 6/9" },
  { group: "Major family",        value: "maj7",       label: "Major 7th" },
  { group: "Major family",        value: "maj9",       label: "Major 9th" },
  { group: "Major family",        value: "maj7s11",    label: "Major 7th ♯11" },
  { group: "Major family",        value: "maj9s11",    label: "Major 9th ♯11" },
  { group: "Major family",        value: "maj13",      label: "Major 13th" },
  { group: "Major family",        value: "augMaj7",    label: "Augmented Major 7th" },
  { group: "Minor family",        value: "min6",       label: "Minor 6th" },
  { group: "Minor family",        value: "min7",       label: "Minor 7th" },
  { group: "Minor family",        value: "min9",       label: "Minor 9th" },
  { group: "Minor family",        value: "min11",      label: "Minor 11th" },
  { group: "Minor family",        value: "min13",      label: "Minor 13th" },
  { group: "Minor family",        value: "minMaj7",    label: "Minor-Major 7th" },
  { group: "Minor family",        value: "minMaj9",    label: "Minor-Major 9th" },
  { group: "Minor family",        value: "min7b5",     label: "Half-Diminished (m7♭5)" },
  { group: "Dominant",            value: "dom7",       label: "Dominant 7th" },
  { group: "Dominant",            value: "dom9",       label: "Dominant 9th" },
  { group: "Dominant",            value: "dom13",      label: "Dominant 13th" },
  { group: "Dominant",            value: "dom7s11",    label: "Dominant 7th ♯11" },
  { group: "Dominant",            value: "dom9s11",    label: "Dominant 9th ♯11" },
  { group: "Dominant",            value: "dom13s11",   label: "Dominant 13th ♯11" },
  { group: "Altered dominant",    value: "dom7b9",     label: "7♭9" },
  { group: "Altered dominant",    value: "dom7s9",     label: "7♯9" },
  { group: "Altered dominant",    value: "dom7b13",    label: "7♭13" },
  { group: "Altered dominant",    value: "dom7b9b13",  label: "7♭9♭13" },
  { group: "Altered dominant",    value: "dom7s9b13",  label: "7♯9♭13" },
  { group: "Altered dominant",    value: "dom7b9s11",  label: "7♭9♯11" },
  { group: "Altered dominant",    value: "dom7s9s11",  label: "7♯9♯11" },
  { group: "Altered dominant",    value: "dom7s5",     label: "Augmented 7th (7♯5)" },
  { group: "Altered dominant",    value: "dom7b5",     label: "Dominant 7th ♭5" },
  { group: "Suspended",           value: "sus7",       label: "7sus4" },
  { group: "Suspended",           value: "sus9",       label: "9sus4" },
  { group: "Suspended",           value: "sus13",      label: "13sus4" },
  { group: "Diminished",          value: "dim7",       label: "Diminished 7th" },
];

const CHORD_TOPICS = [
  { value: "",           label: "— none —" },
  { value: "major",      label: "Major" },
  { value: "minor",      label: "Minor" },
  { value: "dominant",   label: "Dominant" },
  { value: "altered",    label: "Altered" },
  { value: "suspended",  label: "Suspended" },
  { value: "diminished", label: "Diminished" },
  { value: "augmented",  label: "Augmented" },
  { value: "inversions", label: "Inversions" },
];

const groups = [...new Set(CHORD_TYPE_OPTIONS.map((o) => o.group))];

interface Props {
  value: { type: string; family?: string; topic?: string; inversion?: number };
  onChange: (v: { type: string; family?: string; topic?: string; inversion?: number }) => void;
}

export function ChordConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Chord Type</label>
        <select className="field-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {CHORD_TYPE_OPTIONS.filter((o) => o.group === group).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Topic</label>
        <select
          className="field-input"
          value={value.topic ?? ""}
          onChange={(e) => {
            const t = e.target.value;
            // Clear inversion when leaving inversions topic
            const next: typeof value = { ...value, topic: t || undefined };
            if (t !== "inversions") delete next.inversion;
            onChange(next);
          }}
        >
          {CHORD_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {value.topic === "inversions" && (
        <div>
          <label className="field-label">Inversion</label>
          <select
            className="field-input"
            value={value.inversion ?? 0}
            onChange={(e) => onChange({ ...value, inversion: Number(e.target.value) })}
          >
            <option value={0}>Root Position</option>
            <option value={1}>1st Inversion</option>
            <option value={2}>2nd Inversion</option>
            <option value={3}>3rd Inversion</option>
          </select>
        </div>
      )}
    </div>
  );
}

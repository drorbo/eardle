"use client";

const SCALE_OPTIONS = [
  // Major modes
  { value: "major",           label: "Major (Ionian)" },
  { value: "dorian",          label: "Dorian" },
  { value: "phrygian",        label: "Phrygian" },
  { value: "lydian",          label: "Lydian" },
  { value: "mixolydian",      label: "Mixolydian" },
  { value: "aeolian",         label: "Minor Scale" },
  { value: "locrian",         label: "Locrian" },
  // Minor
  { value: "harmonic_minor",  label: "Harmonic Minor" },
  { value: "melodic_minor",   label: "Melodic Minor" },
  // Pentatonic & blues
  { value: "pentatonic_major",label: "Pentatonic Major" },
  { value: "blues",           label: "Blues" },
  // Melodic minor modes
  { value: "dorian_b2",       label: "Dorian ♭2" },
  { value: "lydian_aug",      label: "Lydian Augmented" },
  { value: "lydian_b7",       label: "Lydian Dominant" },
  { value: "mixolydian_b6",   label: "Mixolydian ♭6" },
  { value: "locrian_s2",      label: "Locrian ♯2" },
  { value: "altered",         label: "Altered" },
  // Symmetric
  { value: "whole_tone",      label: "Whole Tone" },
  { value: "half_whole",      label: "Half-Whole Diminished" },
  { value: "whole_half",      label: "Whole-Half Diminished" },
];

const SCALE_TOPICS = [
  { value: "",                    label: "— none —" },
  { value: "major_modes",         label: "Major Modes" },
  { value: "minor",               label: "Minor" },
  { value: "pentatonic_blues",    label: "Pentatonic & Blues" },
  { value: "melodic_minor_modes", label: "Melodic Minor Modes" },
  { value: "jazz_symmetric",      label: "Symmetric Scales" },
];

interface Props {
  value: { type: string; topic?: string };
  onChange: (v: { type: string; topic?: string }) => void;
}

export function ScaleConfig({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Scale Type</label>
        <select className="field-input" value={value.type} onChange={(e) => onChange({ ...value, type: e.target.value })}>
          {SCALE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
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
          {SCALE_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

"use client";

import type { AudioExampleBlock, AudioExamplePlayable, LessonBlock } from "@/types/lesson";
import type { ChordType, ScaleType } from "@/types/exercise";
import { getVoicings, CHORD_TYPES } from "@/lib/audio/theory";

// The chord-type field below is free text (matching the existing "chord"
// kind's field), so while the admin is mid-typing it's often not yet a
// valid key — getVoicings indexes CHORD_INTERVALS directly and throws on
// an unrecognized one, so guard every call through this instead of ??
// (which only catches undefined/null, not "" or a partial string).
function safeChordType(t: string | undefined): ChordType {
  return t && t in CHORD_TYPES ? (t as ChordType) : "major";
}

const BLOCK_TYPES: LessonBlock["type"][] = ["text", "tip", "commonMistake", "summary", "audioExample"];
const BLOCK_LABELS: Record<LessonBlock["type"], string> = {
  text: "Text",
  tip: "Tip",
  commonMistake: "Common Mistake",
  summary: "Summary",
  audioExample: "Audio Example",
};

function emptyBlock(type: LessonBlock["type"]): LessonBlock {
  if (type === "audioExample") return { type, label: "", play: { kind: "note", root: "C4" } };
  return { type, body: "" };
}

interface Props {
  blocks: LessonBlock[];
  onChange: (blocks: LessonBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: Props) {
  function update(i: number, block: LessonBlock) {
    const next = [...blocks];
    next[i] = block;
    onChange(next);
  }
  function remove(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function add(type: LessonBlock["type"]) {
    onChange([...blocks, emptyBlock(type)]);
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="p-3 rounded-xl bg-surface-2 border border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
              {BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="px-2 py-1 text-xs rounded text-text-muted hover:text-text disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === blocks.length - 1}
                className="px-2 py-1 text-xs rounded text-text-muted hover:text-text disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-2 py-1 text-xs rounded text-red-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>

          {block.type === "audioExample" ? (
            <AudioExampleFields block={block} onChange={(b) => update(i, b)} />
          ) : (
            <textarea
              value={block.body}
              onChange={(e) => update(i, { ...block, body: e.target.value })}
              rows={3}
              className="field-input resize-none"
              placeholder="Block text…"
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="px-3 py-1.5 rounded-lg text-xs bg-surface border border-border-subtle text-text-secondary hover:border-border transition"
          >
            + {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlayableFields({
  play,
  onChange,
}: {
  play: AudioExamplePlayable;
  onChange: (play: AudioExamplePlayable) => void;
}) {
  function patch(p: Partial<AudioExamplePlayable>) {
    onChange({ ...play, ...p });
  }
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={play.kind}
        onChange={(e) => patch({ kind: e.target.value as AudioExamplePlayable["kind"] })}
        className="field-input flex-1 min-w-[8rem]"
      >
        <option value="note">Note</option>
        <option value="interval">Interval</option>
        <option value="chord">Chord</option>
        <option value="scale">Scale</option>
        <option value="arpeggio">Arpeggio</option>
        <option value="progression">Progression</option>
      </select>

      {(play.kind === "note" || play.kind === "chord" || play.kind === "scale" || play.kind === "arpeggio") && (
        <input
          value={play.root ?? ""}
          onChange={(e) => patch({ root: e.target.value })}
          placeholder="Root, e.g. C4"
          className="field-input flex-1 min-w-[6rem]"
        />
      )}
      {(play.kind === "chord" || play.kind === "arpeggio") && (
        <input
          value={play.chordType ?? ""}
          onChange={(e) => patch({ chordType: e.target.value as ChordType })}
          placeholder="Chord type, e.g. major"
          className="field-input flex-1 min-w-[8rem]"
        />
      )}
      {play.kind === "scale" && (
        <input
          value={play.scaleType ?? ""}
          onChange={(e) => patch({ scaleType: e.target.value as ScaleType })}
          placeholder="Scale type, e.g. major"
          className="field-input flex-1 min-w-[8rem]"
        />
      )}
      {play.kind === "interval" && (
        <>
          <input
            value={play.noteA ?? ""}
            onChange={(e) => patch({ noteA: e.target.value })}
            placeholder="Note A, e.g. C4"
            className="field-input flex-1 min-w-[6rem]"
          />
          <input
            value={play.noteB ?? ""}
            onChange={(e) => patch({ noteB: e.target.value })}
            placeholder="Note B, e.g. E4"
            className="field-input flex-1 min-w-[6rem]"
          />
          <select
            value={play.intervalMode ?? "harmonic"}
            onChange={(e) => patch({ intervalMode: e.target.value as AudioExamplePlayable["intervalMode"] })}
            className="field-input flex-1 min-w-[8rem]"
          >
            <option value="harmonic">Harmonic (together)</option>
            <option value="melodic">Melodic (A then B)</option>
          </select>
        </>
      )}
      {play.kind === "arpeggio" && (
        <>
          <input
            value={play.notes ? JSON.stringify(play.notes) : ""}
            onChange={(e) => {
              if (e.target.value === "") {
                patch({ notes: undefined });
                return;
              }
              try {
                patch({ notes: JSON.parse(e.target.value) });
              } catch {
                /* keep typing until valid JSON */
              }
            }}
            placeholder='Notes JSON, e.g. ["C4","E4","G4"] (overrides chord type below)'
            className="field-input flex-1 min-w-[10rem]"
          />
          <input
            type="number"
            min={0}
            value={play.inversion ?? ""}
            onChange={(e) => patch({ inversion: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Inversion (optional)"
            className="field-input flex-1 min-w-[8rem]"
          />
          <select
            value={play.voicing ?? ""}
            onChange={(e) => patch({ voicing: e.target.value === "" ? undefined : (e.target.value as AudioExamplePlayable["voicing"]) })}
            className="field-input flex-1 min-w-[8rem]"
          >
            <option value="">Voicing (optional)</option>
            {getVoicings(safeChordType(play.chordType)).map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
          <p className="w-full text-[11px] text-text-faint">
            Notes JSON above always wins if filled in. Otherwise built from chord type + root, with voicing taking priority over inversion.
          </p>
        </>
      )}
      {play.kind === "progression" && (
        <>
          <input
            value={play.chords ? JSON.stringify(play.chords) : ""}
            onChange={(e) => {
              try {
                patch({ chords: JSON.parse(e.target.value) });
              } catch {
                /* keep typing until valid JSON */
              }
            }}
            placeholder='Chords JSON, e.g. [["C4","E4","G4"],["F4","A4","C5"]]'
            className="field-input flex-1 min-w-[14rem]"
          />
          <input
            value={play.chordRoots?.join(",") ?? ""}
            onChange={(e) =>
              patch({ chordRoots: e.target.value === "" ? undefined : e.target.value.split(",").map((s) => s.trim()) })
            }
            placeholder="Chord roots (optional), e.g. C4,F4,G4,C4"
            className="field-input flex-1 min-w-[10rem]"
          />
          <input
            value={play.chordTypes?.join(",") ?? ""}
            onChange={(e) =>
              patch({
                chordTypes:
                  e.target.value === "" ? undefined : (e.target.value.split(",").map((s) => s.trim()) as ChordType[]),
              })
            }
            placeholder="Chord types (optional), e.g. major,major,major,major"
            className="field-input flex-1 min-w-[10rem]"
          />
          <p className="w-full text-[11px] text-text-faint">
            Chord roots/types are optional, parallel to the chords above — add them to enable degree coloring.
          </p>
        </>
      )}
    </div>
  );
}

function AudioExampleFields({
  block,
  onChange,
}: {
  block: AudioExampleBlock;
  onChange: (block: LessonBlock) => void;
}) {
  return (
    <div className="space-y-2">
      <input
        value={block.label}
        onChange={(e) => onChange({ ...block, label: e.target.value })}
        placeholder="Button label, e.g. Play C major"
        className="field-input"
      />
      <PlayableFields play={block.play} onChange={(play) => onChange({ ...block, play })} />

      {block.comparePlay ? (
        <div className="mt-2 pt-2 border-t border-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-text-faint">Compare against</span>
            <button
              type="button"
              onClick={() => onChange({ ...block, compareLabel: undefined, comparePlay: undefined })}
              className="text-[11px] text-red-500 hover:text-red-400"
            >
              Remove comparison
            </button>
          </div>
          <input
            value={block.compareLabel ?? ""}
            onChange={(e) => onChange({ ...block, compareLabel: e.target.value })}
            placeholder="Comparison button label"
            className="field-input"
          />
          <PlayableFields
            play={block.comparePlay}
            onChange={(comparePlay) => onChange({ ...block, comparePlay })}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            onChange({ ...block, compareLabel: "", comparePlay: { kind: "note", root: "C4" } })
          }
          className="text-xs text-indigo-400 hover:text-indigo-300"
        >
          + Add comparison example (A/B)
        </button>
      )}
    </div>
  );
}

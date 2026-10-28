import type { Category } from "@/types/exercise";
import { ALIASES } from "./aliases";

export type Resolution = { kind: "match" | "suggest"; label: string } | { kind: "none" };

// ─── Normalisation ──────────────────────────────────────────────────────────

/**
 * Case-sensitive clean-up that must run before lowercasing: `M7`/`m7` (major/minor) are different
 * chords, `Δ`/`ø`/`°`/`+` are symbols for maj/half-dim/dim/aug, and ♯/♭ become #/b.
 */
function prep(raw: string): string {
  let s = raw.trim();
  s = s.replace(/♯/g, "#").replace(/♭/g, "b").replace(/♮/g, "").replace(/[−–—]/g, "-");
  s = s.replace(/[Δ∆]/g, "maj").replace(/\^/g, "maj").replace(/ø/gi, "halfdim").replace(/°/g, "dim").replace(/\+/g, "aug");
  s = s.replace(/mM/g, "minmaj").replace(/M(?=\d)/g, "maj");
  s = s.replace(/^M$/, "maj").replace(/^m$/, "min");
  // lowercase "m" before a digit means minor — but only at the start or after a root letter, so "dom7" stays dom7
  s = s.replace(/(^|[\s\-A-Ga-g#])m(?=\d)/g, "$1min");
  s = s.replace(/^-(?=\d)/, "min");
  return s;
}

const WORDS: Array<[RegExp, string]> = [
  [/\bfirst\b/g, "1"], [/\bsecond\b/g, "2"], [/\bthird\b/g, "3"], [/\bfourth\b/g, "4"], [/\bfifth\b/g, "5"],
  [/\bsixth\b/g, "6"], [/\bseventh\b/g, "7"], [/\beighth\b/g, "8"], [/\bninth\b/g, "9"], [/\btenth\b/g, "10"],
  [/\beleventh\b/g, "11"], [/\bthirteenth\b/g, "13"],
  [/\bsharp\b/g, "#"], [/\bflat\b/g, "b"],
];
const ABBREVIATIONS: Array<[RegExp, string]> = [
  [/major/g, "maj"], [/minor/g, "min"], [/dominant/g, "dom"], [/diminished/g, "dim"], [/augmented/g, "aug"], [/suspended/g, "sus"],
];

/** The comparison key: lowercase, no punctuation/spaces, no ordinal suffixes, optional word abbreviations. */
function keyOf(raw: string, abbreviate = true): string {
  let s = prep(raw).toLowerCase();
  for (const [re, rep] of WORDS) s = s.replace(re, rep);
  s = s.replace(/(\d)(?:th|st|nd|rd)\b/g, "$1");
  if (abbreviate) for (const [re, rep] of ABBREVIATIONS) s = s.replace(re, rep);
  return s.replace(/[\s\-._,()/:]/g, "");
}

function variantsOf(k: string): string[] {
  const out = [k];
  const trimmed = k.replace(/(?:scale|chord)$/, "");
  if (trimmed && trimmed !== k) out.push(trimmed);
  // "dom7#9" for a label that is simply "7♯9"
  const undom = k.replace(/^dom(?=\d)/, "");
  if (undom !== k) out.push(undom);
  return out;
}

// ─── Index ──────────────────────────────────────────────────────────────────

interface Entry { label: string; short: string; long: string }

interface Index {
  byKey: Map<string, string>;
  entries: Entry[];
  vocab: Set<string>;
}

function buildIndex(category: Category, vocabulary: string[]): Index {
  const byKey = new Map<string, string>();
  const entries: Entry[] = [];
  const add = (spelling: string, label: string, keyOverride?: string) => {
    const short = keyOverride ?? keyOf(spelling);
    if (!short) return;
    if (!byKey.has(short)) byKey.set(short, label);
    entries.push({ label, short, long: keyOf(spelling, false) });
  };

  for (const l of vocabulary) add(l, l);
  for (const [canon, spellings] of Object.entries(ALIASES[category])) {
    add(canon, canon);
    for (const sp of spellings) add(sp, canon);
  }
  if (category === "chord") {
    // "Dominant 9th" is typed "9", "Dominant 7th #11" as "7#11": index the key without its leading "dom"
    for (const l of vocabulary) {
      const k = keyOf(l);
      if (/^dom(?=\d)/.test(k)) add(l, l, k.replace(/^dom/, ""));
    }
  }
  return { byKey, entries, vocab: new Set(vocabulary) };
}

function lookup(index: Index, k: string): string | undefined {
  for (const v of variantsOf(k)) {
    const hit = index.byKey.get(v);
    if (hit) return hit;
  }
  return undefined;
}

// ─── Fuzzy ──────────────────────────────────────────────────────────────────

/** Optimal-string-alignment distance: a swapped pair of neighbours ("dorain") costs 1. */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

function threshold(len: number): number {
  return len >= 8 ? 2 : len >= 4 ? 1 : 0;
}

function suggest(index: Index, text: string): string | undefined {
  const short = keyOf(text);
  const long = keyOf(text, false);
  const limit = threshold(long.length);
  if (limit === 0) return undefined;
  let best = Infinity;
  const labels = new Set<string>();
  for (const e of index.entries) {
    const dist = Math.min(distance(short, e.short), distance(long, e.long));
    if (dist > limit || dist > best) continue;
    if (dist < best) { best = dist; labels.clear(); }
    labels.add(e.label);
  }
  return labels.size === 1 ? [...labels][0] : undefined;
}

// ─── Chords: inversions, roots ──────────────────────────────────────────────

const POSITION_NAMES: Record<string, string> = { root: "Root Position", "1": "1st Inversion", "2": "2nd Inversion", "3": "3rd Inversion" };
const ORDINAL_DIGIT: Record<string, string> = { "1st": "1", first: "1", "2nd": "2", second: "2", "3rd": "3", third: "3" };

const ORDINAL_POS = "1st|2nd|3rd|first|second|third|[0-3]";
const NOTE_PC: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// Chord tones (semitones above the root) of the qualities that have inversion exercises
const CHORD_TONES: Record<string, number[]> = {
  Major: [0, 4, 7], Minor: [0, 3, 7], "Dominant 7th": [0, 4, 7, 10], "Major 7th": [0, 4, 7, 11], "Minor 7th": [0, 3, 7, 10],
};
// "7/3" = bass is the chord's 3rd = 1st inversion
const BASS_DEGREE_POS: Record<string, string> = { "1": "root", "3": "1", b3: "1", "5": "2", "7": "3", b7: "3" };

function pitchClass(note: string): number {
  let v = NOTE_PC[note[0].toLowerCase()];
  for (const ch of note.slice(1)) v += ch === "#" ? 1 : -1;
  return (v + 12) % 12;
}

function positionLabel(index: Index, quality: string, position: string): string | undefined {
  if (!POSITION_NAMES[position]) return undefined;
  const candidate = `${quality} - ${POSITION_NAMES[position]}`;
  // Triads have no "Root Position" exercise of their own, but it is still a real choice there
  return index.vocab.has(candidate) || (position === "root" && index.vocab.has(quality)) ? candidate : undefined;
}

/**
 * "<quality> - <position>" typed loosely. Accepted position styles after the chord quality:
 *  "dom7 1st inv", "maj7 root position", "7 inv2", "m7 3", "maj7 first", "7 r"   (position words / number)
 *  "7/3", "m7/b3", "maj7/5", "7/7"                                               (slash + bass degree)
 *  "C/E", "G7/B", "Dm7/F", "Cmaj7/B"                                              (slash chord: bass note)
 */
function resolveInversion(index: Index, text: string): string | undefined {
  const t = prep(text).replace(/\s+/g, " ").trim();

  const slash = t.match(/^(.*?)\s*\/\s*([A-Ga-g][#b]?|b?[1-7])$/);
  if (slash && slash[1]) {
    const [, left, bass] = slash;
    if (/^[A-Ga-g][#b]?$/.test(bass)) {
      const m = left.match(/^([A-Ga-g][#b]?)\s*(.*)$/);
      if (!m) return undefined;
      const quality = m[2] ? resolveByKey(index, m[2], false) : "Major";
      const tones = quality && CHORD_TONES[quality];
      if (!tones) return undefined;
      const at = tones.indexOf((pitchClass(bass) - pitchClass(m[1]) + 12) % 12);
      return at < 0 ? undefined : positionLabel(index, quality, at === 0 ? "root" : String(at));
    }
    const position = BASS_DEGREE_POS[bass];
    const quality = position && resolveByKey(index, left, true);
    return quality ? positionLabel(index, quality, position) : undefined;
  }

  const forms: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/^(.*?)[\s,\-]*(?:inversion|inv|position|pos)\.?\s*(1st|2nd|3rd|first|second|third|[0-3])$/i, (m) => m[2]],
    [new RegExp(String.raw`^(.*?)[\s,\-]*(${ORDINAL_POS})\s*(?:inversion|inv|position|pos)\.?$`, "i"), (m) => m[2]],
    [/^(.*?)[\s,\-]*(root)(?:\s*(?:position|pos))?$/i, () => "root"],
    [/^(.*?)[\s,]+r$/i, () => "root"],
    [new RegExp(String.raw`^(.*?)[\s,]+(${ORDINAL_POS})$`, "i"), (m) => m[2]],
  ];
  for (const [re, pick] of forms) {
    const m = t.match(re);
    if (!m || !m[1].trim()) continue;
    const raw = pick(m).toLowerCase();
    const position = raw === "root" ? "root" : (ORDINAL_DIGIT[raw] ?? raw);
    const quality = resolveByKey(index, m[1], true);
    const hit = quality && positionLabel(index, quality, position === "0" ? "root" : position);
    if (hit) return hit;
  }
  return undefined;
}

/** Exact key lookup, then (chords/scales) again with a leading root note such as "C", "Bb" or "F#" removed. */
function resolveByKey(index: Index, text: string, allowRoot: boolean): string | undefined {
  const direct = lookup(index, keyOf(text));
  if (direct) return direct;
  if (!allowRoot) return undefined;
  const m = prep(text).match(/^([A-Ga-g](?:#|b)?)[\s:\-]*(.+)$/);
  return m ? lookup(index, keyOf(m[2])) : undefined;
}

// ─── Progressions ───────────────────────────────────────────────────────────

function progressionTokens(text: string): string[] {
  return text
    .replace(/♭/g, "b").replace(/♯/g, "#").replace(/M(?=\d)/g, "maj")
    .split(/[\s,>→|;\-–—]+/)
    .filter(Boolean);
}

function resolveProgression(vocabulary: string[], text: string): Resolution {
  const tokens = progressionTokens(text);
  if (tokens.length === 0) return { kind: "none" };
  const exact = tokens.join("|");
  const lower = exact.toLowerCase();
  const vocabTokens = vocabulary.map((l) => ({ label: l, joined: progressionTokens(l).join("|") }));

  const exactHit = vocabTokens.find((v) => v.joined === exact);
  if (exactHit) return { kind: "match", label: exactHit.label };

  // Exact case wins above; a case-insensitive match is only accepted when it's unambiguous (I vs i)
  const caseless = vocabTokens.filter((v) => v.joined.toLowerCase() === lower);
  if (caseless.length === 1) return { kind: "match", label: caseless[0].label };
  if (caseless.length > 1) return { kind: "none" };

  const limit = threshold(lower.length >= 12 ? 8 : lower.length);
  let best = Infinity;
  let bestLabel: string | undefined;
  let ties = 0;
  for (const v of vocabTokens) {
    const dist = distance(lower, v.joined.toLowerCase());
    if (dist > limit || dist > best) continue;
    if (dist < best) { best = dist; bestLabel = v.label; ties = 1; } else ties++;
  }
  return bestLabel && ties === 1 ? { kind: "suggest", label: bestLabel } : { kind: "none" };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Resolves what the user typed to a canonical answer label.
 *  - "match":   understood; submit this label.
 *  - "suggest": probably a typo; offer this label, the user confirms.
 *  - "none":    not understood — the caller must not count this as a wrong answer.
 * A name known to the alias tables but absent from `vocabulary` (e.g. "ionian" when the category
 * has no Major) still matches: it's a real, wrong answer rather than a free retry.
 */
export function resolveAnswer(category: Category, text: string, vocabulary: string[]): Resolution {
  if (!text.trim()) return { kind: "none" };
  if (category === "progression") return resolveProgression(vocabulary, text);

  // A bare lowercase alteration ("b9", "#9b13", "b5") is shorthand for a dominant chord, not a root: "b9" means 7b9.
  // Uppercase "B9" still reads as a B root.
  if (category === "chord" && /^[b#♭♯](?:5|9|11|13)/.test(text.trim())) text = `7${text.trim()}`;

  const index = buildIndex(category, vocabulary);
  const allowRoot = category === "chord" || category === "scale";

  const hit = resolveByKey(index, text, allowRoot);
  if (hit) return { kind: "match", label: hit };

  if (category === "chord") {
    const inv = resolveInversion(index, text);
    if (inv) return { kind: "match", label: inv };
  }

  const guess = suggest(index, text);
  return guess ? { kind: "suggest", label: guess } : { kind: "none" };
}

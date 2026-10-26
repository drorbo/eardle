# Typed Answers (free-text mode) — Design Spec

## Problem

Hard and jazz exercises show 6–35 answer buttons, which makes them recognition
tasks ("which of these?") rather than recall tasks ("what is it?"). Advanced
players want to type the answer with no option list.

## Decisions (confirmed with the user, 2026-10-26)

- **Where:** practice mode only (`mode=practice`), on **every difficulty** (widened from hard/jazz-only on 2026-10-26 after the user tried it), all five categories. Not on the Daily (out of scope).
- **Input style:** smart typing + a live "recognized as" chip. No option list is ever shown. Unrecognized input is never counted as a wrong answer.
- **Approach A:** a pure, client-side normalizer with alias tables (no server round-trip per keystroke).

## Behavior

- A `Buttons | Type` switch appears above the answer area (only when eligible). Default Buttons; choice remembered in `localStorage` (`eardle-answer-mode`).
- Type mode replaces the choice grid with: a text input, a live chip, and a Submit button.
  - Input: `autocapitalize="off" autocorrect="off" spellCheck={false}`, `enterKeyHint="send"`, placeholder "Type your answer…", autofocus after the sound has played once.
  - Chip states: **recognized** (`maj7 → Major 7th`), **did you mean** (`Dorain → Dorian?`, Enter accepts), **not recognized** ("Not sure what that is — try e.g. “Dorian”"; Enter does nothing; no penalty), **empty** (nothing).
  - Enter / Submit sends the recognized label; disabled when nothing is recognized.
- The first play still unlocks answering (same `idle` → `ready` rule as buttons).
- The existing 1–9 answer shortcuts and Space-to-play are ignored while the input is focused (the key handler already skips `input` targets); Space inside the box types a space.
- On submit the flow is identical to a button answer: `handleSelect(label)` → session POST with the canonical label, streak, banner, explanation. After answering, the normal choice grid appears, coloured green/red, and the compare-answers previews work as built. The typed text is shown in the banner as the user's answer (the canonical label).
- A recognized label that is not this exercise's answer is simply wrong. A recognized label that is not even among this exercise's choices (e.g. typing "Ionian") is wrong too, with the banner showing what they typed as recognized.

## Matcher: `lib/answers/normalize.ts`

`resolveAnswer(category, text, vocabulary) → { kind: "match" | "suggest" | "none"; label?: string }`

1. **Pre-pass (case-sensitive, before lowercasing):** `M`+digit / `Maj`/`Δ`/`^` → "maj"; lowercase `m`+digit, `−`/`-`+digit, `min`, `mi` → "min"; `ø` → half-dim; `°` → dim; `+` → aug; `♯`→`#`, `♭`→`b`. This is what separates `m9` (Minor 9th) from `M9` (Major 9th) — a plain lowercase compare would conflate them.
2. **Key:** lowercase; drop spaces, hyphens, dots, parentheses, commas; ordinal suffixes after digits (`th/st/nd/rd`); word abbreviations (`major→maj, minor→min, dominant→dom, diminished→dim, augmented→aug`); number words (`first/second/third/ninth/tenth/eleventh/thirteenth`).
3. **Vocabulary keys:** the same key function is applied to every label in the category's vocabulary, so most abbreviations fall out for free (`Major 7th` → `maj7`, `Dominant 9th #11` → `dom9#11`).
4. **Per-category hand aliases** (`lib/answers/aliases.ts`, small, data-only) for what the key function can't derive: bare `7`/`9`/`13` → Dominant, `m7b5`/`min7b5`/`ø` → Half-Diminished, `mM7` → Minor-Major 7th, `6` → Major 6th, `alt` → Altered, `ionian`/`aeolian`/`natural minor`, intervals by name/number (`b9`, `m10`, `minor tenth`), notes with flats (`db` → `C#`, `Bb` → `A#`).
5. **Optional root prefix (chords & scales only):** `Cmaj7`, `D dorian`: tried only if the raw text didn't match; the prefix is stripped when the remainder is non-empty and matches. (`Dominant 7th` is tried raw first, so its leading "D" is never mistaken for a root.)
6. **Inversion chords:** parse `<quality> <position>` where position ∈ root / 1st / 2nd / 3rd (+ optional "inv(ersion)" / "position"); resolve quality through the chord table, then assemble `"<quality> - <position>"` and require it to exist.
7. **Progressions:** tokenize roman numerals (`b|♭|#|♯`? `VII…i` + suffix such as `7`, `maj7`, `m7b5`, `b9`) from separators of any kind (` - `, spaces, commas, `>`, `→`). Compare token lists with the vocabulary's. Exact-case match first (`I` ≠ `i`); if none, case-insensitive match accepted only when unique.
8. **Typo fallback:** if no exact key matches, a label whose key is within Levenshtein distance 1 (2 when the key is ≥ 8 chars) and is the single closest → `suggest`.
9. A label recognized by the alias tables but absent from the category vocabulary (e.g. `Ionian`) still returns `match` — it is a known name, so it is a real (wrong) answer, not a free retry.

## Vocabulary source

The client needs the category's vocabulary. `[id]/page.tsx` passes `answerVocabulary: string[]` (distinct `answer`s of that category, all difficulties) — larger than the exercise's own choices, so it reveals nothing about the right answer. One `SELECT DISTINCT` per page load.

## Components

| Unit | Role |
|---|---|
| `lib/answers/normalize.ts` | pure matcher (spec above) |
| `lib/answers/aliases.ts` | data: hand aliases per category |
| `lib/answers/normalize.test.ts` | unit tests (`npm run test:answers`) |
| `components/exercise/TypedAnswer.tsx` | input + chip + submit; props `{ category, vocabulary, disabled, onSubmit(label) }` |
| `components/exercise/AnswerModeSwitch.tsx` | `Buttons | Type` segmented control (or inline in the player if tiny) |
| `ExercisePlayer.tsx` | gating (practice + hard/jazz), mode state/persistence, swaps grid for `TypedAnswer` until answered |
| `[id]/page.tsx`, `ExercisePlayerWrapper.tsx` | pass `answerVocabulary` |

## Testing

- **Unit:** every real answer in the DB (hard+jazz+all) resolves to itself via its own label, its key, and a hand-written set of common spellings per category (≥3 each): chords (`maj7`, `Cmaj7`, `dom7`, `7`, `m7b5`, `ø`, `7#9`), scales (`dorian`, `Dorain`→suggest), intervals (`m9` vs `M9`), progressions (`ii v i`, `ii7-V7-Imaj7`, `iim7b5 V7b9 im7`), notes (`db`, `C♯`). Plus negative cases: nonsense → `none`; `m9` never resolves to Major 9th.
- **Browser checkpoint** (project rule): mobile 390px + desktop; mobile keyboard doesn't hide the chip/submit; console clean; Lighthouse accessibility pass; verify answering via type sends the canonical label to `/api/sessions` and the compare grid appears after.

## Out of scope

Daily Eardle, voice input, hints, retries after a wrong typed answer, slash-chord notation (`C/E`).

## Risks

- Alias gaps: some valid spellings will land in "not recognized". Mitigated by free retries, and by logging nothing sensitive; add aliases as users report them.
- Case-sensitivity is the sharpest edge (`m`/`M`, `I`/`i`) — covered by explicit tests.
- Mobile keyboards: the chip must stay above the keyboard; checked in the checkpoint.

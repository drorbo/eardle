# Compare Answers — Design Spec

## Problem

After answering an exercise, the user sees right/wrong but can only re-hear the
*correct* sound (the main Play button). To learn the difference they want to hear
what the *other* options sounded like, played the same way as the question.

## Decisions (confirmed with the user, 2026-10-26)

- **Scope:** regular exercise player (all 5 categories) **and** Daily Eardle (after the puzzle is finished).
- **Fair A/B:** a tapped option plays with the question's own root / octave / voicing / play-mode / key / speed, so only the answer differs.
- **Every choice is playable after answering**, including the correct one.

## Behavior

Once the exercise is answered (Daily: status won/lost):

- Every choice button becomes a "preview" button: tapping it plays that option. A small ▶ icon on the button signals this; the tapped button shows a playing state while audio runs.
- Colors (green correct / red picked-wrong) are unchanged.
- Tapping again restarts the sound (same restart-on-replay rule as the main Play button).
- Keys 1–9 preview the matching choice once answered (they currently do nothing after answering).
- The staff notation under the answer keeps showing the *question's* notes; previews don't change it.
- A short caption above the grid after answering: "Tap any option to hear it".

## Two facts from the code that shape the design

1. **Choices are plain label strings** ("Dorian", "Major 7th", "ii - V - I"). There is no label→sound mapping. Rather than hand-parse names (progressions would need roman-numeral parsing, chords have ~50 labels), resolve each label to the `config` of an existing exercise in the same category whose `answer` equals the label. Prefer the same difficulty, else lowest id. The correct choice uses the exercise's own config. A choice with no matching exercise is simply not playable (no ▶ icon).
2. **The choice grid is currently still live after answering** — clicking a choice re-runs `handleSelect` and re-POSTs `/api/sessions`. Making choices preview-only after answering fixes this as a side effect.

## Resolver output

`ChoiceVariants = Record<choiceLabel, ExerciseConfig>`

Built server-side in a new `lib/exercises/choiceVariants.ts`:
`getChoiceVariants(exercise)` — one query: exercises where `category = X AND answer IN choices`.

### Playback per category (new `playVariant` in `useAudio`)

Uses the cached `randomizedRef` of the question, never mutates it, never touches `playedNotes`.

| Category | Uses from the question | From the variant config |
|---|---|---|
| note | octave of the played root | `note` name |
| interval | `noteA`, last played mode (incl. melodic-down) | `semitones` |
| chord | root, voicing (falls back to `close` if the voicing is invalid for the variant's note count — e.g. `wide` on a triad), bass/arpeggio buttons are not applied | `type`, `inversion` |
| scale | root, speed level | `type` |
| progression | `delta` transposition, speed level | `chords`, `tempo` |

If the question was never played (can't happen after answering — you must play to unlock choices — but guarded): use fresh `generatePerformanceParams`.

## Daily Eardle: no answer leak

The daily payload deliberately hides the answer until the puzzle is over. A
label→config map shipped with the puzzle would leak it (the entry equal to the
puzzle's own config is the answer). So for Daily, variants are fetched **after the
puzzle is finished** from a new `GET /api/daily/variants` endpoint, which verifies
for the caller's identity (user id or guest token, same way `/api/daily/guess`
does) that today's attempt is `won`/`lost` before returning anything.

For the regular exercise player the answer is already in the client payload, so
variants are computed in `page.tsx` and passed down as a prop (no extra request).

## Out of scope

- Updating the staff notation to the previewed option.
- Previewing during the Daily's in-progress guesses (would give away wrong options' sounds mid-game; wrong guesses are already visible, but hearing eliminated options is a different feature).
- Per-choice speed/mode controls beyond the question's own settings.

## Risks

- Custom-package sessions replace `choices` with deduped answers — resolver works from the *displayed* choices, so it still works.
- Duplicate answers across difficulties with different configs (e.g. same "Major" chord in inversion vs voicing exercises): the same-difficulty preference handles the common case; edge cases fall back to lowest id.
- Hydration/mobile: icon must not shrink the 44px tap target; verify at 390px and desktop.

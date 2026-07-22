# Curriculum Outline (Research Draft)

Proposed topic sequence for a Lessons feature, from absolute beginner through
everything needed to make full use of Eardle's five practice categories
(Note ID, Intervals, Chords, Progressions, Scales) across all four difficulty
tiers (easy/medium/hard/jazz). This is a sequencing proposal only — no UI or
content-format decisions are made here.

## How real courses order this material (and why)

A few consistent patterns showed up across musictheory.net, teoria.com,
Musicca, college aural-skills sequences (e.g. the four-semester model
described in aural-skills programs and in textbooks like *The Musician's
Guide to Aural Skills*), and dedicated ear-trainer apps (EarMaster, Complete
Ear Trainer):

- **Notation/vocabulary fundamentals come before any ear work.** You need the
  musical alphabet, octave numbering, and accidentals as a shared vocabulary
  before "identify this note" or "identify this interval" means anything.
- **Scale-degree / functional hearing is introduced before raw interval
  drilling.** Karpinski's (2000) research, cited widely in aural-skills
  pedagogy, found that training students to hear scale degrees inside a key
  (do-mi-sol as a functional unit) builds relative pitch faster than jumping
  straight to naming isolated intervals ("major third", "perfect fifth").
  Most colleges teach movable-do scale-degree hearing alongside or just
  before formal interval-quality training for this reason.
- **Major scale and key signatures are taught via the circle of fifths as a
  single connected idea**, not as separate memorization tasks — each new
  key signature is understood as "a fifth away from the last one," which
  simultaneously teaches key signatures and reinforces the perfect-fifth
  interval.
- **Interval recognition is scaffolded with reference-song association**
  before students are expected to recognize intervals "cold." This is
  near-universal across ear-training material (Musical U, TalkingBass,
  various interval-mnemonic guides): each interval, ascending and
  descending, gets an anchor song (e.g. descending minor third ~ "Hey
  Jude"), and the song crutch is intentionally faded out with practice.
- **Chords build on intervals, not the other way around** — triads are
  taught as "two stacked intervals" (e.g. major = major 3rd + minor 3rd)
  so students transfer interval-recognition skill directly into chord
  quality recognition, rather than learning chords as an unrelated new skill.
- **Inversions and extended/seventh chords come after root-position triads
  are solid**, and functional harmony (roman numerals, tonic/subdominant/
  dominant) comes after chords but before progressions, since progressions
  are essentially "roman numerals in time."
- **Modes and symmetric/jazz scales are pushed late** in every curriculum
  surveyed — they depend on comfort with the major scale, minor scales, and
  functional hearing, and are usually the last thing introduced even in
  dedicated ear-training apps (Complete Ear Trainer's own leveling puts
  modes/exotic scales in its highest tier).

## Proposed sequence

Each entry: **Topic** — prerequisites — connects to (Eardle category / tier).

### Tier 0: Absolute fundamentals (no ear training yet)
1. **Musical alphabet & octaves** — none — prerequisite only (feeds Note ID).
2. **Note reading / staff basics** — musical alphabet — prerequisite only
   (Eardle is ear-first, but a minimal reading primer helps users interpret
   answer choices and any notation shown in explanations).
3. **Accidentals & enharmonic equivalence** (C# = Db) — musical alphabet —
   Note ID (easy tier uses natural notes only; medium/hard introduce
   accidentals, per `CATEGORY_TOPICS.note`).
4. **Semitones & whole tones** (the atomic unit of distance) — accidentals —
   prerequisite for Intervals; also explains octave math.

### Tier 1: Hearing pitch in context
5. **Scale degrees & movable-do hearing** (do-re-mi as function, not
   absolute pitch) — semitones/whole tones — prerequisite for Intervals
   and Progressions; this is the "hear tonic gravity" skill underlying the
   whole app.
6. **Major scale construction** (W-W-H-W-W-W-H) — scale degrees — Scales
   (easy: major modes topic, specifically Ionian).
7. **Key signatures & circle of fifths** — major scale — prerequisite for
   Scales/Progressions topic labels ("Diatonic", "Modal") and useful
   context for chord-spelling explanations, though Eardle drills degrees
   by ear rather than by key-signature reading.
8. **Minor scales: natural, harmonic, melodic** — major scale — Scales
   (medium tier, "Minor" topic).

### Tier 2: Intervals
9. **Interval naming & quality** (number + quality: major/minor/perfect/
   augmented/diminished) — semitones, major scale — Intervals (easy:
   unison–5th per `IntervalConfig`/topic split in code).
10. **Interval ear-recognition via reference songs** — interval naming —
    Intervals (easy → medium, the –octave range); this is the practice
    technique itself, not just a topic, so it should be woven into every
    interval lesson rather than taught once.
11. **Compound intervals** (9th, 10th, etc., beyond the octave) — simple
    intervals — Intervals (hard tier, up to decima per code comments).

### Tier 3: Chords
12. **Triad construction as stacked intervals** (major/minor/diminished/
    augmented) — interval quality — Chords (easy: major/minor/diminished/
    augmented families).
13. **Seventh chords** (major7, minor7, dominant7, half-diminished,
    diminished7) — triads — Chords (medium/hard: dominant, altered,
    suspended families).
14. **Chord inversions** — triads/sevenths — Chords ("Inversions" topic,
    per `ChordConfig.inversion`).

### Tier 4: Harmony in time
15. **Functional harmony basics**: roman numerals, tonic/subdominant/
    dominant, the leading tone's pull to tonic — scale degrees, triads —
    prerequisite for Progressions; also deepens why certain intervals/
    chords "want" to resolve, aiding ear recognition of dominant-function
    sounds.
16. **Common progressions**: pop/rock (I–V–vi–IV type loops), diatonic
    sequences, 12-bar blues — functional harmony — Progressions (easy/
    medium: "Pop/Rock", "Diatonic", "Blues" topics).
17. **Minor-key & modal progressions** — functional harmony, minor scales
    — Progressions ("Minor Keys", "Modal/Chromatic" topics).
18. **Jazz ii–V–I and extended harmony** — seventh chords, functional
    harmony — Progressions ("Jazz" topic) and Chords/jazz difficulty tier.

### Tier 5: Modes & advanced scales (taught last, per every source surveyed)
19. **Modes of the major scale** (Dorian, Phrygian, Lydian, Mixolydian,
    Locrian) as rotations of a known scale — major scale, functional
    harmony — Scales ("Major Modes" topic).
20. **Pentatonic & blues scales** — major/minor scales — Scales
    ("Pentatonic & Blues" topic); can actually be introduced earlier
    (they're simpler than full 7-note modes) as an easier win, but is
    grouped here because blues-scale *function* connects to blues
    progressions taught in tier 4.
21. **Melodic minor modes** (jazz melodic minor and its modes, e.g.
    Lydian dominant, altered scale) — harmonic/melodic minor, modes —
    Scales ("Melodic Minor Modes" topic), Chords/Progressions jazz tier.
22. **Whole tone & diminished (symmetric) scales** — modes, melodic minor
    modes — Scales ("Symmetric Scales" topic), the most advanced/last
    topic in the outline, matching where every surveyed app and course
    places symmetric/"exotic" scales.

## Summary mapping table

| Eardle category | Easy tier draws on | Medium/Hard draws on | Jazz tier draws on |
|---|---|---|---|
| Note ID | Musical alphabet, natural notes | Accidentals, enharmonics | — |
| Intervals | Semitones, interval naming, reference-song method | Compound intervals | — |
| Chords | Triad construction | Sevenths, inversions | Altered/extended chords |
| Progressions | Functional harmony, pop/diatonic progressions | Minor-key, modal progressions | ii-V-I, jazz harmony |
| Scales | Major scale, major modes intro | Minor scales, pentatonic/blues | Melodic minor modes, symmetric scales |

## Sources
- Karpinski, G. (2000), *Aural Skills Acquisition* — cited via aural-skills pedagogy discussions on tonal vs. interval-first training: https://musictheorymaterials.utk.edu/aural-skills-2-note-pitch-patterns-intervals
- Movable-do / functional hearing pedagogy: https://www.the-maestro-online.com/blog/solfege-vs-harmony-a-research-driven-comparison-of-the-worlds-greatest-ear-training-methods/
- Circle of fifths as unifying structure for key signatures + intervals: https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/, https://www.musical-u.com/learn/how-to-use-circle-fifths/
- Interval reference-song method: https://www.musical-u.com/learn/interval-reference-songs-that-youve-actually-heard-of/, https://cognitivetrain.com/interval-mnemonics/
- College aural-skills sequencing (four-semester model, fundamentals-first): https://iastate.pressbooks.pub/majoringinmusic/chapter/aural-skills/
- Complete Ear Trainer's own leveling (modes/exotic scales pushed to highest tier): https://completeeartrainer.com/
- musictheory.net / Musicca general lesson-then-exercise structure: https://www.musictheory.net/lessons, https://www.musicca.com/lessons

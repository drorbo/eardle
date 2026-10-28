# Typed-answer parsing table

Generated from `lib/answers/normalize.ts` + `aliases.ts` by resolving candidate inputs. Matching is case-insensitive except where noted; spaces, `-`, `.`, `,` `(` `)` are ignored; ♯/♭ = #/b; ordinal suffixes (7th, 2nd) are dropped; major/minor/dominant/diminished/augmented/suspended may be abbreviated.

## note

| Answer | Accepted inputs |
|---|---|
| C | `c` `c natural` |
| C# | `c sharp` `C♯` `db` `Db` `d flat` |
| D | `d natural` |
| D# | `eb` `e flat` `d sharp` |
| E | `e natural` |
| F | `f natural` |
| F# | `gb` `g flat` `f sharp` |
| G | `g natural` |
| G# | `ab` `a flat` `g sharp` |
| A | `a natural` |
| A# | `bb` `b flat` `a sharp` |
| B | `b natural` |

## interval

| Answer | Accepted inputs |
|---|---|
| Unison | `p1` `perfect unison` `same note` |
| Minor 2nd | `m2` `b2` `minor second` `half step` `semitone` |
| Major 2nd | `M2` `major second` `whole step` `whole tone` |
| Minor 3rd | `m3` `b3` |
| Major 3rd | `M3` |
| Perfect 4th | `P4` `p4` `4th` `perf 4` `4` |
| Tritone | `TT` `b5` `#4` `tt` `aug4` `dim5` `augmented fourth` `diminished fifth` |
| Perfect 5th | `P5` `perfect fifth` `fifth` `5th` `p5` `perf 5` `5` |
| Minor 6th | `m6` `b6` |
| Major 6th | `M6` |
| Minor 7th | `m7` `b7` |
| Major 7th | `M7` |
| Octave | `P8` `p8` `8` `8ve` `perfect octave` |
| Minor 9th | `m9` `b9` |
| Major 9th | `M9` |
| Minor 10th | `m10` `b10` |
| Major 10th | `M10` |

## chord

| Answer | Accepted inputs |
|---|---|
| Major | `maj` `M` `Δ` `major triad` `maj triad` |
| Minor | `min` `m` `minor triad` `min triad` |
| Dominant 7th | `dom7` `7` `dominant 7` `dom` `Bb7` `dominant seventh` `dominant` |
| Diminished | `dim` `°` |
| Major 7th | `maj7` `M7` `Δ7` `^7` `ma7` `Cmaj7` `major seventh` |
| Minor 7th | `min7` `m7` `-7` `mi7` `minor seventh` |
| Augmented | `aug` `+` |
| Diminished 7th | `dim7` `°7` `dim 7` `diminished seventh` |
| Half-Diminished | `m7b5` `ø` `ø7` `half dim` `min7b5` `half diminished` `half dim 7` |
| Major 9th | `maj9` `M9` |
| Minor 9th | `m9` `min9` |
| Major 6th | `maj6` `M6` `6` |
| Minor 6th | `m6` `min6` |
| Sus4 | `sus` `sus4` `suspended` `suspended 4` `sus 4` |
| Sus9 | `sus9` |
| Major add2 | `add2` `add9` `add 2` |
| Major add4 | `add4` `add 4` |
| Major - 1st Inversion | `C/E` |
| Major - 2nd Inversion | `major second inversion` |
| Minor - 1st Inversion | `m 1st inv` `Cm/Eb` |
| Minor - 2nd Inversion | — |
| Dominant 7th - Root Position | `7 r` |
| Dominant 7th - 1st Inversion | `dom7 1st inv` `7/3` `G7/B` |
| Dominant 7th - 2nd Inversion | `7 inv2` |
| Dominant 7th - 3rd Inversion | `7/7` |
| Major 7th - Root Position | `maj7 root position` |
| Major 7th - 1st Inversion | `maj7 first` |
| Major 7th - 2nd Inversion | `maj7/5` |
| Major 7th - 3rd Inversion | `Cmaj7/B` |
| Minor 7th - Root Position | — |
| Minor 7th - 1st Inversion | `m7/b3` `Dm7/F` |
| Minor 7th - 2nd Inversion | — |
| Minor 7th - 3rd Inversion | `m7 3` |
| Major 7th #11 | `maj7#11` `M7#11` |
| Major 6/9 | `6/9` `69` `6add9` |
| Major 13th | `maj13` `M13` |
| Augmented Major 7th | `maj7#5` `+maj7` `maj7+5` `aug maj7` |
| Major 9th #11 | — |
| Minor 11th | `m11` `min11` |
| Minor 13th | `m13` |
| Minor-Major 7th | `mM7` `m(maj7)` `mmaj7` `mm7` `min/maj7` `min maj7` `m maj7` |
| Minor-Major 9th | `mM9` `mm9` `mmaj9` `m(maj9)` `min maj9` |
| Dominant 9th | `9` `B9` |
| Dominant 13th | `13` |
| Dominant 7th #11 | `7#11` `#11` |
| Dominant 9th #11 | `9#11` |
| Dominant 13th #11 | `13#11` |
| 7♯9 | `7#9` `#9` |
| 7♭9 | `7b9` `b9` |
| 7♭13 | `7b13` `b13` |
| 7♭9♭13 | `7b9b13` `b9b13` |
| 7♯9♭13 | `7#9b13` `#9b13` |
| 7♭9♯11 | `7b9#11` `b9#11` |
| 7♯9♯11 | `7#9#11` `#9#11` |
| Augmented 7th | `aug7` `+7` `7#5` `7+5` `#5` |
| Dominant 7th ♭5 | `7b5` `b5` `dom7b5` |
| 7sus4 | — |
| 9sus4 | — |
| 13sus4 | — |

## progression

Roman numerals, any separator (space, `-`, `,`, `>`, `→`, `|`). Exact case wins; otherwise case-insensitive if unique. `M7`→maj7, ♭/♯ accepted. Typos → suggestion. Every label above is accepted verbatim.

Labels: `iv7 - bVII7 - Imaj7`, `im7 - im7 - bIIm7 - bIIm7`, `iim7b5 - V7b9 - im7`, `I - VI7 - ii - V7`, `bIII - bVI - bII - V`, `i - iv - V7 - i`, `ii - IV - I - V`, `ii7 - V7 - Imaj7`, `iii7 - VI7 - ii7 - V7`, `Imaj7 - IVmaj7 - iii7 - VI7`, `I7 - IV7 - I7 - V7`, `I - bVI - bVII - I`, `im7 - bVII7 - bVI7 - V7`, `I - IV - V`, `I - V - vi - IV`, `ii - V - I`, `I - IV - V - I`, `i - iv - v - i`, `Imaj7 - bVImaj7 - bIImaj7 - V7`, `I - vi - IV - V`

## scale

| Answer | Accepted inputs |
|---|---|
| Major | `major` `ionian` `major scale` |
| Minor Scale | `minor` `natural minor` `aeolian` `nat minor` `min` |
| Harmonic Minor | `harmonic minor` `harm minor` `harmonic min` |
| Blues | `blues` `blues scale` `minor blues` |
| Pentatonic Major | `pentatonic` `major pentatonic` `maj pentatonic` `major penta` |
| Mixolydian | `mixolydian` |
| Dorian | `dorian` `D dorian` `dorian scale` |
| Phrygian | `phrygian` |
| Locrian | `locrian` |
| Lydian | `lydian` |
| Lydian Dominant | `lydian b7` `lydian dominant` `acoustic` `lydian ♭7` `overtone` `mixolydian #4` `lydian flat 7` |
| Altered | `altered` `alt` `super locrian` `altered scale` `superlocrian` `diminished whole tone` |
| Melodic Minor | `melodic minor` `jazz minor` `melodic min` `ascending melodic minor` |
| Whole-Half Diminished | `whole half` `whole half diminished` `wh diminished` `diminished whole half` `wh dim` |
| Lydian Augmented | `lydian #5` `lydian aug` `lydian ♯5` |
| Mixolydian ♭6 | `mixolydian b6` `hindu` `mixolydian flat 6` |
| Whole Tone | `whole tone` `wholetone` `whole-tone` |
| Dorian ♭2 | `dorian b2` `phrygian #6` `dorian flat 2` |
| Locrian ♯2 | `locrian #2` `aeolian b5` `half diminished scale` `locrian sharp 2` |
| Half-Whole Diminished | `half whole` `dominant diminished` `half whole diminished` `hw diminished` `diminished half whole` `hw dim` |
- Inversion shorthand, all equivalent for "Dominant 7th - 1st Inversion": `dom7 1st inv`, `7 inv1`, `7 1`, `7 first`, `7/3` (bass degree), `G7/B` (slash chord, bass note).
  Position words: `1st/2nd/3rd` or `first/second/third` or `1/2/3`, optionally followed by `inv`/`inversion`/`position`, or preceded by `inv`. Root position: `root`, `root position`, `r`, `0`.
  Slash degrees: `/3` or `/b3` = 1st inversion, `/5` = 2nd, `/7` or `/b7` = 3rd. Slash chords: `C/E`, `Cm/Eb`, `G7/B`, `Dm7/F`, `Cmaj7/B`; the bass note is mapped to the chord tone it is.
  An inversion that doesn't exist for that chord (`m 3`, `C/D`) is not guessed.

# Pedagogy Notes (Research Draft)

Notes on *how* effective ear-training/theory content is delivered — drawn
from patterns observed across musictheory.net, Musicca, teoria.com,
EarMaster, Complete Ear Trainer, GNU Solfege, Functional Ear Trainer/Tenuto,
newer spaced-repetition apps (ToneSeed, Trichord Trainer, EarWise, Hear'n'Play),
and college aural-skills pedagogy discussions. General patterns only —
no text is quoted from any source.

## Audio embedded directly in explanations, not bolted on after

Every effective ear-training resource puts a playable audio example inline
with the concept being explained, right at the point of reading, rather
than making the learner finish reading first and then go find a separate
"exercise" page. EarMaster's lesson format is explicit about this: each
lesson intro is split into a description pane and an audio/visual example
pane shown side by side. The practical implication for a lesson page is that
static text about "a major third sounds bright, a minor third sounds sad"
is close to worthless without a click-to-hear example sitting right next
to that sentence.

## Comparison-based (A/B) listening is a recurring, high-value pattern

Multiple sources emphasize hearing contrasting sounds back-to-back rather
than in isolation — major vs. minor triad, ascending vs. descending
interval, natural vs. harmonic minor. This matches general
psychoacoustic learning advice and is baked into how EarMaster and
Complete Ear Trainer structure "compare" drill types before moving to
cold identification. A lesson on a concept that has a natural opposite
(major/minor, perfect/augmented, consonant/dissonant) reads better when the
opposite is demonstrated immediately, not introduced chapters later.

## Mnemonic / reference-song anchoring, with an explicit fade-out

The interval reference-song technique (already summarized in
`curriculum-outline.md`) is the single most consistent teaching device
found across ear-training material. Two details matter for a real
implementation:
- Direction matters — ascending and descending versions of the same
  interval need separate reference songs, since they don't sound
  equivalent to a learner.
- The song is explicitly a training wheel. Sources are consistent that the
  goal is to stop needing the song and recognize the interval directly;
  material that treats the mnemonic as the permanent answer (rather than a
  scaffold to fade) undersells the skill. Lesson copy should say this
  outright, so users don't feel behind when they still need the crutch.

## Spaced repetition / gradual difficulty ramp

Newer ear-training apps (ToneSeed, Trichord Trainer, EarWise) increasingly
use spaced-repetition-style scheduling (SM-2-like or FSRS-based) on top of
their drills: items answered correctly repeatedly get spaced further apart,
weak items resurface sooner. The general finding cited (Bjork & Bjork,
1992) is that review scheduled near "the edge of forgetting" is more
effective than either cramming or under-reviewing. For a lessons feature,
the actionable takeaway is less about building a full spaced-repetition
engine and more about the general shape: a lesson's practice should start
easy/narrow (e.g. only 2-3 interval choices) and widen as the learner
succeeds, rather than dropping them into the full difficulty tier
immediately after reading.

## Immediate practice after each concept, not batched at the end

EarMaster's and Musicca's lesson formats both interleave short instruction
with an immediately-following drill on that exact concept, rather than
teaching five concepts and then quizzing on all five. The aural-skills
research consulted specifically warns against over-intellectualizing
concepts before ear practice starts — theory and ear training are meant to
be learned in tandem from the beginning, not theory-then-ear-training as
two sequential phases.

## Common misconceptions worth calling out explicitly per topic

Patterns that showed up repeatedly enough to be worth baking into lesson
copy as explicit "don't worry about this yet" callouts:
- **Intervals**: learners often feel they need to memorize interval
  *spelling* in every key (e.g. "a major third below C is Ab") before they
  can practice ear recognition — sources explicitly say this isn't a
  prerequisite for the ear skill and conflating the two slows people down.
- **Intervals (motivation)**: interval training taught as a dry abstract
  labeling exercise, disconnected from "why," is a commonly cited reason
  students disengage — tying every interval back to real songs/reference
  points keeps it concrete.
- **General theory sequencing**: jumping into complex chords/modes/jazz
  harmony before the musical alphabet, key signatures, and basic note
  values are solid is a commonly flagged beginner mistake — reinforces the
  fundamentals-first ordering in the curriculum outline.
- **Rote memorization without the "why"**: memorizing that a major chord
  is "root, major 3rd, perfect 5th" without connecting it back to the
  *sound* of stacked intervals is called out as a shallow-learning trap —
  lessons should keep deriving new concepts from prior ear-verified ones
  rather than presenting new formulas as facts to memorize.
- **Ear training in isolation from reading/singing**: some aural-skills
  material warns against training "recognize by ear" as a totally separate
  skill from sight-singing/dictation — less directly relevant to Eardle
  (which is recognition-only, no singing), but worth noting as a known gap
  in pure multiple-choice ear-training tools generally.

## Text-to-interactivity ratio: keep prose short, front-load audio

Across every site surveyed (musictheory.net in particular is frequently
praised for being "clean and intuitive... jump right into lessons or
drills") the pattern is short instructional text (a paragraph or a few
bullet points) paired with an immediately playable/interactive example,
not long-form reading. Musicca's own framing of its lesson library
emphasizes "bite-sized" lessons with instant feedback. The implication for
lesson design: treat each lesson as "one idea, one or two sentences of
framing, then an interactive/audio example the user manipulates
themselves," rather than a textbook-style chapter.

## Progress visibility

EarMaster's exercise UI uses a simple color-coded progress strip (grey =
upcoming, blue = current, green = correct, red = incorrect) so learners
always know how far into a lesson/drill they are and how they're doing in
real time. Musicca similarly foregrounds progress tracking as a core
feature (save results, track progress over time). This is a navigation/UX
pattern more than a teaching technique, but it recurred often enough to
flag: learners want constant, lightweight feedback on where they are in a
sequence, not just a final score.

## Sources
- EarMaster lesson/module structure and progress-strip UI:
  https://www.earmaster.com/support/earmaster-cloud/guides-for-students.html,
  https://www.earmaster.com/download/EarMaster%206%20User%20Guide.pdf
- Musicca bite-sized lessons + progress tracking:
  https://www.musicca.com/lessons, https://www.musicca.com/online-music-theory-course
- musictheory.net's minimal-friction, jump-right-in design:
  https://musicalwonders.substack.com/p/musictheorynet-a-simple-flexible
- Interval reference-song technique and its fade-out framing:
  https://www.musical-u.com/learn/interval-reference-songs-that-youve-actually-heard-of/,
  https://cognitivetrain.com/interval-mnemonics/
- Spaced repetition / adaptive difficulty in modern ear-training apps:
  https://github.com/abeage1/earwise, https://toneseed.app/,
  https://trichordtrainer.com/
- Bjork & Bjork "desirable difficulty" / edge-of-forgetting framing, as
  cited in spaced-repetition app design discussions:
  https://training.safetyculture.com/blog/spaced-repetition/
- Common student misconceptions in intervals and theory generally:
  https://www.musical-u.com/learn/ultimate-guide-to-interval-ear-training/,
  https://www.musiciansaddition.com/post/10-common-music-theory-mistakes-students-make-and-how-to-avoid-them
- Karpinski / tonal vs. interval-first pedagogy, and theory-and-ear-training
  taught in tandem rather than sequentially:
  https://musictheorymaterials.utk.edu/aural-skills-2-note-pitch-patterns-intervals
- Complete Ear Trainer's "master before advancing" drill philosophy:
  https://completeeartrainer.com/

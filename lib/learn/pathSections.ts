// The Learning Path view groups all 30 topics under these 6 curriculum tiers
// (matching docs/lessons-planning/curriculum-outline.md exactly, as verified
// against the live seeded topic sortOrder). A hardcoded constant, same
// "constant drives grouping" pattern as LEARN_CATEGORY_ORDER in
// lib/learn/categoryMeta.ts — cheaper and less error-prone than a new schema
// column for something that only changes when the curriculum itself changes.
export interface PathSection {
  label: string;
  topicSlugs: string[];
}

export const PATH_SECTIONS: PathSection[] = [
  {
    label: "Fundamentals",
    topicSlugs: ["musical-alphabet", "note-reading-staff-basics", "accidentals-enharmonic-equivalence", "semitones-and-whole-tones"],
  },
  {
    label: "Hearing Pitch in Context",
    topicSlugs: ["scale-degrees-movable-do", "major-scale-construction", "key-signatures-circle-of-fifths", "minor-scales"],
  },
  {
    label: "Intervals",
    topicSlugs: ["interval-naming-quality", "consonance-and-dissonance", "interval-reference-songs", "compound-intervals"],
  },
  {
    label: "Chords",
    topicSlugs: [
      "triad-construction",
      "seventh-chords",
      "sixth-chords",
      "suspended-added-tone-chords",
      "extended-chords",
      "chord-inversions",
      "chord-voicings-playback",
    ],
  },
  {
    label: "Harmony in Time",
    topicSlugs: [
      "functional-harmony-basics",
      "cadences",
      "common-progressions",
      "secondary-dominants",
      "minor-key-modal-progressions",
      "altered-dominants",
      "jazz-ii-v-i",
    ],
  },
  {
    label: "Modes & Advanced Scales",
    topicSlugs: ["modes-of-major-scale", "pentatonic-blues-scales", "melodic-minor-modes", "symmetric-scales"],
  },
];

const SECTION_BY_TOPIC_SLUG = new Map<string, string>(
  PATH_SECTIONS.flatMap((section) => section.topicSlugs.map((slug) => [slug, section.label] as const))
);

// Falls back to the last section for any topic not in the map (a newly added
// topic not yet slotted into a tier) rather than throwing or showing nothing.
export function getSectionForTopic(topicSlug: string): string {
  return SECTION_BY_TOPIC_SLUG.get(topicSlug) ?? PATH_SECTIONS[PATH_SECTIONS.length - 1].label;
}

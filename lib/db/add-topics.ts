import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "eardle.db"));

const CHORD_TYPE_TOPIC: Record<string, string> = {
  major: "major", maj6: "major", maj6_9: "major", maj7: "major", maj9: "major",
  maj7s11: "major", maj9s11: "major", maj13: "major", augMaj7: "major",
  minor: "minor", min6: "minor", min7: "minor", min9: "minor", min11: "minor",
  min13: "minor", minMaj7: "minor", minMaj9: "minor",
  min7b5: "diminished", dim: "diminished", dim7: "diminished",
  dom7: "dominant", dom9: "dominant", dom13: "dominant", dom7s11: "dominant",
  dom9s11: "dominant", dom13s11: "dominant",
  dom7b9: "altered", dom7s9: "altered", dom7b13: "altered", dom7b9b13: "altered",
  dom7s9b13: "altered", dom7b9s11: "altered", dom7s9s11: "altered", dom7s5: "altered", dom7b5: "altered",
  sus7: "suspended", sus9: "suspended", sus13: "suspended",
  aug: "augmented",
};

const SCALE_TYPE_TOPIC: Record<string, string> = {
  major: "major_modes", dorian: "major_modes", mixolydian: "major_modes", lydian: "major_modes",
  harmonic_minor: "minor", melodic_minor: "minor",
  pentatonic_major: "pentatonic_blues", blues: "pentatonic_blues",
  lydian_b7: "jazz_altered", altered: "jazz_altered",
};

const POP_ANSWERS = new Set(["I - IV - V", "I - V - vi - IV", "I - vi - IV - V", "vi - IV - I - V", "I - IV - vi - V"]);
const JAZZ_ANSWERS = new Set([
  "ii7 - V7 - Imaj7", "iim7b5 - V7b9 - im7", "Imaj7 - VI7 - ii7 - V7",
  "ii7 - bII7 - Imaj7", "iii7 - VI7 - ii7 - V7", "Imaj7 - IVmaj7 - iii7 - VI7",
  "im7 - bVII7 - bVI7 - V7",
]);
const BLUES_ANSWERS = new Set(["I7 - IV7 - I7 - V7"]);

function intervalTopic(semitones: number): string {
  if (semitones === 0 || semitones === 12) return "unison_octave";
  if (semitones <= 2) return "seconds";
  if (semitones <= 4) return "thirds";
  if (semitones <= 7) return "fourths_fifths";
  return "sixths_sevenths";
}

function progressionTopic(answer: string): string {
  if (POP_ANSWERS.has(answer)) return "pop";
  if (JAZZ_ANSWERS.has(answer)) return "jazz";
  if (BLUES_ANSWERS.has(answer)) return "blues";
  return "diatonic";
}

const rows = db.prepare("SELECT id, category, config, answer FROM exercises").all() as {
  id: number;
  category: string;
  config: string;
  answer: string;
}[];

const update = db.prepare("UPDATE exercises SET config = ? WHERE id = ?");
let updated = 0;

db.transaction(() => {
  for (const row of rows) {
    const config = JSON.parse(row.config);
    let topic: string | undefined;

    if (row.category === "chord") {
      topic = config.family ?? CHORD_TYPE_TOPIC[config.type as string];
    } else if (row.category === "scale") {
      topic = SCALE_TYPE_TOPIC[config.type as string];
    } else if (row.category === "interval") {
      topic = intervalTopic(config.semitones as number);
    } else if (row.category === "progression") {
      topic = progressionTopic(row.answer);
    } else if (row.category === "note") {
      topic = (config.note as string)?.includes("#") ? "accidentals" : "natural";
    }

    if (topic) {
      config.topic = topic;
      update.run(JSON.stringify(config), row.id);
      updated++;
    }
  }
})();

console.log(`Updated ${updated} / ${rows.length} exercises with topic.`);
db.close();

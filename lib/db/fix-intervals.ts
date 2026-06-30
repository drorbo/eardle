import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "eardle.db"));

const ANSWER_TO_SEMITONES: Record<string, number> = {
  "Unison": 0, "Minor 2nd": 1, "Major 2nd": 2, "Minor 3rd": 3, "Major 3rd": 4,
  "Perfect 4th": 5, "Tritone": 6, "Perfect 5th": 7,
  "Minor 6th": 8, "Major 6th": 9, "Minor 7th": 10, "Major 7th": 11, "Octave": 12,
};

const ANSWER_TO_TOPIC: Record<string, string> = {
  "Unison": "unison_octave", "Octave": "unison_octave",
  "Minor 2nd": "seconds", "Major 2nd": "seconds",
  "Minor 3rd": "thirds", "Major 3rd": "thirds",
  "Perfect 4th": "fourths_fifths", "Tritone": "fourths_fifths", "Perfect 5th": "fourths_fifths",
  "Minor 6th": "sixths_sevenths", "Major 6th": "sixths_sevenths",
  "Minor 7th": "sixths_sevenths", "Major 7th": "sixths_sevenths",
};

const rows = db.prepare("SELECT id, answer, config FROM exercises WHERE category = 'interval'").all() as {
  id: number;
  answer: string;
  config: string;
}[];

const update = db.prepare("UPDATE exercises SET config = ? WHERE id = ?");
let fixed = 0;

db.transaction(() => {
  for (const row of rows) {
    const config = JSON.parse(row.config);
    const semitones = ANSWER_TO_SEMITONES[row.answer];
    const topic = ANSWER_TO_TOPIC[row.answer];
    if (semitones !== undefined && topic) {
      const playMode = config.playMode ?? "harmonic";
      update.run(JSON.stringify({ semitones, playMode, topic }), row.id);
      fixed++;
    }
  }
})();

console.log(`Fixed ${fixed} / ${rows.length} interval exercises.`);
db.close();

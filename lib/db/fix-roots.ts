import Database from "better-sqlite3";

const db = new Database("./eardle.db");
db.pragma("journal_mode = WAL");

function chordTitle(answer: string, difficulty: string): string {
  if (difficulty === "jazz") return answer;
  return `${answer} Chord`;
}

function scaleTitle(answer: string): string {
  return `${answer} Scale`;
}

// Fix chord exercises
const chords = db.prepare("SELECT id, title, config, answer, difficulty FROM exercises WHERE category = 'chord'").all() as any[];
const updateChord = db.prepare("UPDATE exercises SET title = ?, config = ? WHERE id = ?");

let chordFixed = 0;
for (const row of chords) {
  const cfg = JSON.parse(row.config);
  const hadRoot = "root" in cfg;
  if (hadRoot) delete cfg.root;
  const newTitle = chordTitle(row.answer, row.difficulty);
  if (hadRoot || newTitle !== row.title) {
    updateChord.run(newTitle, JSON.stringify(cfg), row.id);
    chordFixed++;
  }
}
console.log(`Chord exercises updated: ${chordFixed} / ${chords.length}`);

// Fix scale exercises
const scales = db.prepare("SELECT id, title, config, answer FROM exercises WHERE category = 'scale'").all() as any[];
const updateScale = db.prepare("UPDATE exercises SET title = ?, config = ? WHERE id = ?");

let scaleFixed = 0;
for (const row of scales) {
  const cfg = JSON.parse(row.config);
  const hadRoot = "root" in cfg;
  if (hadRoot) delete cfg.root;
  const newTitle = scaleTitle(row.answer);
  if (hadRoot || newTitle !== row.title) {
    updateScale.run(newTitle, JSON.stringify(cfg), row.id);
    scaleFixed++;
  }
}
console.log(`Scale exercises updated: ${scaleFixed} / ${scales.length}`);

db.close();
console.log("Done.");

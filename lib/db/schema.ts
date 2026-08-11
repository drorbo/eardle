import { boolean, index, integer, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  category: text("category", {
    enum: ["note", "interval", "chord", "progression", "scale"],
  }).notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard", "jazz"] }).notNull(),
  config: text("config").notNull(),
  choices: text("choices").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  name: text("name"),
  nickname: text("nickname"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  answered: text("answered").notNull(),
  correct: boolean("correct").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name"),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const dailyPuzzles = pgTable("daily_puzzles", {
  id: serial("id").primaryKey(),
  puzzleDate: text("puzzle_date").notNull().unique(), // "YYYY-MM-DD", UTC calendar day
  category: text("category", {
    enum: ["note", "interval", "chord", "progression", "scale"],
  }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard", "jazz"] }).notNull(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }),
  // Full immutable copy of {title, prompt, config, choices, answer} at generation time.
  // This — not a live re-fetch of `exercises` — is the source of truth for gameplay AND
  // history from this point on, so a later admin edit to the exercise can never
  // retroactively change an already-served day's puzzle or corrupt historical stats.
  exerciseSnapshot: text("exercise_snapshot").notNull(),
  // Fixed root/voicing/transposition so every player's useAudio.play() hears the
  // exact same audio (unlike regular practice, which randomizes these per session).
  performanceParams: text("performance_params").notNull(),
  // Discriminator for future non-pool generators (rhythm/melody/custom); only "pool" today.
  source: text("source", { enum: ["pool"] }).notNull().default("pool"),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const dailyAttempts = pgTable(
  "daily_attempts",
  {
    id: serial("id").primaryKey(),
    puzzleId: integer("puzzle_id")
      .notNull()
      .references(() => dailyPuzzles.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionToken: text("session_token").notNull(),
    // Denormalized from the puzzle at attempt-creation time so future stats queries
    // (win % by category / exercise type / topic) run directly against this table
    // with a plain GROUP BY — no join, no JSON parsing.
    category: text("category", {
      enum: ["note", "interval", "chord", "progression", "scale"],
    }).notNull(),
    difficulty: text("difficulty", { enum: ["easy", "medium", "hard", "jazz"] }).notNull(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    exerciseType: text("exercise_type"), // config.type when present (chord/scale); null for progression
    topic: text("topic"), // config.topic when present; null otherwise
    guesses: text("guesses").notNull().default("[]"), // JSON array of guessed choice strings, in order
    status: text("status", { enum: ["in_progress", "won", "lost"] })
      .notNull()
      .default("in_progress"),
    finalGuessCount: integer("final_guess_count"),
    finishedAt: integer("finished_at"),
    createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => ({
    // Two PARTIAL unique indexes (not one composite): identity is userId OR sessionToken,
    // never both required — Postgres partial unique indexes let these coexist cleanly.
    oneAttemptPerUser: uniqueIndex("daily_attempts_user_puzzle_uq")
      .on(table.puzzleId, table.userId)
      .where(sql`${table.userId} is not null`),
    oneAttemptPerGuestToken: uniqueIndex("daily_attempts_token_puzzle_uq")
      .on(table.puzzleId, table.sessionToken)
      .where(sql`${table.userId} is null`),
    puzzleIdx: index("daily_attempts_puzzle_idx").on(table.puzzleId),
    categoryIdx: index("daily_attempts_category_idx").on(table.category, table.status),
    exerciseTypeIdx: index("daily_attempts_exercise_type_idx").on(table.exerciseType, table.status),
  })
);

export const streaks = pgTable(
  "streaks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    kind: text("kind", { enum: ["exercise", "daily"] }).notNull(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => ({
    // Same dual-identity pattern as daily_attempts: userId OR sessionToken,
    // never both required, via two partial unique indexes.
    oneRowPerUser: uniqueIndex("streaks_user_kind_uq")
      .on(table.userId, table.kind)
      .where(sql`${table.userId} is not null`),
    oneRowPerGuestToken: uniqueIndex("streaks_token_kind_uq")
      .on(table.sessionToken, table.kind)
      .where(sql`${table.userId} is null`),
  })
);

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  // Informational only — shown as a link on the lesson page, never enforced
  // (the "free browse, nothing locked" navigation decision).
  prerequisiteTopicId: integer("prerequisite_topic_id").references(() => topics.id, { onDelete: "set null" }),
  // A lesson's linked "Practice what you've learned" packages — fully optional,
  // and there can be more than one (e.g. a lesson covering several interval
  // qualities can link "Thirds", "Fourths & Fifths", and "All Naturals"
  // separately). Each package mirrors the existing Custom Package URL shape
  // (category + exercise ids) plus a label. JSON array string, nullable:
  // { label: string; category: Category; exerciseIds: number[] }[]
  practicePackages: text("practice_packages"),
  // Ordered array of content blocks: {type: "text"|"audioExample"|"tip"|"commonMistake"|"summary", ...}
  body: text("body").notNull().default("[]"),
  blockSchemaVersion: integer("block_schema_version").notNull().default(1),
  published: boolean("published").notNull().default(false),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// Insert-only snapshot of `lessons.body` on every save — no revision-diff UI yet,
// just insurance against an accidental overwrite since content has no Git history.
export const lessonRevisions = pgTable("lesson_revisions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    // "Completed" = both non-null (computed at query time, not stored). Kept as two
    // independent signals rather than one boolean so viewed-only/practiced-only
    // states are knowable, per how completion was defined for this feature.
    viewedAt: integer("viewed_at"),
    practicedAt: integer("practiced_at"),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  },
  (table) => ({
    // Same dual-identity pattern as streaks/daily_attempts: userId OR sessionToken,
    // never both required, via two partial unique indexes.
    oneRowPerUser: uniqueIndex("lesson_progress_user_lesson_uq")
      .on(table.lessonId, table.userId)
      .where(sql`${table.userId} is not null`),
    oneRowPerGuestToken: uniqueIndex("lesson_progress_token_lesson_uq")
      .on(table.lessonId, table.sessionToken)
      .where(sql`${table.userId} is null`),
  })
);

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type DailyPuzzle = typeof dailyPuzzles.$inferSelect;
export type DailyAttempt = typeof dailyAttempts.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonRevision = typeof lessonRevisions.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;

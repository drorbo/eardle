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

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type DailyPuzzle = typeof dailyPuzzles.$inferSelect;
export type DailyAttempt = typeof dailyAttempts.$inferSelect;
export type Streak = typeof streaks.$inferSelect;

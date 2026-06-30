import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category", {
    enum: ["note", "interval", "chord", "progression", "scale"],
  }).notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard", "jazz"] }).notNull(),
  config: text("config").notNull(), // JSON string
  choices: text("choices").notNull(), // JSON string array
  answer: text("answer").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  name: text("name"),
  nickname: text("nickname"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionToken: text("session_token").notNull(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  answered: text("answered").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name"),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;

CREATE TABLE "daily_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"puzzle_id" integer NOT NULL,
	"user_id" integer,
	"session_token" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"exercise_id" integer NOT NULL,
	"exercise_type" text,
	"topic" text,
	"guesses" text DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"final_guess_count" integer,
	"finished_at" integer,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"puzzle_date" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"exercise_id" integer NOT NULL,
	"exercise_snapshot" text NOT NULL,
	"performance_params" text NOT NULL,
	"source" text DEFAULT 'pool' NOT NULL,
	"created_at" integer NOT NULL,
	CONSTRAINT "daily_puzzles_puzzle_date_unique" UNIQUE("puzzle_date")
);
--> statement-breakpoint
ALTER TABLE "daily_attempts" ADD CONSTRAINT "daily_attempts_puzzle_id_daily_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."daily_puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_attempts" ADD CONSTRAINT "daily_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_attempts" ADD CONSTRAINT "daily_attempts_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_puzzles" ADD CONSTRAINT "daily_puzzles_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_attempts_user_puzzle_uq" ON "daily_attempts" USING btree ("puzzle_id","user_id") WHERE "daily_attempts"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_attempts_token_puzzle_uq" ON "daily_attempts" USING btree ("puzzle_id","session_token") WHERE "daily_attempts"."user_id" is null;--> statement-breakpoint
CREATE INDEX "daily_attempts_puzzle_idx" ON "daily_attempts" USING btree ("puzzle_id");--> statement-breakpoint
CREATE INDEX "daily_attempts_category_idx" ON "daily_attempts" USING btree ("category","status");--> statement-breakpoint
CREATE INDEX "daily_attempts_exercise_type_idx" ON "daily_attempts" USING btree ("exercise_type","status");
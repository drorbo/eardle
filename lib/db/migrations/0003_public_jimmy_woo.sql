CREATE TABLE "streaks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_token" text NOT NULL,
	"kind" text NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"updated_at" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "streaks_user_kind_uq" ON "streaks" USING btree ("user_id","kind") WHERE "streaks"."user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "streaks_token_kind_uq" ON "streaks" USING btree ("session_token","kind") WHERE "streaks"."user_id" is null;
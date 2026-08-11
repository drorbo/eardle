// Minimal, explicit SQL migration runner for lib/db/migrations/*.sql, run on
// every container start (via npm run start), before init-db.ts.
//
// Deliberately not using drizzle-kit's own `migrate` command: production's
// schema was originally bootstrapped via db/init.sql (raw SQL, run once by
// Postgres on first boot) and evolved since via manual `drizzle-kit push`
// calls, so it was never tracked through drizzle-kit's own migration log —
// running `drizzle-kit migrate` cold would try to re-run 0000-0003's CREATE
// TABLE statements against tables that already exist and fail.
//
// This script tracks applied migrations in its own small table instead,
// seeded once below to mark 0000-0003 as already-applied (verified against
// what's already live in production) so they're never re-run — existing
// data (including user progress) is untouched. Every migration added after
// this point runs automatically and exactly once on the next deploy, in any
// environment.

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { client } from "../lib/db";

const MIGRATIONS_DIR = join(__dirname, "..", "lib", "db", "migrations");

// Already live in every deployed environment before this tracking table
// existed (db/init.sql + past manual `drizzle-kit push` runs) — seeded as
// done so they're never re-run against tables/columns that already exist.
const PRE_EXISTING = [
  "0000_ordinary_kid_colt",
  "0001_wild_shinobi_shaw",
  "0002_tearful_quasar",
  "0003_public_jimmy_woo",
];

async function tableExists(name: string): Promise<boolean> {
  const rows = await client<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = ${name}
    ) AS exists
  `;
  return rows[0].exists;
}

async function main() {
  await client`
    CREATE TABLE IF NOT EXISTS "_eardle_migrations" (
      "name" text PRIMARY KEY NOT NULL,
      "applied_at" integer NOT NULL
    )
  `;

  const now = Math.floor(Date.now() / 1000);

  // Was previously an unconditional assertion ("these are already applied,
  // trust me") rather than a check — correct in every environment actually
  // bootstrapped via db/init.sql, but if Postgres were ever provisioned any
  // other way (a managed instance, a different compose file, a restored
  // empty volume), this would wrongly claim 0000-0003 applied while none of
  // their tables exist, and 0004's own ALTER TABLE would fail confusingly
  // far from the real cause. Verified via the same tableExists() check 0004
  // already used below, instead of assuming (see the 2026-08-11 audit).
  if (await tableExists("exercises")) {
    for (const name of PRE_EXISTING) {
      await client`
        INSERT INTO "_eardle_migrations" ("name", "applied_at")
        VALUES (${name}, ${now})
        ON CONFLICT ("name") DO NOTHING
      `;
    }
  }

  // 0004 may or may not already be live depending on the environment (some
  // were migrated by hand before this script existed) — check directly
  // rather than assume either way.
  if (await tableExists("topics")) {
    await client`
      INSERT INTO "_eardle_migrations" ("name", "applied_at")
      VALUES ('0004_chunky_hobgoblin', ${now})
      ON CONFLICT ("name") DO NOTHING
    `;
  }

  const appliedRows = await client<{ name: string }[]>`SELECT "name" FROM "_eardle_migrations"`;
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const name = file.replace(/\.sql$/, "");
    if (applied.has(name)) continue;

    console.log(`[migrate] Applying ${name}...`);
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    // Drizzle's generated files mark statement boundaries this way — the
    // postgres.js driver doesn't support multiple statements in one call.
    const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const statement of statements) {
      await client.unsafe(statement);
    }
    await client`INSERT INTO "_eardle_migrations" ("name", "applied_at") VALUES (${name}, ${now})`;
    console.log(`[migrate] Applied ${name}.`);
  }

  console.log("[migrate] Database schema up to date.");
}

main()
  .catch((err) => {
    console.error("[migrate] Failed:", err);
    process.exit(1);
  })
  .finally(() => client.end());

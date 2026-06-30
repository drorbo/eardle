// Runs on every container start (via npm run start).
// Seeds the database only if the exercises table is empty.

import { db, client } from "../lib/db";
import { exercises } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exercises);

  if (Number(count) > 0) {
    console.log(`[init] ${count} exercises already in DB — skipping seed.`);
    return;
  }

  console.log("[init] Empty database — seeding...");
  const scripts = [
    "lib/db/seed.ts",
    "scripts/seed-intervals.ts",
    "scripts/seed-inversions.ts",
    "scripts/seed-progressions.ts",
    "scripts/seed-scales.ts",
  ];
  for (const s of scripts) {
    execSync(`npx tsx ${s}`, { stdio: "inherit" });
  }
  console.log("[init] Done.");
}

main().catch(console.error).finally(() => client.end());

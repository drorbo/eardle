// Runs on every container start (via npm run start).
// On fresh deployments, db/init.sql already seeds exercises via the PostgreSQL
// init directory. This script is the fallback for existing volumes where that
// init file didn't run — it seeds exercises if the table is empty, then ensures
// the admin user exists.

import { hashSync } from "bcryptjs";
import { db, client } from "../lib/db";
import { exercises, adminUsers } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exercises);

  if (Number(count) === 0) {
    console.log("[init] No exercises found — seeding...");
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
    console.log("[init] Exercise seed done.");
  } else {
    console.log(`[init] ${count} exercises already in DB — skipping seed.`);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set — refusing to seed/update the admin account.");
  }
  const passwordHash = hashSync(adminPassword, 12);

  await db
    .insert(adminUsers)
    .values({ email: adminEmail, passwordHash })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash } });

  console.log(`[init] Admin user ready: ${adminEmail}`);
}

main().catch(console.error).finally(() => client.end());

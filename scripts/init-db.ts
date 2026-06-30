// Runs on every container start (via npm run start).
// Exercises are pre-loaded by db/init.sql on first PostgreSQL boot.
// This script only ensures the admin user exists.

import { hashSync } from "bcryptjs";
import { db, client } from "../lib/db";
import { adminUsers } from "../lib/db/schema";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@eardle.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = hashSync(adminPassword, 10);

  await db
    .insert(adminUsers)
    .values({ email: adminEmail, passwordHash })
    .onConflictDoNothing();

  console.log(`[init] Admin user ready: ${adminEmail}`);
}

main().catch(console.error).finally(() => client.end());

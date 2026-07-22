import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// In dev, Next.js hot-reloads this module on every file save, and a plain
// `postgres(...)` call at module scope would open a brand-new connection
// pool each time without closing the previous one — the pool leaks until
// Postgres's max_connections is exhausted ("sorry, too many clients
// already"). Stashing the client on `globalThis` survives HMR reloads so
// dev always reuses the same pool. Production only ever imports this module
// once per process, so this is a no-op there.
const globalForDb = globalThis as unknown as { __eardleDbClient?: ReturnType<typeof postgres> };

export const client = globalForDb.__eardleDbClient ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__eardleDbClient = client;
}

export const db = drizzle(client, { schema });

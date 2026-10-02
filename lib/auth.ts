import type { DefaultSession } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compareSync, hashSync } from "bcryptjs";
import { db } from "./db";
import { adminUsers, users } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit } from "./rateLimit";
import { clientIp } from "./clientIp";
import { resolveGoogleUser } from "./googleAccount";

// Compared against when no user/admin row matches the submitted email, so a
// nonexistent-account attempt takes the same time as a wrong-password one —
// otherwise bcrypt's absence is a timing oracle for account enumeration.
const DUMMY_HASH = hashSync("not-a-real-password-used-only-for-timing-parity", 12);

declare module "next-auth" {
  interface User {
    role?: "admin" | "user";
    nickname?: string | null;
    avatarUrl?: string | null;
  }
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "user";
      nickname?: string | null;
      avatarUrl?: string | null;
    };
  }
}

// Custom fields stored in the JWT cookie (no module augmentation — cast as needed below)
type AppToken = {
  id?: string;
  role?: "admin" | "user";
  nickname?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // "Foo@x.com" and "foo@x.com" are the same account (see the users_email_lower_unique index and
        // app/api/user/register): compare lower-cased on both sides, not just for the rate-limit key as before.
        const email = (credentials.email as string).trim().toLowerCase();

        // Per email, as before (stops repeated guesses against one account) — and per IP, which that alone does not
        // catch: a distributed guess of many different emails, each tried only once or twice, from the same source.
        // clientIp() is null off Cloudflare (e.g. local dev), where this second check is simply skipped.
        if (!checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000)) return null;
        const ip = clientIp(request);
        if (ip && !checkRateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000)) return null;

        // Check admin users first
        const admin = await db.query.adminUsers.findFirst({
          where: sql`lower(${adminUsers.email}) = ${email}`,
        });
        if (admin && compareSync(credentials.password as string, admin.passwordHash)) {
          return { id: String(admin.id), email: admin.email, role: "admin" as const };
        }

        // Check public users
        const user = await db.query.users.findFirst({
          where: sql`lower(${users.email}) = ${email}`,
        });
        const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
        const passwordOk = compareSync(credentials.password as string, hashToCheck);
        if (!user?.passwordHash || !passwordOk) return null;
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: "user" as const,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      const t = token as AppToken;

      // Credentials sign-in: user object is available
      if (user) {
        t.id = user.id as string;
        t.role = user.role;
        t.nickname = user.nickname ?? null;
        t.avatarUrl = user.avatarUrl ?? null;
      }

      // Google OAuth: find or create user row (see lib/googleAccount.ts for why this only ever matches by Google id)
      if (account?.provider === "google" && profile) {
        const p = profile as { sub?: string; email?: string; name?: string; picture?: string };
        const dbUser = await resolveGoogleUser(p);

        t.id = String(dbUser.id);
        t.role = "user";
        t.nickname = dbUser.nickname ?? null;
        t.avatarUrl = dbUser.avatarUrl ?? (p.picture ?? null);
      }

      // Session update triggered from client after profile edit
      if (trigger === "update" && t.id && t.role === "user") {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, parseInt(t.id)),
        });
        if (dbUser) {
          t.nickname = dbUser.nickname ?? null;
          t.avatarUrl = dbUser.avatarUrl ?? null;
        }
      }

      return t as typeof token;
    },
    session({ session, token }) {
      const t = token as AppToken;
      if (t) {
        session.user.id = t.id as string;
        session.user.role = (t.role ?? "user") as "admin" | "user";
        session.user.nickname = t.nickname as string | null | undefined;
        session.user.avatarUrl = t.avatarUrl as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: { strategy: "jwt" },
});

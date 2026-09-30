import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

// Not a full RFC 5322 parser (nothing sensible is) — just enough to catch what a person typing their address by hand
// might get wrong (missing @, stray whitespace) before it reaches the database.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (ip && !checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signups from this network. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { password, nickname } = body ?? {};
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : body?.email;

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: "Email, password, and nickname are required" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  // Ends up in the session JWT cookie on every request (see lib/auth.ts and app/api/user/profile), so this is not
  // just cosmetic — an unbounded value can push the cookie past what browsers/servers accept.
  if (typeof nickname !== "string" || nickname.trim().length > 50) {
    return NextResponse.json({ error: "Nickname must be 50 characters or fewer" }, { status: 400 });
  }

  // Case-insensitively: "Foo@x.com" and "foo@x.com" must be the same account, not two (see lib/auth.ts and the
  // users_email_lower_unique index in lib/db/schema.ts, which backstops this at the database level too).
  const existing = await db.query.users.findFirst({ where: sql`lower(${users.email}) = ${email}` });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = hashSync(password, 12);
  const [user] = await db.insert(users).values({ email, passwordHash, nickname }).returning({
    id: users.id,
    email: users.email,
    nickname: users.nickname,
  });

  return NextResponse.json(user, { status: 201 });
}

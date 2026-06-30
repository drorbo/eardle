import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, nickname } = body ?? {};

  if (!email || !password || !nickname) {
    return NextResponse.json({ error: "Email, password, and nickname are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
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

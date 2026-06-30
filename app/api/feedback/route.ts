import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedback, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const { name, email, message } = body ?? {};

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userId =
    session?.user?.id && session.user.role === "user"
      ? parseInt(session.user.id)
      : undefined;

  await db.insert(feedback).values({
    userId,
    name: name?.trim() || null,
    email: email?.trim() || null,
    message: message.trim(),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.toLowerCase() ?? "";

  const rows = await db
    .select({
      id: feedback.id,
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
      createdAt: feedback.createdAt,
      userNickname: users.nickname,
      userEmail: users.email,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt));

  const filtered = q
    ? rows.filter(
        (r) =>
          r.message.toLowerCase().includes(q) ||
          (r.name ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      )
    : rows;

  return NextResponse.json(filtered);
}

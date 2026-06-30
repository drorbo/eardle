import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { nickname, avatarUrl } = body ?? {};

  if (nickname !== undefined && (!nickname || typeof nickname !== "string")) {
    return NextResponse.json({ error: "Nickname cannot be empty" }, { status: 400 });
  }

  const updates: Partial<{ nickname: string; avatarUrl: string | null }> = {};
  if (nickname !== undefined) updates.nickname = nickname.trim();
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl?.trim() || null;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning({
    id: users.id,
    nickname: users.nickname,
    avatarUrl: users.avatarUrl,
  });

  return NextResponse.json(updated);
}

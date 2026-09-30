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
  // Both end up in the session JWT cookie on every request (see lib/auth.ts), so an unbounded value here is not
  // just cosmetic — a large enough one can push the cookie past what browsers/servers accept and break the
  // person's own sign-in. avatarUrl is further restricted to http(s): an image tag ignores other schemes in every
  // current browser, but there is no reason to store one anyway.
  if (typeof nickname === "string" && nickname.trim().length > 50) {
    return NextResponse.json({ error: "Nickname must be 50 characters or fewer" }, { status: 400 });
  }
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    const trimmed = avatarUrl.trim();
    if (trimmed.length > 500) return NextResponse.json({ error: "That image address is too long" }, { status: 400 });
    let scheme: string | null = null;
    try { scheme = new URL(trimmed).protocol; } catch { /* not a valid absolute URL at all */ }
    if (scheme !== "http:" && scheme !== "https:") {
      return NextResponse.json({ error: "The image address must be a regular http(s) link" }, { status: 400 });
    }
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

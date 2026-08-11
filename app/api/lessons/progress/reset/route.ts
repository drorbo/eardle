import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress, lessons } from "@/lib/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

// POST: nulls out viewed/practiced for one lesson, or for every lesson in a
// topic (bulk), for the current identity only. Pass `field` to null only
// that one flag instead of both — used by the lesson page's "Mark as in
// progress" button, which un-does completion (clears practicedAt) without
// also forgetting the lesson was ever viewed.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lessonId, topicId, sessionToken, field } = body as {
    lessonId?: number;
    topicId?: number;
    sessionToken?: string | null;
    field?: "viewed" | "practiced";
  };
  if (!lessonId && !topicId) {
    return NextResponse.json({ error: "Provide lessonId or topicId" }, { status: 400 });
  }
  const updates =
    field === "viewed" ? { viewedAt: null } : field === "practiced" ? { practicedAt: null } : { viewedAt: null, practicedAt: null };

  const session = await auth();
  // Same admin-id-isn't-a-users.id distinction as app/api/lessons/progress/route.ts —
  // kept consistent even though this route only UPDATEs (an admin "userId" here would
  // just match zero rows, not throw), so the two routes share one identity model.
  const userId = session?.user?.id && session.user.role !== "admin" ? parseInt(session.user.id) : null;
  const token = sessionToken ?? null;
  if (!userId && !token) {
    return NextResponse.json({ error: "No identity" }, { status: 400 });
  }

  const identityCondition = userId
    ? eq(lessonProgress.userId, userId)
    : and(isNull(lessonProgress.userId), eq(lessonProgress.sessionToken, token!));

  const now = Math.floor(Date.now() / 1000);

  if (lessonId) {
    await db
      .update(lessonProgress)
      .set({ ...updates, updatedAt: now })
      .where(and(eq(lessonProgress.lessonId, lessonId), identityCondition));
  } else if (topicId) {
    const topicLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.topicId, topicId));
    const ids = topicLessons.map((l) => l.id);
    if (ids.length > 0) {
      await db
        .update(lessonProgress)
        .set({ ...updates, updatedAt: now })
        .where(and(inArray(lessonProgress.lessonId, ids), identityCondition));
    }
  }

  return NextResponse.json({ ok: true });
}

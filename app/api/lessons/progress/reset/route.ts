import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress, lessons } from "@/lib/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

// POST: "Mark as uncompleted" — nulls out viewed/practiced for one lesson, or
// for every lesson in a topic (bulk), for the current identity only.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lessonId, topicId, sessionToken } = body as {
    lessonId?: number;
    topicId?: number;
    sessionToken?: string | null;
  };
  if (!lessonId && !topicId) {
    return NextResponse.json({ error: "Provide lessonId or topicId" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
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
      .set({ viewedAt: null, practicedAt: null, updatedAt: now })
      .where(and(eq(lessonProgress.lessonId, lessonId), identityCondition));
  } else if (topicId) {
    const topicLessons = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.topicId, topicId));
    const ids = topicLessons.map((l) => l.id);
    if (ids.length > 0) {
      await db
        .update(lessonProgress)
        .set({ viewedAt: null, practicedAt: null, updatedAt: now })
        .where(and(inArray(lessonProgress.lessonId, ids), identityCondition));
    }
  }

  return NextResponse.json({ ok: true });
}

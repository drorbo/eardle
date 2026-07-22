import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, streaks, lessonProgress } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionToken } = await req.json();
  if (!sessionToken || typeof sessionToken !== "string") {
    return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  await db
    .update(sessions)
    .set({ userId })
    .where(and(eq(sessions.sessionToken, sessionToken), isNull(sessions.userId)));

  // streaks has a unique (userId, kind) constraint, so unlike sessions above,
  // a blind UPDATE could collide if the user already has their own row for
  // this kind — merge instead of overwrite when that happens.
  for (const kind of ["exercise", "daily"] as const) {
    const guestRow = await db.query.streaks.findFirst({
      where: and(eq(streaks.sessionToken, sessionToken), isNull(streaks.userId), eq(streaks.kind, kind)),
    });
    if (!guestRow) continue;

    const userRow = await db.query.streaks.findFirst({
      where: and(eq(streaks.userId, userId), eq(streaks.kind, kind)),
    });

    if (!userRow) {
      await db.update(streaks).set({ userId }).where(eq(streaks.id, guestRow.id));
    } else {
      const mergedLongest = Math.max(userRow.longestStreak, guestRow.longestStreak);
      const mergedCurrent = guestRow.updatedAt > userRow.updatedAt ? guestRow.currentStreak : userRow.currentStreak;
      await db.update(streaks)
        .set({ longestStreak: mergedLongest, currentStreak: mergedCurrent, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(streaks.id, userRow.id));
      await db.delete(streaks).where(eq(streaks.id, guestRow.id));
    }
  }

  // lesson_progress has a unique (userId, lessonId) constraint too — same
  // merge-or-move approach as streaks above.
  const guestLessonRows = await db.query.lessonProgress.findMany({
    where: and(eq(lessonProgress.sessionToken, sessionToken), isNull(lessonProgress.userId)),
  });
  for (const guestRow of guestLessonRows) {
    const userRow = await db.query.lessonProgress.findFirst({
      where: and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, guestRow.lessonId)),
    });
    if (!userRow) {
      await db.update(lessonProgress).set({ userId }).where(eq(lessonProgress.id, guestRow.id));
    } else {
      await db.update(lessonProgress)
        .set({
          viewedAt: userRow.viewedAt ?? guestRow.viewedAt ?? null,
          practicedAt: userRow.practicedAt ?? guestRow.practicedAt ?? null,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(lessonProgress.id, userRow.id));
      await db.delete(lessonProgress).where(eq(lessonProgress.id, guestRow.id));
    }
  }

  return NextResponse.json({ migrated: true });
}

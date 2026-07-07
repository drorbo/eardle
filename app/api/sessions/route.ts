import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, streaks } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const [session, body] = await Promise.all([auth(), req.json()]);
  const { sessionToken, exerciseId, answered, correct } = body;

  if (!sessionToken || !exerciseId || answered === undefined || correct === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

  const [created] = await db
    .insert(sessions)
    .values({ sessionToken, exerciseId, answered, correct, ...(userId ? { userId } : {}) })
    .returning();

  // Exercise streak: increment on correct, reset on incorrect. longestStreak
  // only ever ratchets up; isNewRecord fires the moment currentStreak first
  // exceeds the previous longest (not on ties).
  const streakIdentityWhere = userId
    ? and(eq(streaks.userId, userId), eq(streaks.kind, "exercise"))
    : and(isNull(streaks.userId), eq(streaks.sessionToken, sessionToken), eq(streaks.kind, "exercise"));

  const existingStreak = await db.query.streaks.findFirst({ where: streakIdentityWhere });
  const oldLongest = existingStreak?.longestStreak ?? 0;
  const newCurrent = correct ? (existingStreak?.currentStreak ?? 0) + 1 : 0;
  const newLongest = Math.max(oldLongest, newCurrent);
  const isNewRecord = newCurrent > oldLongest;
  const now = Math.floor(Date.now() / 1000);

  if (existingStreak) {
    await db.update(streaks)
      .set({ currentStreak: newCurrent, longestStreak: newLongest, updatedAt: now })
      .where(eq(streaks.id, existingStreak.id));
  } else {
    await db.insert(streaks).values({
      userId: userId ?? undefined,
      sessionToken,
      kind: "exercise",
      currentStreak: newCurrent,
      longestStreak: newLongest,
      updatedAt: now,
    });
  }

  return NextResponse.json(
    { ...created, currentStreak: newCurrent, longestStreak: newLongest, isNewRecord },
    { status: 201 }
  );
}

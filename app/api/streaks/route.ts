import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { streaks } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const EMPTY = { current: 0, longest: 0 };

export async function GET(req: NextRequest) {
  const [session, token] = await Promise.all([
    auth(),
    Promise.resolve(new URL(req.url).searchParams.get("token")),
  ]);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  if (!userId && !token) {
    return NextResponse.json({ exercise: EMPTY, daily: EMPTY });
  }

  const identityWhere = (kind: "exercise" | "daily") =>
    userId
      ? and(eq(streaks.userId, userId), eq(streaks.kind, kind))
      : and(isNull(streaks.userId), eq(streaks.sessionToken, token!), eq(streaks.kind, kind));

  const [exerciseRow, dailyRow] = await Promise.all([
    db.query.streaks.findFirst({ where: identityWhere("exercise") }),
    db.query.streaks.findFirst({ where: identityWhere("daily") }),
  ]);

  return NextResponse.json({
    exercise: { current: exerciseRow?.currentStreak ?? 0, longest: exerciseRow?.longestStreak ?? 0 },
    daily: { current: dailyRow?.currentStreak ?? 0, longest: dailyRow?.longestStreak ?? 0 },
  });
}

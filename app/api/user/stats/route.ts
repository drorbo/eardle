import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, exercises } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const tokenParam = new URL(req.url).searchParams.get("token");

  if (!userId && !tokenParam) {
    return NextResponse.json({ byCategory: {}, recentAttempts: [] });
  }

  const whereClause = userId
    ? eq(sessions.userId, userId)
    : eq(sessions.sessionToken, tokenParam!);

  const categoryStats = await db
    .select({
      category: exercises.category,
      total: sql<number>`count(*)`,
      correct: sql<number>`sum(${sessions.correct})`,
      lastSeen: sql<number>`max(${sessions.createdAt})`,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(whereClause)
    .groupBy(exercises.category);

  const recent = await db
    .select({
      exerciseId: sessions.exerciseId,
      category: exercises.category,
      correct: sessions.correct,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
    .where(whereClause)
    .orderBy(sql`${sessions.createdAt} desc`)
    .limit(20);

  const byCategory: Record<string, { total: number; correct: number; lastSeen: number | null }> = {};
  for (const row of categoryStats) {
    byCategory[row.category] = {
      total: Number(row.total),
      correct: Number(row.correct ?? 0),
      lastSeen: row.lastSeen ?? null,
    };
  }

  return NextResponse.json({ byCategory, recentAttempts: recent });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

async function resolveIdentity(bodyToken?: string | null, url?: string) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const token = bodyToken ?? (url ? new URL(url).searchParams.get("token") : null);
  return { userId, token };
}

// GET: bulk viewed/practiced/completed status for every lesson the current
// identity has touched — powers the /learn overview list and prev/next nav.
export async function GET(req: NextRequest) {
  const { userId, token } = await resolveIdentity(null, req.url);
  if (!userId && !token) return NextResponse.json({});

  const where = userId
    ? eq(lessonProgress.userId, userId)
    : and(isNull(lessonProgress.userId), eq(lessonProgress.sessionToken, token!));

  const rows = await db.select().from(lessonProgress).where(where);
  const result: Record<number, { viewed: boolean; practiced: boolean; completed: boolean }> = {};
  for (const r of rows) {
    result[r.lessonId] = {
      viewed: r.viewedAt != null,
      practiced: r.practicedAt != null,
      completed: r.viewedAt != null && r.practicedAt != null,
    };
  }
  return NextResponse.json(result);
}

// POST: mark a lesson viewed or practiced for the current identity. Only sets
// the timestamp the first time — replaying a lesson/practice session doesn't
// need to move it.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lessonId, sessionToken, kind } = body as {
    lessonId?: number;
    sessionToken?: string | null;
    kind?: "viewed" | "practiced";
  };
  if (!lessonId || (kind !== "viewed" && kind !== "practiced")) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { userId, token } = await resolveIdentity(sessionToken);
  if (!userId && !token) {
    return NextResponse.json({ error: "No identity" }, { status: 400 });
  }

  const identityWhere = userId
    ? and(eq(lessonProgress.lessonId, lessonId), eq(lessonProgress.userId, userId))
    : and(eq(lessonProgress.lessonId, lessonId), isNull(lessonProgress.userId), eq(lessonProgress.sessionToken, token!));

  const existing = await db.query.lessonProgress.findFirst({ where: identityWhere });
  const now = Math.floor(Date.now() / 1000);
  const field = kind === "viewed" ? "viewedAt" : "practicedAt";

  if (existing) {
    if (existing[field] == null) {
      await db.update(lessonProgress).set({ [field]: now, updatedAt: now }).where(eq(lessonProgress.id, existing.id));
    }
  } else {
    await db.insert(lessonProgress).values({
      lessonId,
      userId: userId ?? null,
      sessionToken: token ?? "",
      [field]: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessonProgress, lessons } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

async function resolveIdentity(bodyToken?: string | null, url?: string) {
  const session = await auth();
  // Admin sessions carry an adminUsers.id, not a users.id — lessonProgress.userId
  // is a hard FK to users.id, so treating an admin's id as that FK throws on
  // insert. Admins fall back to guest-token identity (or "no identity") instead
  // of ever writing a user-scoped progress row.
  const userId = session?.user?.id && session.user.role !== "admin" ? parseInt(session.user.id) : null;
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

  // A nonexistent/unpublished lessonId used to still create a junk progress
  // row with no server-side existence check at all (see the 2026-08-11
  // audit) — writes stay scoped to the caller's own identity either way, so
  // this was never an IDOR, just silent data pollution.
  const [lesson] = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

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
    try {
      await db.insert(lessonProgress).values({
        lessonId,
        userId: userId ?? null,
        sessionToken: token ?? "",
        [field]: now,
        updatedAt: now,
      });
    } catch (err: unknown) {
      // Two near-simultaneous first-touch requests for the same identity can
      // both observe `existing == null` and both attempt the insert; the
      // partial unique index (lesson_progress_user_lesson_uq /
      // ..._token_lesson_uq) correctly rejects the second one. Data is still
      // correct either way — degrade to a clean success instead of an
      // unhandled 500 (matches app/api/daily/guess/route.ts's handling of
      // the identical race).
      const pgCode =
        (err && typeof err === "object" && "code" in err && (err as { code?: string }).code) ||
        (err && typeof err === "object" && "cause" in err && err.cause && typeof err.cause === "object" && "code" in err.cause && (err.cause as { code?: string }).code);
      if (pgCode !== "23505") throw err;
    }
  }

  return NextResponse.json({ ok: true });
}

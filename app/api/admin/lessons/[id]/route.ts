import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { lessons, lessonRevisions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isValidPracticePackages } from "@/types/lesson";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const lessonId = Number(id);
  const body = await req.json();
  const {
    topicId,
    slug,
    title,
    sortOrder,
    prerequisiteTopicId,
    practicePackages,
    body: blocks,
    published,
  } = body;

  if (practicePackages && practicePackages.length && !isValidPracticePackages(practicePackages)) {
    return NextResponse.json({ error: "Invalid practice package" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const bodyJson = JSON.stringify(blocks ?? []);

  // Snapshot-then-update used to be two unwrapped statements with no
  // concurrency check: two overlapping saves (two admin tabs, a retried
  // slow request) could both read the same pre-edit body, both snapshot it,
  // then both unconditionally overwrite — the later write wins and silently
  // discards the other's edit, which the revision snapshot (taken *before*
  // either write) never captured. A transaction plus an optimistic
  // `updatedAt` check turns that into a clean 409 instead (see the
  // 2026-08-11 audit).
  const result = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!existing) return { status: "not_found" as const };

    await tx.insert(lessonRevisions).values({ lessonId, body: existing.body, createdAt: now });

    const [updated] = await tx
      .update(lessons)
      .set({
        topicId,
        slug,
        title,
        sortOrder,
        prerequisiteTopicId: prerequisiteTopicId || null,
        practicePackages: practicePackages && practicePackages.length ? JSON.stringify(practicePackages) : null,
        body: bodyJson,
        published: !!published,
        updatedAt: now,
      })
      .where(and(eq(lessons.id, lessonId), eq(lessons.updatedAt, existing.updatedAt)))
      .returning();

    return updated ? { status: "ok" as const, updated } : { status: "conflict" as const };
  });

  if (result.status === "not_found") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (result.status === "conflict") {
    return NextResponse.json(
      { error: "This lesson was changed by someone else since you opened it. Reload and try again." },
      { status: 409 }
    );
  }
  return NextResponse.json(result.updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await db.delete(lessons).where(eq(lessons.id, Number(id)));
  return NextResponse.json({ ok: true });
}

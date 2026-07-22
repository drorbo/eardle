import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessons, lessonRevisions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lessonId = Number(id);
  const body = await req.json();
  const {
    topicId,
    slug,
    title,
    sortOrder,
    prerequisiteTopicId,
    practiceCategory,
    practiceExerciseIds,
    body: blocks,
    published,
  } = body;

  const now = Math.floor(Date.now() / 1000);
  const bodyJson = JSON.stringify(blocks ?? []);

  // Snapshot the previous body before overwriting — insurance against an
  // accidental overwrite, since lesson content has no Git history.
  const [existing] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (existing) {
    await db.insert(lessonRevisions).values({ lessonId, body: existing.body, createdAt: now });
  }

  const [updated] = await db
    .update(lessons)
    .set({
      topicId,
      slug,
      title,
      sortOrder,
      prerequisiteTopicId: prerequisiteTopicId || null,
      practiceCategory: practiceCategory || null,
      practiceExerciseIds: practiceExerciseIds && practiceExerciseIds.length ? JSON.stringify(practiceExerciseIds) : null,
      body: bodyJson,
      published: !!published,
      updatedAt: now,
    })
    .where(eq(lessons.id, lessonId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(lessons).where(eq(lessons.id, Number(id)));
  return NextResponse.json({ ok: true });
}

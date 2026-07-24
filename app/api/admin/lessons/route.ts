import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { lessons } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

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

  if (!topicId || !slug || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const [created] = await db
    .insert(lessons)
    .values({
      topicId,
      slug,
      title,
      sortOrder: sortOrder ?? 0,
      prerequisiteTopicId: prerequisiteTopicId || null,
      practiceCategory: practiceCategory || null,
      practiceExerciseIds: practiceExerciseIds && practiceExerciseIds.length ? JSON.stringify(practiceExerciseIds) : null,
      body: JSON.stringify(blocks ?? []),
      published: !!published,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

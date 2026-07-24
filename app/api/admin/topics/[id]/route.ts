import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { slug, title, description, sortOrder } = await req.json();

  const [updated] = await db
    .update(topics)
    .set({ slug, title, description: description ?? null, sortOrder, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(topics.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  // Cascades to that topic's lessons (and their progress/revisions) by FK —
  // acceptable for a content-management action taken deliberately by an admin.
  await db.delete(topics).where(eq(topics.id, Number(id)));
  return NextResponse.json({ ok: true });
}

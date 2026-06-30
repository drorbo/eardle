import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.exercises.findFirst({ where: eq(exercises.id, Number(id)) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...row, config: JSON.parse(row.config), choices: JSON.parse(row.choices) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { category, title, prompt, difficulty, config, choices, answer } = body;

  const [updated] = await db
    .update(exercises)
    .set({
      category,
      title,
      prompt,
      difficulty,
      config: JSON.stringify(config),
      choices: JSON.stringify(choices),
      answer,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(exercises.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...updated, config: JSON.parse(updated.config), choices: JSON.parse(updated.choices) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(exercises).where(eq(exercises.id, Number(id)));
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/authz";
import { isValidCategory } from "@/types/exercise";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.query.exercises.findFirst({ where: eq(exercises.id, Number(id)) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...row, config: JSON.parse(row.config), choices: JSON.parse(row.choices) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { category, title, prompt, difficulty, config, choices, answer, explanation } = body;

  if (category !== undefined && !isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

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
      explanation: explanation || null,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(exercises.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...updated, config: JSON.parse(updated.config), choices: JSON.parse(updated.choices) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await db.delete(exercises).where(eq(exercises.id, Number(id)));
  } catch (err: unknown) {
    // Postgres 23503 = foreign_key_violation. daily_puzzles/daily_attempts
    // reference exercises with onDelete: "restrict" specifically so a delete
    // is blocked (not silently cascaded) once an exercise has real daily
    // puzzle history — surface that clearly instead of a generic 500.
    // The postgres-js driver wraps the raw error under `.cause`, not on the
    // top-level error object itself.
    const pgCode =
      (err && typeof err === "object" && "code" in err && (err as { code?: string }).code) ||
      (err && typeof err === "object" && "cause" in err && err.cause && typeof err.cause === "object" && "code" in err.cause && (err.cause as { code?: string }).code);
    if (pgCode === "23503") {
      return NextResponse.json(
        { error: "Can't delete — this exercise has been used in a Daily EarDle puzzle and has attempt history tied to it." },
        { status: 409 }
      );
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}

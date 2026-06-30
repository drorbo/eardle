import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const random = searchParams.get("random") === "true";
  const excludeIds = searchParams.get("exclude")?.split(",").map(Number).filter(Boolean) ?? [];

  const conditions = [];
  if (category) conditions.push(eq(exercises.category, category as any));
  if (difficulty && difficulty !== "all") conditions.push(eq(exercises.difficulty, difficulty as any));

  let rows = await db
    .select()
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(random ? sql`RANDOM()` : exercises.id);

  if (excludeIds.length) {
    rows = rows.filter((r) => !excludeIds.includes(r.id));
  }

  const parsed = rows.map((r) => ({
    ...r,
    config: JSON.parse(r.config),
    choices: JSON.parse(r.choices),
  }));

  return NextResponse.json(parsed);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, title, prompt, difficulty, config, choices, answer } = body;

  if (!category || !title || !prompt || !difficulty || !config || !choices || !answer) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(exercises)
    .values({
      category,
      title,
      prompt,
      difficulty,
      config: JSON.stringify(config),
      choices: JSON.stringify(choices),
      answer,
    })
    .returning();

  return NextResponse.json({ ...created, config: JSON.parse(created.config), choices: JSON.parse(created.choices) }, { status: 201 });
}

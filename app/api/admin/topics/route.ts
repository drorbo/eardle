import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(topics).orderBy(asc(topics.sortOrder));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, title, description, sortOrder } = await req.json();
  if (!slug || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const now = Math.floor(Date.now() / 1000);
  const [created] = await db
    .insert(topics)
    .values({ slug, title, description: description || null, sortOrder: sortOrder ?? 0, createdAt: now, updatedAt: now })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const [session, body] = await Promise.all([auth(), req.json()]);
  const { sessionToken, exerciseId, answered, correct } = body;

  if (!sessionToken || !exerciseId || answered === undefined || correct === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

  const [created] = await db
    .insert(sessions)
    .values({ sessionToken, exerciseId, answered, correct, ...(userId ? { userId } : {}) })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

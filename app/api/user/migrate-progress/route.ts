import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionToken } = await req.json();
  if (!sessionToken || typeof sessionToken !== "string") {
    return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  await db
    .update(sessions)
    .set({ userId })
    .where(and(eq(sessions.sessionToken, sessionToken), isNull(sessions.userId)));

  return NextResponse.json({ migrated: true });
}

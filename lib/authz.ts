import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, error: null };
}

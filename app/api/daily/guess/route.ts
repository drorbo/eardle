import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyAttempts } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getOrCreateDailyPuzzle } from "@/lib/daily/generate";
import { DailyExerciseSnapshot } from "@/lib/daily/sanitize";
import { MAX_GUESSES, todaysPuzzleDateStr } from "@/lib/daily/config";
import { persistDailyStreak } from "@/lib/daily/streak";

export async function POST(req: NextRequest) {
  const [session, body] = await Promise.all([auth(), req.json()]);
  const { token, choice } = body ?? {};
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  if (!token || !choice) {
    return NextResponse.json({ error: "Missing token or choice" }, { status: 400 });
  }

  const puzzle = await getOrCreateDailyPuzzle(todaysPuzzleDateStr());
  if (!puzzle) {
    return NextResponse.json({ error: "No puzzle available today" }, { status: 404 });
  }

  // Only source of truth for the answer — the client's claim is never consulted.
  const snapshot: DailyExerciseSnapshot = JSON.parse(puzzle.exerciseSnapshot);
  if (!snapshot.choices.includes(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
  }

  const identityWhere = userId
    ? and(eq(dailyAttempts.puzzleId, puzzle.id), eq(dailyAttempts.userId, userId))
    : and(eq(dailyAttempts.puzzleId, puzzle.id), isNull(dailyAttempts.userId), eq(dailyAttempts.sessionToken, token));

  const existing = await db.query.dailyAttempts.findFirst({ where: identityWhere });

  if (existing) {
    if (existing.status !== "in_progress") {
      return NextResponse.json(
        {
          error: "Puzzle already finished",
          status: existing.status,
          guesses: JSON.parse(existing.guesses),
          exercise: snapshot,
        },
        { status: 409 }
      );
    }

    const priorGuesses: string[] = JSON.parse(existing.guesses);
    if (priorGuesses.includes(choice)) {
      return NextResponse.json({ error: "Already tried this choice" }, { status: 400 });
    }

    const correct = choice === snapshot.answer;
    const newGuesses = [...priorGuesses, choice];
    const newStatus = correct ? "won" : newGuesses.length >= MAX_GUESSES ? "lost" : "in_progress";
    const now = Math.floor(Date.now() / 1000);

    const [updated] = await db
      .update(dailyAttempts)
      .set({
        guesses: JSON.stringify(newGuesses),
        status: newStatus,
        finalGuessCount: newStatus === "in_progress" ? null : newGuesses.length,
        finishedAt: newStatus === "in_progress" ? null : now,
        updatedAt: now,
      })
      .where(and(eq(dailyAttempts.id, existing.id), eq(dailyAttempts.status, "in_progress")))
      .returning();

    // 0 rows means we lost a race (already finished by a concurrent request) — return current state.
    if (!updated) {
      const current = await db.query.dailyAttempts.findFirst({ where: eq(dailyAttempts.id, existing.id) });
      return NextResponse.json(
        {
          error: "Puzzle already finished",
          status: current?.status,
          guesses: current ? JSON.parse(current.guesses) : newGuesses,
          exercise: snapshot,
        },
        { status: 409 }
      );
    }

    if (newStatus !== "in_progress") {
      await persistDailyStreak(userId, token);
    }

    return NextResponse.json({
      correct,
      status: newStatus,
      guesses: newGuesses,
      guessNumber: newGuesses.length,
      remainingGuesses: MAX_GUESSES - newGuesses.length,
      exercise: newStatus === "in_progress" ? undefined : snapshot,
    });
  }

  // First guess for this identity today.
  const correct = choice === snapshot.answer;
  const guesses = [choice];
  const status = correct ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "in_progress";
  const now = Math.floor(Date.now() / 1000);
  const config = snapshot.config as { type?: string; topic?: string };

  try {
    await db.insert(dailyAttempts).values({
      puzzleId: puzzle.id,
      userId: userId ?? undefined,
      sessionToken: token,
      category: snapshot.category,
      difficulty: snapshot.difficulty,
      exerciseId: snapshot.id,
      exerciseType: config.type ?? null,
      topic: config.topic ?? null,
      guesses: JSON.stringify(guesses),
      status,
      finalGuessCount: status === "in_progress" ? null : guesses.length,
      finishedAt: status === "in_progress" ? null : now,
    });
  } catch {
    // Lost a race against a concurrent first guess from the same identity (unique
    // index violation) — this specific guess was never recorded, ask the client to retry.
    return NextResponse.json({ error: "Guess conflict, please retry" }, { status: 409 });
  }

  if (status !== "in_progress") {
    await persistDailyStreak(userId, token);
  }

  return NextResponse.json({
    correct,
    status,
    guesses,
    guessNumber: guesses.length,
    remainingGuesses: MAX_GUESSES - guesses.length,
    exercise: status === "in_progress" ? undefined : snapshot,
  });
}

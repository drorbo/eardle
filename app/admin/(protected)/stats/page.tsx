import { db } from "@/lib/db";
import { sessions, exercises, feedback } from "@/lib/db/schema";
import { sql, eq, gte, isNull, isNotNull } from "drizzle-orm";
import { CATEGORY_META } from "@/types/exercise";
import type { Category } from "@/types/exercise";

export const dynamic = "force-dynamic";

const CATEGORY_ORDER: Category[] = ["note", "interval", "chord", "progression", "scale"];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

export default async function AdminStatsPage() {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400);
  const weekStart = now - (now % 604800);

  const [
    [totalRow],
    [todayRow],
    [weekRow],
    [accuracyRow],
    [signedPlayersRow],
    [guestUsersRow],
    [feedbackRow],
    categoryRows,
    topExercises,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(sessions),
    db.select({ count: sql<number>`count(*)` }).from(sessions).where(gte(sessions.createdAt, todayStart)),
    db.select({ count: sql<number>`count(*)` }).from(sessions).where(gte(sessions.createdAt, weekStart)),
    db.select({
      total: sql<number>`count(*)`,
      correct: sql<number>`sum(${sessions.correct}::int)`,
    }).from(sessions),
    db.select({ count: sql<number>`count(distinct ${sessions.userId})` }).from(sessions).where(isNotNull(sessions.userId)),
    db.select({ count: sql<number>`count(distinct ${sessions.sessionToken})` }).from(sessions).where(isNull(sessions.userId)),
    db.select({ count: sql<number>`count(*)` }).from(feedback),
    db.select({
      category: exercises.category,
      plays: sql<number>`count(*)`,
      correct: sql<number>`sum(${sessions.correct}::int)`,
    })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.category),
    db.select({
      id: exercises.id,
      title: exercises.title,
      category: exercises.category,
      plays: sql<number>`count(*)`,
      correct: sql<number>`sum(${sessions.correct}::int)`,
    })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.id, exercises.title, exercises.category)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  ]);

  const totalPlays = Number(totalRow.count);
  const todayPlays = Number(todayRow.count);
  const weekPlays = Number(weekRow.count);
  const totalCorrect = Number(accuracyRow.correct ?? 0);
  const overallAccuracy = totalPlays > 0 ? Math.round((totalCorrect / totalPlays) * 100) : 0;
  const uniqueSignedPlayers = Number(signedPlayersRow.count);
  const uniqueGuestUsers = Number(guestUsersRow.count);
  const feedbackCount = Number(feedbackRow.count);

  const catMap = Object.fromEntries(categoryRows.map((r) => [r.category, r]));

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-text mb-6">Usage Stats</h1>

      {/* Row 1: key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Plays" value={totalPlays.toLocaleString()} />
        <StatCard label="Today" value={todayPlays.toLocaleString()} />
        <StatCard label="This Week" value={weekPlays.toLocaleString()} />
        <StatCard label="Unique Signed Players" value={uniqueSignedPlayers.toLocaleString()} />
      </div>

      {/* Row 2: category table + overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">By Category</h2>
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-text-subtle">
                <th className="text-left pb-2">Category</th>
                <th className="text-right pb-2">Plays</th>
                <th className="text-right pb-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((cat) => {
                const row = catMap[cat];
                const plays = row ? Number(row.plays) : 0;
                const correct = row ? Number(row.correct ?? 0) : 0;
                const acc = plays > 0 ? Math.round((correct / plays) * 100) : 0;
                const meta = CATEGORY_META[cat];
                return (
                  <tr key={cat} className="border-t border-border-subtle/60">
                    <td className="py-2 text-xs text-text-secondary">
                      {meta.emoji} {meta.label}
                    </td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-text-muted">
                      {plays > 0 ? `${acc}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Overview</h2>
          <div className="mt-2">
            <QuickStat label="Unique Guest Users" value={uniqueGuestUsers.toLocaleString()} />
            <QuickStat
              label="Overall Accuracy"
              value={totalPlays > 0 ? `${overallAccuracy}%` : "—"}
            />
            <QuickStat label="Feedbacks Left" value={feedbackCount.toLocaleString()} />
          </div>
        </div>
      </div>

      {/* Row 3: top exercises */}
      <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Top 10 Most Played
        </h2>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-text-subtle">
              <th className="text-left pb-2 w-6">#</th>
              <th className="text-left pb-2">Exercise</th>
              <th className="text-left pb-2 hidden sm:table-cell">Category</th>
              <th className="text-right pb-2">Plays</th>
              <th className="text-right pb-2">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {topExercises.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-text-faint">
                  No exercise plays recorded yet
                </td>
              </tr>
            ) : (
              topExercises.map((ex, i) => {
                const plays = Number(ex.plays);
                const correct = Number(ex.correct ?? 0);
                const acc = plays > 0 ? Math.round((correct / plays) * 100) : 0;
                const meta = CATEGORY_META[ex.category as Category];
                return (
                  <tr key={ex.id} className="border-t border-border-subtle/60">
                    <td className="py-2 text-xs text-text-faint">{i + 1}</td>
                    <td className="py-2 text-xs text-text-secondary">{ex.title}</td>
                    <td className="py-2 text-xs text-text-muted hidden sm:table-cell">
                      {meta?.emoji} {meta?.label}
                    </td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-text-muted">
                      {plays > 0 ? `${acc}%` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

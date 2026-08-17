import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  getDailyActiveActors,
  getActiveActorCounts,
} from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
    </div>
  );
}

export async function OverviewTab() {
  const nowSec = Math.floor(Date.now() / 1000);
  const [
    [totalRow],
    [todayRow],
    [signedUpRow],
    [accuracyRow],
    dailyActives,
    activeCounts,
  ] = await Promise.all([
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM sessions`),
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM sessions WHERE created_at >= ${nowSec - 86400}`),
    db.execute<{ count: number }>(sql`SELECT count(*)::int AS count FROM users`),
    db.execute<{ total: number; correct: number }>(sql`SELECT count(*)::int AS total, sum(correct::int)::int AS correct FROM sessions`),
    getDailyActiveActors(90),
    getActiveActorCounts(),
  ]);

  const totalPlays = totalRow?.count ?? 0;
  const todayPlays = todayRow?.count ?? 0;
  const signedUpUsers = signedUpRow?.count ?? 0;
  const overallAccuracy = accuracyRow?.total ? Math.round(((accuracyRow.correct ?? 0) / accuracyRow.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Plays" value={totalPlays.toLocaleString()} />
        <StatCard label="Plays Today" value={todayPlays.toLocaleString()} />
        <StatCard label="Signed-Up Users" value={signedUpUsers.toLocaleString()} />
        <StatCard label="Active Today" value={activeCounts.dau.toLocaleString()} />
        <StatCard label="Overall Accuracy" value={totalPlays > 0 ? `${overallAccuracy}%` : "—"} />
        <StatCard label="Stickiness" value={`${activeCounts.stickiness}%`} sub="DAU / MAU" />
      </div>

      <ChartCard title="Daily Active Users" description="Blended signed-up + guest actors, last 90 days">
        <LineChart
          series={[{ key: "dau", label: "Active users", color: "var(--chart-accent)", points: dailyActives.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]}
        />
      </ChartCard>
    </div>
  );
}

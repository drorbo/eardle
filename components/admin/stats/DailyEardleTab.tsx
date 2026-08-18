import { getDailyAttemptsOverTime, getDailyWinStats, getStreakDistribution } from "@/lib/db/stats";
import { CATEGORY_META } from "@/types/exercise";
import type { Category } from "@/types/exercise";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { PercentBarChart } from "@/components/admin/charts/PercentBarChart";
import { TableView } from "@/components/admin/charts/TableView";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

export async function DailyEardleTab() {
  const [attemptsOverTime, winStats, dailyStreaks] = await Promise.all([
    getDailyAttemptsOverTime(90),
    getDailyWinStats(),
    getStreakDistribution("daily"),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Overall Win Rate" value={`${winStats.overallWinRate}%`} />
        <StatCard label="Avg. Guesses to Win" value={winStats.avgGuessesToWin.toFixed(1)} />
        <StatCard label="Total Attempts" value={winStats.byCategory.reduce((s, c) => s + c.attempts, 0).toLocaleString()} />
      </div>

      <ChartCard title="Daily EarDle Attempts" description="Last 90 days">
        <LineChart series={[{ key: "attempts", label: "Attempts", color: "var(--chart-accent)", points: attemptsOverTime.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <ChartCard
        title="Win Rate by Category"
        tableView={
          <TableView
            columns={[{ key: "category", label: "Category" }, { key: "winRate", label: "Win rate" }, { key: "attempts", label: "Attempts" }]}
            rows={winStats.byCategory.map((c) => ({ category: CATEGORY_META[c.category as Category]?.label ?? c.category, winRate: `${c.winRate}%`, attempts: c.attempts }))}
          />
        }
      >
        <PercentBarChart
          groups={winStats.byCategory.map((c) => ({
            label: CATEGORY_META[c.category as Category]?.label ?? c.category,
            values: [{ key: c.category, label: "Win rate", color: "var(--chart-good)", value: c.winRate }],
          }))}
        />
      </ChartCard>

      <ChartCard
        title="Daily EarDle Streak Distribution"
        tableView={
          <TableView
            columns={[{ key: "bucket", label: "Streak length" }, { key: "count", label: "Actors" }]}
            rows={dailyStreaks.map((b) => ({ bucket: `${b.bucket} days`, count: b.count }))}
          />
        }
      >
        <BarChart
          groups={dailyStreaks.map((b) => ({
            label: `${b.bucket}d`,
            values: [{ key: b.bucket, label: `${b.bucket} days`, color: "var(--chart-accent)", value: b.count }],
          }))}
        />
      </ChartCard>
    </div>
  );
}

import {
  getSignupsOverTime,
  getDailyActiveActors,
  getActiveActorCounts,
  getStreakDistribution,
  getSignedUpVsGuestSplit,
} from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

export async function GrowthTab() {
  const [signups, dailyActives, activeCounts, exerciseStreaks, signedUpVsGuest] = await Promise.all([
    getSignupsOverTime(90),
    getDailyActiveActors(90),
    getActiveActorCounts(),
    getStreakDistribution("exercise"),
    getSignedUpVsGuestSplit(),
  ]);

  return (
    <div className="space-y-6">
      <ChartCard title="Signups Over Time" description="New accounts per day, last 90 days">
        <LineChart series={[{ key: "signups", label: "Signups", color: "var(--chart-accent)", points: signups.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <ChartCard title="Daily Active Users" description="Blended signed-up + guest actors, last 90 days">
        <LineChart series={[{ key: "dau", label: "Active users", color: "var(--chart-accent)", points: dailyActives.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })) }]} />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Activity</h2>
          <QuickStat label="Daily Active Users" value={activeCounts.dau.toLocaleString()} />
          <QuickStat label="Weekly Active Users" value={activeCounts.wau.toLocaleString()} />
          <QuickStat label="Monthly Active Users" value={activeCounts.mau.toLocaleString()} />
          <QuickStat label="Stickiness (DAU/MAU)" value={`${activeCounts.stickiness}%`} />
        </div>
        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Signed-Up vs. Guest</h2>
          <QuickStat label="Signed-Up Actors (all-time)" value={signedUpVsGuest.signedUp.toLocaleString()} />
          <QuickStat label="Guest Actors (all-time)" value={signedUpVsGuest.guest.toLocaleString()} />
        </div>
      </div>

      <ChartCard
        title="Exercise Streak Distribution"
        description="How many actors currently have each streak length"
        tableView={
          <TableView
            columns={[{ key: "bucket", label: "Streak length" }, { key: "count", label: "Actors" }]}
            rows={exerciseStreaks.map((b) => ({ bucket: `${b.bucket} days`, count: b.count }))}
          />
        }
      >
        <BarChart
          groups={exerciseStreaks.map((b) => ({
            label: `${b.bucket}d`,
            values: [{ key: b.bucket, label: `${b.bucket} days`, color: "var(--chart-accent)", value: b.count }],
          }))}
        />
      </ChartCard>
    </div>
  );
}

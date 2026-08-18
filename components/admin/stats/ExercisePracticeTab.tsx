import { db } from "@/lib/db";
import { sessions, exercises } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { CATEGORY_META } from "@/types/exercise";
import type { Category } from "@/types/exercise";
import { getPlaysOverTimeByCategory, getDifficultyBreakdown } from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { LineChart, type LineSeries } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";
import { Legend } from "@/components/admin/charts/Legend";

const CATEGORY_ORDER: Category[] = ["note", "interval", "chord", "progression", "scale"];
// Chart draw order is NOT CATEGORY_ORDER — see the plan's "Chart color tokens"
// section for why (this is the validated CVD-safe adjacency order).
const CATEGORY_CHART_ORDER: Category[] = ["scale", "chord", "interval", "progression", "note"];
const CATEGORY_CHART_COLOR: Record<Category, string> = {
  scale: "var(--chart-cat-scale)",
  chord: "var(--chart-cat-chord)",
  interval: "var(--chart-cat-interval)",
  progression: "var(--chart-cat-progression)",
  note: "var(--chart-cat-note)",
};

export async function ExercisePracticeTab() {
  const [categoryRows, topExercises, playsOverTime, difficultyBreakdown] = await Promise.all([
    db
      .select({ category: exercises.category, plays: sql<number>`count(*)::int`, correct: sql<number>`sum(${sessions.correct}::int)::int` })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.category),
    db
      .select({ id: exercises.id, title: exercises.title, category: exercises.category, plays: sql<number>`count(*)::int`, correct: sql<number>`sum(${sessions.correct}::int)::int` })
      .from(sessions)
      .innerJoin(exercises, eq(sessions.exerciseId, exercises.id))
      .groupBy(exercises.id, exercises.title, exercises.category)
      .orderBy(sql`count(*) desc`)
      .limit(10),
    getPlaysOverTimeByCategory(90),
    getDifficultyBreakdown(),
  ]);

  const catMap = Object.fromEntries(categoryRows.map((r) => [r.category, r]));

  const categoryLines: LineSeries[] = CATEGORY_CHART_ORDER.map((cat) => ({
    key: cat,
    label: CATEGORY_META[cat].label,
    color: CATEGORY_CHART_COLOR[cat],
    points: playsOverTime.map((p) => ({ x: Date.parse(p.day) / 1000, y: p[cat] })),
  }));

  return (
    <div className="space-y-6">
      <ChartCard
        title="Plays Over Time by Category"
        description="Last 90 days"
        tableView={
          <TableView
            columns={[{ key: "day", label: "Day" }, ...CATEGORY_CHART_ORDER.map((c) => ({ key: c, label: CATEGORY_META[c].label }))]}
            rows={playsOverTime.map((p) => ({ ...p }))}
          />
        }
      >
        <LineChart series={categoryLines} />
        <Legend items={categoryLines.map((s) => ({ label: s.label, color: s.color }))} />
      </ChartCard>

      <ChartCard
        title="Difficulty Breakdown"
        description="All-time plays and accuracy by difficulty"
        tableView={
          <TableView
            columns={[{ key: "difficulty", label: "Difficulty" }, { key: "plays", label: "Plays" }, { key: "accuracy", label: "Accuracy" }]}
            rows={difficultyBreakdown.map((d) => ({ difficulty: d.difficulty, plays: d.plays, accuracy: d.accuracy >= 0 ? `${d.accuracy}%` : "—" }))}
          />
        }
      >
        <BarChart
          groups={difficultyBreakdown.map((d) => ({
            label: d.difficulty,
            values: [{ key: d.difficulty, label: d.difficulty, color: `var(--chart-diff-${d.difficulty})`, value: d.plays }],
          }))}
        />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <td className="py-2 text-xs text-text-secondary">{meta.emoji} {meta.label}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays.toLocaleString()}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{plays > 0 ? `${acc}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top 10 Most Played</h2>
          <table className="w-full">
            <thead>
              <tr className="text-[11px] text-text-subtle">
                <th className="text-left pb-2 w-6">#</th>
                <th className="text-left pb-2">Exercise</th>
                <th className="text-right pb-2">Plays</th>
              </tr>
            </thead>
            <tbody>
              {topExercises.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-xs text-text-faint">No exercise plays recorded yet</td></tr>
              ) : (
                topExercises.map((ex, i) => (
                  <tr key={ex.id} className="border-t border-border-subtle/60">
                    <td className="py-2 text-xs text-text-faint">{i + 1}</td>
                    <td className="py-2 text-xs text-text-secondary">{ex.title}</td>
                    <td className="py-2 text-right text-xs text-text-muted">{Number(ex.plays).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

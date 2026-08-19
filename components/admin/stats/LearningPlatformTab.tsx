import {
  getLessonEngagementFunnel,
  getTopicEngagement,
  getTopLessons,
  getLearnAdoptionStats,
  getNewLearnersOverTime,
  getLessonProgressionByStep,
} from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { BarChart } from "@/components/admin/charts/BarChart";
import { LineChart } from "@/components/admin/charts/LineChart";
import { TableView } from "@/components/admin/charts/TableView";
import { Legend } from "@/components/admin/charts/Legend";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
    </div>
  );
}

export async function LearningPlatformTab() {
  const [funnel, topicEngagement, topLessons, adoption, newLearners, progression] = await Promise.all([
    getLessonEngagementFunnel(),
    getTopicEngagement(),
    getTopLessons(10),
    getLearnAdoptionStats(),
    getNewLearnersOverTime(90),
    getLessonProgressionByStep(),
  ]);

  // Plain data, not a function — a Server Component can't pass a closure
  // into LineChart (a Client Component); see LineChart's `xLabelMap` prop.
  const stepLabels = Object.fromEntries(progression.map((s) => [s.position, `${s.topicTitle} — ${s.title}`]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Learners Reached" value={adoption.totalLearners.toLocaleString()} />
        <StatCard label="Adoption Rate" value={`${adoption.adoptionRate}%`} sub="of all site users" />
        <StatCard label="Activated Learners" value={adoption.activatedLearners.toLocaleString()} sub="completed ≥1 lesson" />
        <StatCard label="Avg. Lessons Completed" value={adoption.avgLessonsCompleted.toFixed(1)} sub="per activated learner" />
      </div>

      <ChartCard title="New Learners Over Time" description="First-ever Learn activity, last 90 days">
        <LineChart
          series={[
            {
              key: "new-learners",
              label: "New learners",
              color: "var(--chart-accent)",
              points: newLearners.map((p) => ({ x: Date.parse(p.day) / 1000, y: p.value })),
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Learning Path Progression"
        description="Viewed vs. completed at each step of the curriculum — where engagement drops off"
        tableView={
          <TableView
            columns={[
              { key: "step", label: "Step" },
              { key: "lesson", label: "Lesson" },
              { key: "topic", label: "Topic" },
              { key: "viewed", label: "Viewed" },
              { key: "completed", label: "Completed" },
            ]}
            rows={progression.map((s) => ({
              step: s.position + 1,
              lesson: s.title,
              topic: s.topicTitle,
              viewed: s.viewed,
              completed: s.completed,
            }))}
          />
        }
      >
        <LineChart
          series={[
            {
              key: "viewed",
              label: "Viewed",
              color: "var(--chart-accent)",
              points: progression.map((s) => ({ x: s.position, y: s.viewed })),
            },
            {
              key: "completed",
              label: "Completed",
              color: "var(--chart-good)",
              points: progression.map((s) => ({ x: s.position, y: s.completed })),
            },
          ]}
          xLabelMap={stepLabels}
        />
        <Legend items={[{ label: "Viewed", color: "var(--chart-accent)" }, { label: "Completed", color: "var(--chart-good)" }]} />
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Published Lessons" value={funnel.totalLessons.toLocaleString()} />
        <StatCard label="Viewed (not completed)" value={funnel.viewedOnly.toLocaleString()} />
        <StatCard label="Completed" value={funnel.completed.toLocaleString()} />
      </div>

      <ChartCard
        title="Completion Funnel"
        description="Never touched → viewed only → viewed & practiced"
        tableView={
          <TableView
            columns={[{ key: "stage", label: "Stage" }, { key: "lessons", label: "Lessons" }]}
            rows={[
              { stage: "Never touched", lessons: funnel.neverTouched },
              { stage: "Viewed only", lessons: funnel.viewedOnly },
              { stage: "Completed", lessons: funnel.completed },
            ]}
          />
        }
      >
        <BarChart
          groups={[
            { label: "Never touched", values: [{ key: "never", label: "Never touched", color: "var(--border-subtle)", value: funnel.neverTouched }] },
            { label: "Viewed only", values: [{ key: "viewed", label: "Viewed only", color: "var(--chart-diff-medium)", value: funnel.viewedOnly }] },
            { label: "Completed", values: [{ key: "completed", label: "Completed", color: "var(--chart-good)", value: funnel.completed }] },
          ]}
        />
      </ChartCard>

      <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">By Topic</h2>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-text-subtle">
              <th className="text-left pb-2">Topic</th>
              <th className="text-right pb-2">Views</th>
              <th className="text-right pb-2">Completions</th>
            </tr>
          </thead>
          <tbody>
            {topicEngagement.map((t) => (
              <tr key={t.topicId} className="border-t border-border-subtle/60">
                <td className="py-2 text-xs text-text-secondary">{t.topicTitle}</td>
                <td className="py-2 text-right text-xs text-text-muted">{t.views.toLocaleString()}</td>
                <td className="py-2 text-right text-xs text-text-muted">{t.completions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Top 10 Most Engaged Lessons</h2>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-text-subtle">
              <th className="text-left pb-2 w-6">#</th>
              <th className="text-left pb-2">Lesson</th>
              <th className="text-left pb-2 hidden sm:table-cell">Topic</th>
              <th className="text-right pb-2">Views</th>
              <th className="text-right pb-2">Completions</th>
            </tr>
          </thead>
          <tbody>
            {topLessons.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-text-faint">No lesson activity recorded yet</td></tr>
            ) : (
              topLessons.map((lesson, i) => (
                <tr key={lesson.lessonId} className="border-t border-border-subtle/60">
                  <td className="py-2 text-xs text-text-faint">{i + 1}</td>
                  <td className="py-2 text-xs text-text-secondary">{lesson.title}</td>
                  <td className="py-2 text-xs text-text-muted hidden sm:table-cell">{lesson.topicTitle}</td>
                  <td className="py-2 text-right text-xs text-text-muted">{lesson.views.toLocaleString()}</td>
                  <td className="py-2 text-right text-xs text-text-muted">{lesson.completions.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

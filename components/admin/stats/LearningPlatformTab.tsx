import { getLessonEngagementFunnel, getTopicEngagement, getTopLessons } from "@/lib/db/stats";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { BarChart } from "@/components/admin/charts/BarChart";
import { TableView } from "@/components/admin/charts/TableView";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border-subtle rounded-xl p-4">
      <p className="text-xs text-text-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

export async function LearningPlatformTab() {
  const [funnel, topicEngagement, topLessons] = await Promise.all([
    getLessonEngagementFunnel(),
    getTopicEngagement(),
    getTopLessons(10),
  ]);

  return (
    <div className="space-y-6">
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

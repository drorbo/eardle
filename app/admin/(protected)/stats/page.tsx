import { StatsTabs } from "@/components/admin/stats/StatsTabs";
import { OverviewTab } from "@/components/admin/stats/OverviewTab";
import { GrowthTab } from "@/components/admin/stats/GrowthTab";
import { ExercisePracticeTab } from "@/components/admin/stats/ExercisePracticeTab";
import { DailyEardleTab } from "@/components/admin/stats/DailyEardleTab";
import { LearningPlatformTab } from "@/components/admin/stats/LearningPlatformTab";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-bold text-text mb-6">Usage Stats</h1>
      <StatsTabs
        overview={<OverviewTab />}
        growth={<GrowthTab />}
        exercisePractice={<ExercisePracticeTab />}
        dailyEardle={<DailyEardleTab />}
        learningPlatform={<LearningPlatformTab />}
      />
    </div>
  );
}

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

async function getCounts() {
  const categoryCounts = await db
    .select({ category: exercisesTable.category, count: sql<number>`count(*)` })
    .from(exercisesTable)
    .groupBy(exercisesTable.category);

  const topicCounts = await db
    .select({
      category: exercisesTable.category,
      topic: sql<string>`json_extract(${exercisesTable.config}, '$.topic')`,
      count: sql<number>`count(*)`,
    })
    .from(exercisesTable)
    .groupBy(
      exercisesTable.category,
      sql`json_extract(${exercisesTable.config}, '$.topic')`,
    );

  return { categoryCounts, topicCounts };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { categoryCounts, topicCounts } = await getCounts();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <AdminSidebar categoryCounts={categoryCounts} topicCounts={topicCounts} />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}

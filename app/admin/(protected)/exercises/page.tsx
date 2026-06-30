import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { Category, Difficulty, Exercise } from "@/types/exercise";
import { AdminExerciseBrowser } from "@/components/admin/AdminExerciseBrowser";

interface Props {
  searchParams: Promise<{ category?: string; topic?: string }>;
}

async function getExercises(category?: string, topic?: string): Promise<Exercise[]> {
  const conditions = [];
  if (category) conditions.push(eq(exercisesTable.category, category as Category));
  if (topic)    conditions.push(sql`(${exercisesTable.config}::jsonb)->>'topic' = ${topic}`);

  const rows = conditions.length
    ? await db.select().from(exercisesTable).where(and(...conditions)).orderBy(exercisesTable.id)
    : await db.select().from(exercisesTable).orderBy(exercisesTable.category, exercisesTable.id);

  return rows.map(r => ({
    ...r,
    config:  JSON.parse(r.config),
    choices: JSON.parse(r.choices),
  })) as Exercise[];
}

export default async function AdminExerciseList({ searchParams }: Props) {
  const { category, topic } = await searchParams;
  const exercises = await getExercises(category, topic);

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <AdminExerciseBrowser
        exercises={exercises}
        selectedCategory={category}
        selectedTopic={topic}
      />
    </div>
  );
}

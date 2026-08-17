import { notFound } from "next/navigation";
import { ExerciseForm } from "@/components/admin/ExerciseForm";
import { Exercise } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExercise({ params }: Props) {
  const { id } = await params;
  const row = await db.query.exercises.findFirst({ where: eq(exercisesTable.id, Number(id)) });
  if (!row) notFound();

  const exercise: Exercise = {
    ...row,
    config:  JSON.parse(row.config),
    choices: JSON.parse(row.choices),
  } as Exercise;

  return (
    <div className="overflow-y-auto flex-1">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text mb-2">Edit Exercise</h1>
        <p className="text-text-muted text-sm mb-8">{exercise.title}</p>
        <ExerciseForm initial={exercise} />
      </div>
    </div>
  );
}

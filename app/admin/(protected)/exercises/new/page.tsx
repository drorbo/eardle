import { ExerciseForm } from "@/components/admin/ExerciseForm";

export default function NewExercise() {
  return (
    <div className="overflow-y-auto flex-1">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">New Exercise</h1>
        <ExerciseForm />
      </div>
    </div>
  );
}

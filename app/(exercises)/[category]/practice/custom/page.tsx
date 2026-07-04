import { notFound } from "next/navigation";
import { CATEGORY_META, Category, Exercise } from "@/types/exercise";
import { db } from "@/lib/db";
import { exercises as exercisesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CustomPackagePicker } from "@/components/exercise/CustomPackagePicker";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CustomPackagePage({ params }: Props) {
  const { category } = await params;
  if (!CATEGORY_META[category as Category]) notFound();
  const cat = category as Category;
  const meta = CATEGORY_META[cat];

  const rows = await db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.category, cat))
    .orderBy(exercisesTable.difficulty, exercisesTable.id);

  const items: Exercise[] = rows.map((r) => ({
    ...r,
    config: JSON.parse(r.config),
    choices: JSON.parse(r.choices),
  })) as Exercise[];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{meta.emoji}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Custom Package</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Pick exactly which {meta.label.toLowerCase()} exercises to drill this session.
          </p>
        </div>
      </div>

      <CustomPackagePicker category={cat} exercises={items} />
    </div>
  );
}

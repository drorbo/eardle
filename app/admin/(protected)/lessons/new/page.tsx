import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { LessonForm } from "@/components/admin/lesson/LessonForm";

interface Props {
  searchParams: Promise<{ topicId?: string }>;
}

export default async function NewLessonPage({ searchParams }: Props) {
  const { topicId } = await searchParams;
  const topicRows = await db.select().from(topics).orderBy(asc(topics.sortOrder));

  return (
    <div className="overflow-y-auto flex-1 bg-bg text-text">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text mb-8">New Lesson</h1>
        <LessonForm
          topics={topicRows.map((t) => ({ id: t.id, title: t.title }))}
          defaultTopicId={topicId ? Number(topicId) : undefined}
        />
      </div>
    </div>
  );
}

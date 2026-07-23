export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getLessonById } from "@/lib/db/lessons";
import { LessonForm } from "@/components/admin/lesson/LessonForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: Props) {
  const { id } = await params;
  const lesson = await getLessonById(Number(id));
  if (!lesson) notFound();

  const topicRows = await db.select().from(topics).orderBy(asc(topics.sortOrder));

  return (
    <div className="overflow-y-auto flex-1 bg-bg text-text">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text mb-2">Edit Lesson</h1>
        <p className="text-text-muted text-sm mb-8">{lesson.title}</p>
        <LessonForm topics={topicRows.map((t) => ({ id: t.id, title: t.title }))} initial={lesson} />
      </div>
    </div>
  );
}

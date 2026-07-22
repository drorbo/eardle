import Link from "next/link";
import { getTopicsWithLessons } from "@/lib/db/lessons";
import { NewTopicForm } from "@/components/admin/lesson/TopicManager";
import { DeleteButton } from "@/components/admin/lesson/DeleteButton";

export default async function AdminLessonsPage() {
  const topics = await getTopicsWithLessons({ includeUnpublished: true });

  return (
    <div className="overflow-y-auto flex-1 bg-bg text-text">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-text mb-6">Lessons</h1>

        <div className="mb-8">
          <NewTopicForm />
        </div>

        <div className="space-y-8">
          {topics.map((topic) => (
            <section key={topic.id} className="p-4 rounded-xl bg-surface border border-border-subtle">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text">{topic.title}</h2>
                  {topic.description && <p className="text-text-muted text-sm">{topic.description}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/admin/lessons/new?topicId=${topic.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap"
                  >
                    + New Lesson
                  </Link>
                  <DeleteButton url={`/api/admin/topics/${topic.id}`} label="Delete Topic" />
                </div>
              </div>
              <div className="space-y-1.5">
                {topic.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2"
                  >
                    <Link
                      href={`/admin/lessons/${lesson.id}/edit`}
                      className="text-sm text-text hover:text-indigo-400 transition flex items-center gap-2"
                    >
                      {lesson.title}
                      {!lesson.published && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          draft
                        </span>
                      )}
                    </Link>
                    <DeleteButton url={`/api/admin/lessons/${lesson.id}`} />
                  </div>
                ))}
                {topic.lessons.length === 0 && (
                  <p className="text-text-faint text-xs italic">No lessons yet.</p>
                )}
              </div>
            </section>
          ))}
          {topics.length === 0 && (
            <p className="text-text-subtle text-sm">No topics yet — create one to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}

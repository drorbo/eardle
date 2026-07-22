"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META, Category, Exercise } from "@/types/exercise";
import type { LessonBlock, LessonDetail } from "@/types/lesson";
import { ExercisePicker } from "@/components/exercise/ExercisePicker";
import { BlockEditor } from "@/components/admin/lesson/BlockEditor";

interface TopicOption {
  id: number;
  title: string;
}

interface Props {
  topics: TopicOption[];
  initial?: LessonDetail;
  defaultTopicId?: number;
}

const CATEGORIES: Category[] = ["note", "interval", "chord", "progression", "scale"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function LessonForm({ topics, initial, defaultTopicId }: Props) {
  const router = useRouter();
  const [topicId, setTopicId] = useState(initial?.topicId ?? defaultTopicId ?? topics[0]?.id ?? 0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [prerequisiteTopicId, setPrerequisiteTopicId] = useState<number | null>(
    initial?.prerequisiteTopicId ?? null
  );
  const [published, setPublished] = useState(initial?.published ?? false);
  const [blocks, setBlocks] = useState<LessonBlock[]>(initial?.body ?? []);

  const [practiceCategory, setPracticeCategory] = useState<Category | "">(initial?.practiceCategory ?? "");
  const [practiceExercises, setPracticeExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<number>>(
    new Set(initial?.practiceExerciseIds ?? [])
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!practiceCategory) {
      setPracticeExercises([]);
      return;
    }
    fetch(`/api/exercises?category=${practiceCategory}`)
      .then((r) => r.json())
      .then(setPracticeExercises)
      .catch(() => setPracticeExercises([]));
  }, [practiceCategory]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      topicId,
      slug,
      title,
      sortOrder,
      prerequisiteTopicId,
      practiceCategory: practiceCategory || null,
      practiceExerciseIds: [...selectedExerciseIds],
      body: blocks,
      published,
    };

    const url = initial ? `/api/admin/lessons/${initial.id}` : "/api/admin/lessons";
    const method = initial ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save.");
      setSaving(false);
      return;
    }

    router.push("/admin/lessons");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Topic</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(Number(e.target.value))}
            className="field-input"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Sort order within topic</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="field-input"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Title</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Slug</label>
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">
          Prerequisite topic <span className="text-text-faint">(shown as an informational link, never enforced)</span>
        </label>
        <select
          value={prerequisiteTopicId ?? ""}
          onChange={(e) => setPrerequisiteTopicId(e.target.value ? Number(e.target.value) : null)}
          className="field-input"
        >
          <option value="">None</option>
          {topics
            .filter((t) => t.id !== topicId)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-border-subtle">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-3">
          Content
        </p>
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>

      <div className="p-4 rounded-xl bg-surface border border-border-subtle">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle mb-3">
          Practice link (optional)
        </p>
        <label className="field-label">Category</label>
        <select
          value={practiceCategory}
          onChange={(e) => {
            setPracticeCategory(e.target.value as Category | "");
            setSelectedExerciseIds(new Set());
          }}
          className="field-input mb-4"
        >
          <option value="">No linked practice</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>

        {practiceCategory && practiceExercises.length > 0 && (
          <ExercisePicker
            exercises={practiceExercises}
            selected={selectedExerciseIds}
            onChange={setSelectedExerciseIds}
          />
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="accent-indigo-500"
        />
        Published (visible on the public /learn pages)
      </label>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition disabled:opacity-50"
      >
        {saving ? "Saving…" : initial ? "Save Changes" : "Create Lesson"}
      </button>
    </form>
  );
}

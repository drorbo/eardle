"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Category, Difficulty, Exercise, CATEGORY_META, DIFFICULTY_HUE } from "@/types/exercise";
import { HUES } from "@/lib/design/palette";

interface Props {
  exercises: Exercise[];
}

export function ExerciseTable({ exercises }: Props) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  const filtered = exercises.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (difficultyFilter !== "all" && e.difficulty !== difficultyFilter) return false;
    return true;
  });

  async function handleDelete(id: number) {
    if (!confirm("Delete this exercise?")) return;
    setDeleting(id);
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="field-input max-w-[180px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)}>
          <option value="all">All Categories</option>
          {(Object.entries(CATEGORY_META) as [Category, any][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="field-input max-w-[160px]" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as any)}>
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <span className="text-text-subtle text-sm self-center">{filtered.length} exercises</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th className="pb-3 text-text-muted font-medium">Title</th>
              <th className="pb-3 text-text-muted font-medium hidden sm:table-cell">Category</th>
              <th className="pb-3 text-text-muted font-medium">Difficulty</th>
              <th className="pb-3 text-text-muted font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ex) => (
              <tr key={ex.id} className="border-b border-border-subtle/50 hover:bg-surface/50 transition">
                <td className="py-3 pr-4 text-text">{ex.title}</td>
                <td className="py-3 pr-4 text-text-muted hidden sm:table-cell capitalize">
                  {CATEGORY_META[ex.category].emoji} {CATEGORY_META[ex.category].label}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={clsx(
                      "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                      HUES[DIFFICULTY_HUE[ex.difficulty]].tint,
                      HUES[DIFFICULTY_HUE[ex.difficulty]].bannerText
                    )}
                  >
                    {ex.difficulty}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/admin/exercises/${ex.id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface text-text-muted text-xs transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      disabled={deleting === ex.id}
                      className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/50 dark:hover:bg-red-800 dark:text-red-300 text-xs transition disabled:opacity-50"
                    >
                      {deleting === ex.id ? "…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

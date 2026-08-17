"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Category, Exercise, CATEGORY_META, DIFFICULTY_HUE } from "@/types/exercise";
import { ExerciseDetail } from "./ExerciseDetail";
import { HUES } from "@/lib/design/palette";

interface Props {
  exercises: Exercise[];
  selectedCategory?: string;
  selectedTopic?: string;
}

export function AdminExerciseBrowser({ exercises, selectedCategory, selectedTopic }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch]         = useState("");
  const [diffFilter, setDiffFilter] = useState<string>("");
  const [deleting, setDeleting]     = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return exercises.filter(ex => {
      if (q && !ex.title.toLowerCase().includes(q) && !ex.answer.toLowerCase().includes(q)) return false;
      if (diffFilter && ex.difficulty !== diffFilter) return false;
      return true;
    });
  }, [exercises, search, diffFilter]);

  const selectedExercise = filtered.find(e => e.id === selectedId) ?? null;

  async function handleDelete(id: number) {
    if (!confirm("Delete this exercise?")) return;
    setDeleting(id);
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete this exercise.");
      return;
    }
    if (selectedId === id) setSelectedId(null);
    router.refresh();
  }

  const catMeta = selectedCategory ? CATEGORY_META[selectedCategory as Category] : null;
  const heading = selectedTopic
    ? `${catMeta?.label ?? selectedCategory} — ${selectedTopic.replace(/_/g, " ")}`
    : catMeta?.label ?? "All Exercises";

  const tableWidth = selectedExercise ? "w-1/2" : "flex-1";

  return (
    <div className="flex h-full bg-surface divide-x divide-border-subtle overflow-hidden">
      {/* ── Table panel ─────────────────────────────────── */}
      <div className={`${tableWidth} flex flex-col overflow-hidden min-w-0`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-text font-semibold text-sm capitalize truncate">{heading}</h2>
            <p className="text-text-faint text-xs">{filtered.length} exercises</p>
          </div>
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-surface-2 text-text text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-indigo-500 w-36"
          />
          <select
            aria-label="Filter by difficulty"
            value={diffFilter}
            onChange={e => setDiffFilter(e.target.value)}
            className="bg-surface-2 text-text text-xs px-2.5 py-1.5 rounded-lg border border-border focus:outline-none focus:border-indigo-500"
          >
            <option value="">All levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="jazz">Jazz</option>
          </select>
          <Link
            href="/admin/exercises/new"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex-shrink-0"
          >
            + New
          </Link>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface sticky top-0 z-10">
              <tr className="text-text-subtle text-xs uppercase tracking-wider border-b border-border-subtle">
                <th className="px-4 py-2.5 text-left w-14">ID</th>
                <th className="px-4 py-2.5 text-left">Title</th>
                {!selectedExercise && (
                  <>
                    <th className="px-4 py-2.5 text-left hidden lg:table-cell">Topic</th>
                    <th className="px-4 py-2.5 text-left">Difficulty</th>
                    <th className="px-4 py-2.5 text-left hidden xl:table-cell">Answer</th>
                  </>
                )}
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {filtered.map(ex => {
                const cfg = ex.config as unknown as Record<string, unknown>;
                const topic = typeof cfg.topic === "string" ? cfg.topic.replace(/_/g, " ") : "—";
                const isSelected = ex.id === selectedId;
                return (
                  <tr
                    key={ex.id}
                    onClick={() => setSelectedId(isSelected ? null : ex.id)}
                    className={clsx(
                      "cursor-pointer transition",
                      isSelected ? "bg-indigo-900/25 border-l-2 border-indigo-500" : "hover:bg-surface-2/30"
                    )}
                  >
                    <td className="px-4 py-2.5 text-text-faint font-mono text-xs">{ex.id}</td>
                    <td className="px-4 py-2.5 text-text text-xs font-medium truncate max-w-[180px]">
                      {ex.title}
                    </td>
                    {!selectedExercise && (
                      <>
                        <td className="px-4 py-2.5 text-text-subtle text-xs hidden lg:table-cell capitalize">{topic}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              HUES[DIFFICULTY_HUE[ex.difficulty]].tint,
                              HUES[DIFFICULTY_HUE[ex.difficulty]].bannerText
                            )}
                          >
                            {ex.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-text-muted text-xs hidden xl:table-cell truncate max-w-[150px]">
                          {ex.answer}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-end">
                        <Link
                          href={`/admin/exercises/${ex.id}/edit`}
                          className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface text-text-muted text-xs transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ex.id)}
                          disabled={deleting === ex.id}
                          className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-800 dark:text-red-400 text-xs transition disabled:opacity-40"
                        >
                          {deleting === ex.id ? "…" : "Del"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-text-faint text-sm">
                    No exercises found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail panel ────────────────────────────────── */}
      {selectedExercise && (
        <div className="w-1/2 overflow-hidden flex-shrink-0 bg-surface-2/40">
          <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}

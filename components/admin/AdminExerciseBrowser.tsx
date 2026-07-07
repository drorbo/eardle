"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Category, Exercise, CATEGORY_META, Difficulty } from "@/types/exercise";
import { ExerciseDetail } from "./ExerciseDetail";

interface Props {
  exercises: Exercise[];
  selectedCategory?: string;
  selectedTopic?: string;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  easy:   "bg-green-900/50 text-green-300",
  medium: "bg-yellow-900/50 text-yellow-300",
  hard:   "bg-red-900/50 text-red-300",
  jazz:   "bg-amber-900/50 text-amber-300",
};

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
    <div className="flex h-full divide-x divide-gray-800 overflow-hidden">
      {/* ── Table panel ─────────────────────────────────── */}
      <div className={`${tableWidth} flex flex-col overflow-hidden min-w-0`}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm capitalize truncate">{heading}</h2>
            <p className="text-gray-600 text-xs">{filtered.length} exercises</p>
          </div>
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 w-36"
          />
          <select
            value={diffFilter}
            onChange={e => setDiffFilter(e.target.value)}
            className="bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
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
            <thead className="bg-gray-900 sticky top-0 z-10">
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
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
            <tbody className="divide-y divide-gray-800/40">
              {filtered.map(ex => {
                const cfg = ex.config as unknown as Record<string, unknown>;
                const topic = typeof cfg.topic === "string" ? cfg.topic.replace(/_/g, " ") : "—";
                const isSelected = ex.id === selectedId;
                return (
                  <tr
                    key={ex.id}
                    onClick={() => setSelectedId(isSelected ? null : ex.id)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-indigo-900/25 border-l-2 border-indigo-500"
                        : "hover:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{ex.id}</td>
                    <td className="px-4 py-2.5 text-white text-xs font-medium truncate max-w-[180px]">
                      {ex.title}
                    </td>
                    {!selectedExercise && (
                      <>
                        <td className="px-4 py-2.5 text-gray-500 text-xs hidden lg:table-cell capitalize">{topic}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFF_COLORS[ex.difficulty]}`}>
                            {ex.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden xl:table-cell truncate max-w-[150px]">
                          {ex.answer}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-end">
                        <Link
                          href={`/admin/exercises/${ex.id}/edit`}
                          className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ex.id)}
                          disabled={deleting === ex.id}
                          className="px-2.5 py-1 rounded bg-red-900/40 hover:bg-red-800 text-red-400 text-xs transition disabled:opacity-40"
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
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-700 text-sm">
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
        <div className="w-1/2 overflow-hidden flex-shrink-0 bg-gray-950/50">
          <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}

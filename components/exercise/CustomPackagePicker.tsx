"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Difficulty, Exercise } from "@/types/exercise";

const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "jazz"];
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  jazz: "Jazz",
};
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
  jazz: "text-amber-400",
};

interface Props {
  category: Category;
  exercises: Exercise[];
}

export function CustomPackagePicker({ category, exercises }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const groups = useMemo(() => {
    return DIFFICULTY_ORDER
      .map((d) => ({ difficulty: d, items: exercises.filter((e) => e.difficulty === d) }))
      .filter((g) => g.items.length > 0);
  }, [exercises]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(items: Exercise[]) {
    const allSelected = items.every((e) => selected.has(e.id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of items) {
        if (allSelected) next.delete(e.id);
        else next.add(e.id);
      }
      return next;
    });
  }

  function start() {
    if (selected.size === 0) return;
    router.push(`/${category}/practice?ids=${[...selected].join(",")}`);
  }

  return (
    <div className="mt-6">
      <div className="space-y-6">
        {groups.map(({ difficulty, items }) => {
          const allSelected = items.every((e) => selected.has(e.id));
          return (
            <section key={difficulty}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${DIFFICULTY_COLOR[difficulty]}`}>
                  {DIFFICULTY_LABEL[difficulty]}
                </span>
                <button
                  onClick={() => toggleGroup(items)}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                      selected.has(e.id)
                        ? "bg-indigo-950/60 border-indigo-700/60 text-white"
                        : "bg-gray-800/50 border-gray-700/40 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggle(e.id)}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm">{e.title}</span>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-center">
        <button
          onClick={start}
          disabled={selected.size === 0}
          className="px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold transition disabled:cursor-not-allowed"
        >
          Start Practicing {selected.size > 0 ? `(${selected.size} selected)` : ""}
        </button>
      </div>
    </div>
  );
}

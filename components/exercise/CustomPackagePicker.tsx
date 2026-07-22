"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_TOPICS, Category, Difficulty, Exercise } from "@/types/exercise";

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
  initialSelectedIds?: number[];
}

interface PickerItem {
  key: string;
  ids: number[];
  title: string;
  difficulty: Difficulty;
  topicLabel?: string;
}

// Some categories seed intentional duplicate rows (identical title + config) to bias
// random selection toward certain exercises. They're indistinguishable to the user, so
// collapse them into a single checkbox that selects every underlying id together.
function dedupeItems(exercises: Exercise[]): PickerItem[] {
  const byKey = new Map<string, PickerItem>();
  for (const e of exercises) {
    const key = `${e.difficulty}|${e.title}|${JSON.stringify(e.config)}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.ids.push(e.id);
    } else {
      const topic = e.config.topic;
      const topicLabel = topic
        ? CATEGORY_TOPICS[e.category].find((t) => t.id === topic)?.label
        : undefined;
      byKey.set(key, { key, ids: [e.id], title: e.title, difficulty: e.difficulty, topicLabel });
    }
  }
  return [...byKey.values()];
}

export function CustomPackagePicker({ category, exercises, initialSelectedIds }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(() => {
    const validIds = new Set(exercises.map((e) => e.id));
    return new Set((initialSelectedIds ?? []).filter((id) => validIds.has(id)));
  });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const groups = useMemo(() => {
    const items = dedupeItems(exercises);
    return DIFFICULTY_ORDER
      .map((d) => ({
        difficulty: d,
        items: items.filter((i) => i.difficulty === d).sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .filter((g) => g.items.length > 0);
  }, [exercises]);

  function toggle(item: PickerItem) {
    const isSelected = item.ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of item.ids) {
        if (isSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleGroup(items: PickerItem[]) {
    const allSelected = items.every((i) => i.ids.every((id) => selected.has(id)));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        for (const id of item.ids) {
          if (allSelected) next.delete(id);
          else next.add(id);
        }
      }
      return next;
    });
  }

  function start() {
    if (selected.size === 0) return;
    router.push(`/${category}/practice?ids=${[...selected].join(",")}`);
  }

  async function handleShare() {
    if (selected.size === 0) return;
    const url = `${window.location.origin}/${category}/practice/custom?ids=${[...selected].join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <div className="mt-6">
      <div className="space-y-6">
        {groups.map(({ difficulty, items }) => {
          const allSelected = items.every((i) => i.ids.every((id) => selected.has(id)));
          return (
            <section key={difficulty}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${DIFFICULTY_COLOR[difficulty]}`}>
                  {DIFFICULTY_LABEL[difficulty]}
                </span>
                <button
                  onClick={() => toggleGroup(items)}
                  className="text-xs text-text-muted hover:text-text transition"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((item) => {
                  const checked = item.ids.every((id) => selected.has(id));
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                        checked
                          ? "bg-indigo-50 border-indigo-300 text-text dark:bg-indigo-950/60 dark:border-indigo-700/60 dark:text-white"
                          : "bg-surface border-border-subtle text-text-secondary hover:border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item)}
                        className="accent-indigo-500"
                      />
                      <span className="flex flex-col">
                        <span className="text-sm">{item.title}</span>
                        {item.topicLabel && (
                          <span className="text-[11px] text-text-subtle">{item.topicLabel}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-center gap-3">
        <button
          onClick={handleShare}
          disabled={selected.size === 0}
          className="px-5 py-3 rounded-xl bg-surface border border-border text-text font-bold transition hover:border-border-subtle disabled:bg-surface-2 disabled:text-text-subtle disabled:cursor-not-allowed disabled:border-transparent"
        >
          {copyState === "copied" ? "✅ Copied!" : copyState === "failed" ? "Couldn't copy" : "🔗 Share Package"}
        </button>
        <button
          onClick={start}
          disabled={selected.size === 0}
          className="px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:bg-surface-2 disabled:text-text-subtle text-white font-bold transition disabled:cursor-not-allowed"
        >
          Start Practicing {selected.size > 0 ? `(${selected.size} selected)` : ""}
        </button>
      </div>
    </div>
  );
}

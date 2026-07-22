"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Exercise } from "@/types/exercise";
import { ExercisePicker } from "./ExercisePicker";

interface Props {
  category: Category;
  exercises: Exercise[];
  initialSelectedIds?: number[];
}

export function CustomPackagePicker({ category, exercises, initialSelectedIds }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(() => {
    const validIds = new Set(exercises.map((e) => e.id));
    return new Set((initialSelectedIds ?? []).filter((id) => validIds.has(id)));
  });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

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
      <ExercisePicker exercises={exercises} selected={selected} onChange={setSelected} />

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

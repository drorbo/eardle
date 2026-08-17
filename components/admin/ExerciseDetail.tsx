"use client";

import Link from "next/link";
import clsx from "clsx";
import { Exercise, CATEGORY_META, ChordConfig, DIFFICULTY_HUE } from "@/types/exercise";
import { StaffNotation } from "./StaffNotation";
import { VoicingInspector } from "./VoicingInspector";
import { HUES } from "@/lib/design/palette";

interface Props {
  exercise: Exercise;
  onClose: () => void;
}

export function ExerciseDetail({ exercise, onClose }: Props) {
  const meta = CATEGORY_META[exercise.category];
  const config = exercise.config as unknown as Record<string, unknown>;
  const topic = typeof config.topic === "string" ? config.topic : "—";
  const createdAt = new Date(exercise.createdAt * 1000).toLocaleDateString();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-text-subtle text-xs font-mono">#{exercise.id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted">
                {meta.emoji} {meta.label}
              </span>
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded font-medium",
                  HUES[DIFFICULTY_HUE[exercise.difficulty]].tint,
                  HUES[DIFFICULTY_HUE[exercise.difficulty]].bannerText
                )}
              >
                {exercise.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text leading-snug">{exercise.title}</h3>
            <p className="text-text-muted text-sm mt-0.5">{exercise.prompt}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-text-faint hover:text-text-secondary transition text-xl leading-none mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Staff notation */}
        <div className="bg-white rounded-xl p-3 overflow-hidden">
          <StaffNotation exercise={exercise} />
        </div>

        {/* Voicing inspector — chord exercises only */}
        {exercise.category === "chord" && (
          <div className="bg-white rounded-xl p-3 overflow-hidden">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-1">
              Voicings
            </p>
            <VoicingInspector type={(exercise.config as ChordConfig).type} />
          </div>
        )}

        {/* Answer + Topic */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-xl p-4">
            <p className="text-xs font-medium text-text-subtle uppercase tracking-wider mb-1.5">Answer</p>
            <p className="text-text font-semibold text-sm">{exercise.answer}</p>
          </div>
          <div className="bg-surface rounded-xl p-4">
            <p className="text-xs font-medium text-text-subtle uppercase tracking-wider mb-1.5">Topic</p>
            <p className="text-text font-semibold text-sm">{topic}</p>
          </div>
        </div>

        {/* Choices */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs font-medium text-text-subtle uppercase tracking-wider mb-3">Choices</p>
          <div className="flex flex-wrap gap-2">
            {exercise.choices.map((choice, i) => (
              <span
                key={i}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-medium",
                  choice === exercise.answer
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                    : "bg-surface-2 text-text-muted"
                )}
              >
                {choice}
              </span>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {exercise.explanation && (
          <div className="bg-surface rounded-xl p-4">
            <p className="text-xs font-medium text-text-subtle uppercase tracking-wider mb-2">Explanation</p>
            <p className="text-text-secondary text-sm leading-relaxed">{exercise.explanation}</p>
          </div>
        )}

        {/* Config JSON */}
        <div className="bg-surface rounded-xl p-4">
          <p className="text-xs font-medium text-text-subtle uppercase tracking-wider mb-2">Config</p>
          <pre className="text-xs text-text-muted font-mono overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-faint">Created {createdAt}</p>
          <Link
            href={`/admin/exercises/${exercise.id}/edit`}
            className="px-4 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-600/40 dark:hover:bg-indigo-600 dark:text-indigo-200 text-sm transition"
          >
            Edit →
          </Link>
        </div>
      </div>
    </div>
  );
}

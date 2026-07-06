"use client";

import Link from "next/link";
import { Exercise, CATEGORY_META, ChordConfig } from "@/types/exercise";
import { StaffNotation } from "./StaffNotation";
import { VoicingInspector } from "./VoicingInspector";

const DIFF_COLORS: Record<string, string> = {
  easy:   "bg-green-900/60 text-green-300",
  medium: "bg-yellow-900/60 text-yellow-300",
  hard:   "bg-red-900/60 text-red-300",
  jazz:   "bg-amber-900/60 text-amber-300",
};

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
              <span className="text-gray-500 text-xs font-mono">#{exercise.id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                {meta.emoji} {meta.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${DIFF_COLORS[exercise.difficulty]}`}>
                {exercise.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">{exercise.title}</h3>
            <p className="text-gray-400 text-sm mt-0.5">{exercise.prompt}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition text-xl leading-none mt-0.5"
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
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Answer</p>
            <p className="text-white font-semibold text-sm">{exercise.answer}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Topic</p>
            <p className="text-white font-semibold text-sm">{topic}</p>
          </div>
        </div>

        {/* Choices */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Choices</p>
          <div className="flex flex-wrap gap-2">
            {exercise.choices.map((choice, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  choice === exercise.answer
                    ? "bg-green-900/50 text-green-300 ring-1 ring-green-700"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {choice}
              </span>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {exercise.explanation && (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Explanation</p>
            <p className="text-gray-300 text-sm leading-relaxed">{exercise.explanation}</p>
          </div>
        )}

        {/* Config JSON */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Config</p>
          <pre className="text-xs text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">Created {createdAt}</p>
          <Link
            href={`/admin/exercises/${exercise.id}/edit`}
            className="px-4 py-1.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 text-sm transition"
          >
            Edit →
          </Link>
        </div>
      </div>
    </div>
  );
}

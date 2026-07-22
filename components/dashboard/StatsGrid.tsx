"use client";

import Link from "next/link";
import { CATEGORY_META, Category } from "@/types/exercise";

interface CategoryStat {
  total: number;
  correct: number;
  lastSeen: number | null;
}

interface RecentAttempt {
  exerciseId: number;
  category: string;
  correct: boolean;
  createdAt: number;
}

interface Streaks {
  exercise: { current: number; longest: number };
  daily: { current: number; longest: number };
}

interface Props {
  byCategory: Partial<Record<Category, CategoryStat>>;
  recentAttempts: RecentAttempt[];
  streaks?: Streaks | null;
}

const CATEGORIES: Category[] = ["note", "interval", "chord", "progression", "scale"];

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function AccuracyBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
    </div>
  );
}

export function StatsGrid({ byCategory, recentAttempts, streaks }: Props) {
  const totalAttempts = Object.values(byCategory).reduce((s, v) => s + (v?.total ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Streak records */}
      {streaks && (streaks.exercise.longest > 0 || streaks.daily.longest > 0) && (
        <div>
          <h2 className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-4">
            Longest Streaks
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥 {streaks.exercise.longest}</p>
              <p className="text-xs text-text-subtle mt-1">Longest Exercise Streak</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥 {streaks.daily.longest}</p>
              <p className="text-xs text-text-subtle mt-1">Longest Daily Streak</p>
            </div>
          </div>
        </div>
      )}

      {/* Category cards */}
      <div>
        <h2 className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-4">
          Progress by Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const stat = byCategory[cat];
            const accuracy = stat && stat.total > 0 ? stat.correct / stat.total : null;

            return (
              <Link
                key={cat}
                href={`/${cat}`}
                className="flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border-subtle hover:border-border transition group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="font-semibold text-text text-sm">{meta.label}</span>
                </div>

                {stat ? (
                  <>
                    <AccuracyBar value={accuracy ?? 0} />
                    <div className="flex justify-between text-xs text-text-subtle">
                      <span>{stat.correct}/{stat.total} correct</span>
                      <span>Last: {formatDate(stat.lastSeen)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-faint mt-1">No attempts yet</p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      {recentAttempts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-text-subtle uppercase tracking-widest mb-4">
            Recent Activity
          </h2>
          <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
            {recentAttempts.slice(0, 10).map((a, i) => {
              const meta = CATEGORY_META[a.category as Category];
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta?.emoji ?? "🎵"}</span>
                    <span className="text-sm text-text-secondary capitalize">{a.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-faint">{formatDate(a.createdAt)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.correct
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                      }`}
                    >
                      {a.correct ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalAttempts === 0 && (
        <div className="text-center py-12 text-text-faint">
          <p className="text-4xl mb-3">🎹</p>
          <p className="font-medium text-text-muted">No practice sessions yet</p>
          <p className="text-sm mt-1">Start an exercise to see your progress here</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Category } from "@/types/exercise";

interface Stats {
  byCategory: Partial<Record<Category, { total: number; correct: number; lastSeen: number | null }>>;
  recentAttempts: { exerciseId: number; category: string; correct: boolean; createdAt: number }[];
}

interface Streaks {
  exercise: { current: number; longest: number };
  daily: { current: number; longest: number };
}

async function fetchStats(token?: string): Promise<Stats> {
  const url = token ? `/api/user/stats?token=${encodeURIComponent(token)}` : "/api/user/stats";
  const res = await fetch(url);
  if (!res.ok) return { byCategory: {}, recentAttempts: [] };
  return res.json();
}

async function fetchStreaks(token?: string): Promise<Streaks> {
  const empty = { current: 0, longest: 0 };
  const url = token ? `/api/streaks?token=${encodeURIComponent(token)}` : "/api/streaks";
  const res = await fetch(url);
  if (!res.ok) return { exercise: empty, daily: empty };
  return res.json();
}

async function migrateIfNeeded() {
  const token = localStorage.getItem("eardle_session");
  if (!token) return;
  await fetch("/api/user/migrate-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken: token }),
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const user = session?.user;

  useEffect(() => {
    if (status === "loading") return;

    async function load() {
      // If authenticated, migrate guest progress first (idempotent)
      if (session?.user?.id) {
        await migrateIfNeeded();
        const [s, st] = await Promise.all([fetchStats(), fetchStreaks()]);
        setStats(s);
        setStreaks(st);
      } else {
        // Guest: use localStorage session token
        const token = localStorage.getItem("eardle_session") ?? undefined;
        const [s, st] = await Promise.all([fetchStats(token), fetchStreaks(token)]);
        setStats(s);
        setStreaks(st);
      }
    }

    void load();
  }, [status, session?.user?.id]);

  const displayName = user?.nickname ?? user?.name ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {displayName ? `${displayName}'s Dashboard` : "Your Dashboard"}
          </h1>
          {!session && (
            <p className="text-sm text-gray-500 mt-1">
              Showing local progress.{" "}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
                Create an account
              </Link>{" "}
              to sync across devices.
            </p>
          )}
        </div>
        {session && (
          <Link
            href="/profile"
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Edit profile →
          </Link>
        )}
      </div>

      {stats ? (
        <StatsGrid byCategory={stats.byCategory} recentAttempts={stats.recentAttempts} streaks={streaks} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { GuessDistributionChart } from "./GuessDistributionChart";
import { ConfettiBurst } from "./ConfettiBurst";

interface PersonalStats {
  gamesPlayed: number;
  winPct: number;
  currentStreak: number;
  longestStreak: number;
  distribution: { guesses: number; count: number }[];
  lostCount: number;
}

interface CommunityStats {
  totalPlayers: number;
  distribution: { guesses: number; pct: number }[];
  lostPct: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessionToken: string;
  // Highlights the bar matching this run's own result, if any.
  todaysResult?: { status: "won" | "lost"; finalGuessCount?: number };
  // Shown at the top of the modal — the modal auto-opens the instant the
  // puzzle finishes, so this (and the confetti, on a win) needs to live here
  // rather than on the page behind it, which is immediately covered.
  funnyLine?: string | null;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-900 rounded-lg p-2">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function StatsModal({ open, onClose, sessionToken, todaysResult, funnyLine }: Props) {
  const [tab, setTab] = useState<"personal" | "community">("personal");
  const [personal, setPersonal] = useState<PersonalStats | null>(null);
  const [community, setCommunity] = useState<CommunityStats | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/daily/stats/personal?token=${encodeURIComponent(sessionToken)}`)
      .then((r) => r.json())
      .then(setPersonal)
      .catch(() => {});
    fetch(`/api/daily/stats/community`)
      .then((r) => r.json())
      .then(setCommunity)
      .catch(() => {});
  }, [open, sessionToken]);

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-sm font-semibold transition ${
      active ? "bg-violet-600 text-white" : "bg-gray-900 text-gray-400 hover:text-white"
    }`;

  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      {todaysResult?.status === "won" && <ConfettiBurst />}
      {funnyLine && (
        <p className="text-center text-gray-400 text-sm italic mb-4">{funnyLine}</p>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("personal")} className={tabClass(tab === "personal")}>
          Personal
        </button>
        <button onClick={() => setTab("community")} className={tabClass(tab === "community")}>
          Today&apos;s Players
        </button>
      </div>

      {tab === "personal" &&
        (personal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <StatTile label="Played" value={personal.gamesPlayed} />
              <StatTile label="Win %" value={personal.winPct} />
              <StatTile label="Streak" value={personal.currentStreak} />
              <StatTile label="Max Streak" value={personal.longestStreak} />
            </div>
            <GuessDistributionChart
              rows={[
                ...personal.distribution.map((d) => ({
                  label: String(d.guesses),
                  value: d.count,
                  highlight: todaysResult?.status === "won" && todaysResult.finalGuessCount === d.guesses,
                })),
                {
                  label: "X",
                  value: personal.lostCount,
                  highlight: todaysResult?.status === "lost",
                },
              ]}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Loading…</p>
        ))}

      {tab === "community" &&
        (community ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{community.totalPlayers.toLocaleString()}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Players Today</p>
            </div>
            <GuessDistributionChart
              rows={[
                ...community.distribution.map((d) => ({ label: String(d.guesses), value: d.pct })),
                { label: "X", value: community.lostPct },
              ]}
              showAsPercent
            />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Loading…</p>
        ))}
    </Modal>
  );
}

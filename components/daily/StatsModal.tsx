"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  // Pre-built Wordle-style share text, only present once today's attempt is
  // finished (mirrors todaysResult's own gating).
  shareText?: string | null;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-2 rounded-lg p-2">
      <p className="text-xl font-bold text-text">{value}</p>
      <p className="text-[10px] text-text-subtle uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function StatsModal({ open, onClose, sessionToken, todaysResult, funnyLine, shareText }: Props) {
  const [tab, setTab] = useState<"personal" | "community">("personal");
  const [personal, setPersonal] = useState<PersonalStats | null>(null);
  const [community, setCommunity] = useState<CommunityStats | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

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

  useEffect(() => {
    if (!open) setCopyState("idle");
  }, [open]);

  async function handleShare() {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-sm font-semibold transition ${
      active ? "bg-violet-600 text-white" : "bg-surface-2 text-text-muted hover:text-text"
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Statistics"
      icon={
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-indigo-900/40"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
        >
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </div>
      }
      topLeft={
        <div className="flex flex-col items-start gap-1.5 max-w-[160px] sm:max-w-[200px]">
          <p className="text-[11px] leading-snug text-text-subtle">
            Want to practice more exercises? Or try different categories?
          </p>
          <Link
            href="/"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface/80 border border-border text-[11px] font-semibold text-text-secondary hover:text-text hover:border-text-subtle transition whitespace-nowrap"
          >
            🎹 Try Practice Mode
          </Link>
        </div>
      }
    >
      {todaysResult?.status === "won" && <ConfettiBurst />}
      {funnyLine && (
        <p className="text-center text-text-muted text-sm italic mb-4">{funnyLine}</p>
      )}

      {shareText && (
        <div className="flex justify-center mb-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface-2 border border-border-subtle hover:border-border text-sm font-semibold text-text transition"
          >
            {copyState === "copied" ? (
              "✅ Copied!"
            ) : copyState === "failed" ? (
              "Couldn't copy"
            ) : (
              <>📤 Share Result</>
            )}
          </button>
        </div>
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
          <p className="text-text-muted text-sm">Loading…</p>
        ))}

      {tab === "community" &&
        (community ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{community.totalPlayers.toLocaleString()}</p>
              <p className="text-xs text-text-subtle uppercase tracking-wider">Players Today</p>
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
          <p className="text-text-muted text-sm">Loading…</p>
        ))}
    </Modal>
  );
}

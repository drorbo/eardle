"use client";

import { useState } from "react";
import clsx from "clsx";

const TABS = ["Overview", "Growth & Activity", "Exercise Practice", "Daily EarDle", "Learning Platform"] as const;
type Tab = (typeof TABS)[number];

interface StatsTabsProps {
  overview: React.ReactNode;
  growth: React.ReactNode;
  exercisePractice: React.ReactNode;
  dailyEardle: React.ReactNode;
  learningPlatform: React.ReactNode;
}

export function StatsTabs({ overview, growth, exercisePractice, dailyEardle, learningPlatform }: StatsTabsProps) {
  const [active, setActive] = useState<Tab>("Overview");
  const content: Record<Tab, React.ReactNode> = {
    Overview: overview,
    "Growth & Activity": growth,
    "Exercise Practice": exercisePractice,
    "Daily EarDle": dailyEardle,
    "Learning Platform": learningPlatform,
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-border-subtle mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={clsx(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition",
              active === tab
                ? "border-indigo-600 text-text"
                : "border-transparent text-text-secondary hover:text-text"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}

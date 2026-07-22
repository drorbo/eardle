"use client";

import { useState } from "react";

interface Props {
  category: string;
  ids: string;
}

// Lets a user copy a link back to their custom package (the picker,
// pre-selected) from within an active practice session — mirrors the same
// share affordance already offered on the picker page itself
// (components/exercise/CustomPackagePicker.tsx), so it's available whether
// you're about to start or already mid-session.
export function SharePackageButton({ category, ids }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleShare() {
    const url = `${window.location.origin}/${category}/practice/custom?ids=${ids}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <button
      onClick={handleShare}
      className="text-xs px-2 py-1 rounded-full bg-surface-2 border border-border-subtle text-text-secondary hover:border-border hover:text-text transition"
    >
      {copyState === "copied" ? "✅ Copied!" : copyState === "failed" ? "Couldn't copy" : "🔗 Share Package"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step inline confirm instead of a native confirm() dialog — keeps the
// admin panel consistent (no browser-native modals anywhere else in the app).
export function DeleteButton({ url, label = "Delete" }: { url: string; label?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    setBusy(true);
    await fetch(url, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button onClick={doDelete} disabled={busy} className="text-xs text-red-500 hover:text-red-400 font-semibold">
          {busy ? "…" : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-text-faint hover:text-text-subtle">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-text-faint hover:text-red-400 transition">
      {label}
    </button>
  );
}

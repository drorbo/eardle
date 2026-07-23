"use client";

import { useEffect, useRef, useState } from "react";
import type { TheoryPlayback } from "@/hooks/useTheoryPlayback";
import { PianoKeyboard } from "@/components/theory/PianoKeyboard";
import { Staff } from "@/components/theory/Staff";
import { selectClef } from "@/lib/audio/lessonPlayback";

export function LessonPlaybackPanel({ playback }: { playback: TheoryPlayback }) {
  const [expanded, setExpanded] = useState(false);
  const hasAutoExpandedRef = useRef(false);

  const { activeExample, resolvedEvents, activeNoteKeys, playNoteDirect } = playback;

  // Auto-expand once on the first played example, never again after that —
  // a manual toggle takes over from there so a user who collapses it back
  // down isn't fought by every subsequent Play click re-opening it.
  useEffect(() => {
    if (activeExample && !hasAutoExpandedRef.current) {
      hasAutoExpandedRef.current = true;
      setExpanded(true);
    }
  }, [activeExample]);

  const announcement = activeExample ? `Playing: ${activeExample.label}` : "";
  const visibleNotes = resolvedEvents.flatMap((e) => e.notes);
  const clef = selectClef(resolvedEvents);

  return (
    <div className="sticky top-[6rem] z-30 mb-4 rounded-2xl bg-surface border border-border-subtle surface-elevated overflow-hidden">
      <div aria-live="polite" className="sr-only">{announcement}</div>

      <div className="flex items-center justify-between gap-2 px-3 py-0.5">
        {!expanded && (
          <p className="text-xs text-text-subtle truncate min-w-0">
            {activeExample ? activeExample.label : "Tap ▶ Play below to see it here"}
          </p>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse keyboard and staff" : "Expand keyboard and staff"}
          aria-expanded={expanded}
          className="flex-shrink-0 ml-auto w-6 h-6 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition flex items-center justify-center text-base"
        >
          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-1 space-y-0.5 border-t border-border-subtle pt-0.5">
          {resolvedEvents.length > 0 ? (
            <Staff events={resolvedEvents} activeNoteKeys={activeNoteKeys} onNoteClick={playNoteDirect} clef={clef} />
          ) : (
            <p className="text-xs text-text-subtle text-center py-2">
              Tap a ▶ Play button below to see it here.
            </p>
          )}

          <PianoKeyboard activeNotes={activeNoteKeys} onKeyPlay={playNoteDirect} visibleNotes={visibleNotes} />
        </div>
      )}
    </div>
  );
}

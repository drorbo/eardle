"use client";

import { useEffect, useState } from "react";
import type { TheoryPlayback } from "@/hooks/useTheoryPlayback";
import { PianoKeyboard } from "@/components/theory/PianoKeyboard";
import { Staff } from "@/components/theory/Staff";
import { selectClef } from "@/lib/audio/lessonPlayback";

export function LessonPlaybackPanel({ playback }: { playback: TheoryPlayback }) {
  const [expanded, setExpanded] = useState(false);

  const { activeExample, resolvedEvents, activeNoteKeys, playNoteDirect } = playback;

  // Expand on every play, not just the first — the piano must be visible
  // whenever an example is playing, no matter where the user has scrolled
  // to. This fires every time because useTheoryPlayback's request() sets a
  // brand-new activeExample object on every call (even a replay of the
  // same example), so this effect's dependency always changes.
  useEffect(() => {
    if (activeExample) setExpanded(true);
  }, [activeExample]);

  const announcement = activeExample ? `Playing: ${activeExample.label}` : "";
  const visibleNotes = resolvedEvents.flatMap((e) => e.notes);
  const clef = selectClef(resolvedEvents);

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 rounded-t-2xl sm:rounded-2xl bg-surface border border-border-subtle surface-elevated overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0">
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
          {/* Bottom-anchored dock expands upward, so collapsed points up
              (⌃, "tap to open upward") and rotates to point down when
              expanded (inviting you to close it back down) — opposite of
              the old top panel's down-by-default chevron. */}
          <span className={`inline-block transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>⌃</span>
        </button>
      </div>

      {/* CSS grid-rows height animation: 0fr collapses the row to zero
          height (with the inner overflow-hidden clipping its content),
          1fr expands it to the content's natural height. Content stays
          mounted at all times (not conditionally rendered) so the
          transition has something to animate to/from — this is what
          makes the grid-rows technique work without measuring pixel
          heights in JS. */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}

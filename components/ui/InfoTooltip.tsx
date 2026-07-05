"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: Props) {
  const [clicked, setClicked] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!clicked) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setClicked(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [clicked]);

  return (
    // Named group (group/info) so desktop :hover only opens THIS tooltip, not
    // any other "group" ancestor (e.g. a whole-card hover elsewhere).
    <span ref={ref} className={`relative inline-flex group/info ${className ?? ""}`}>
      <button
        type="button"
        aria-label="More info"
        onClick={(e) => {
          // Click-only (no onMouseEnter): a real tap synthesizes both a
          // mouseenter AND a click, so combining hover-to-open with
          // click-to-toggle meant the first tap opened then immediately
          // closed it again — needed a second tap to actually show. Hover
          // is now pure CSS (group-hover, no JS state), so tap-to-toggle
          // can't race against it anymore.
          e.preventDefault();
          e.stopPropagation();
          setClicked((v) => !v);
        }}
        className="
          flex items-center justify-center w-5 h-5 rounded-full border border-gray-500
          text-gray-400 hover:text-white hover:border-gray-300 text-[11px] font-semibold
          transition flex-shrink-0
        "
      >
        i
      </button>
      <div
        className={`
          absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 sm:w-72 p-3
          rounded-xl bg-gray-800 border border-gray-700 text-xs text-gray-300
          leading-relaxed shadow-xl text-left normal-case font-normal tracking-normal
          transition-opacity duration-150
          ${
            clicked
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none group-hover/info:opacity-100 group-hover/info:pointer-events-auto"
          }
        `}
      >
        {text}
      </div>
    </span>
  );
}

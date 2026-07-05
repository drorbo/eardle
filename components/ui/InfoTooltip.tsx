"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex ${className ?? ""}`}>
      <button
        type="button"
        aria-label="More info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          // Also used inside a whole-card link elsewhere — never let this bubble
          // into a parent navigation.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="
          flex items-center justify-center w-5 h-5 rounded-full border border-gray-500
          text-gray-400 hover:text-white hover:border-gray-300 text-[11px] font-semibold
          transition flex-shrink-0
        "
      >
        i
      </button>
      {open && (
        <div
          className="
            absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 sm:w-72 p-3
            rounded-xl bg-gray-800 border border-gray-700 text-xs text-gray-300
            leading-relaxed shadow-xl text-left normal-case font-normal tracking-normal
          "
        >
          {text}
        </div>
      )}
    </span>
  );
}

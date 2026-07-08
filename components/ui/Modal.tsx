"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  // Secondary action rendered in the top-left corner, opposite the close
  // button — for a modal that wants one extra affordance without hardcoding
  // it into this shared primitive.
  topLeft?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, icon, topLeft, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-gray-800 border border-gray-700/50 p-5 sm:p-6"
      >
        {topLeft && (
          <div className="absolute top-5 left-5 sm:top-6 sm:left-6">
            {topLeft}
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
        >
          ✕
        </button>
        {(icon || title) && (
          <div className={`flex flex-col items-center text-center gap-2 mb-4 ${topLeft ? "pt-12" : ""}`}>
            {icon}
            {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-gray-800 border border-gray-700/50 p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

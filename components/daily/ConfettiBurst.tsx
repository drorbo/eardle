"use client";

import { useEffect, useState } from "react";

const COLORS = ["#818cf8", "#c084fc", "#4ade80", "#facc15", "#f472b6"];

export function ConfettiBurst() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1600);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const pieces = Array.from({ length: 16 }, (_, i) => ({
    left: `${5 + Math.random() * 90}%`,
    delay: `${Math.random() * 0.4}s`,
    duration: `${1 + Math.random() * 0.6}s`,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 w-2 h-2 rounded-sm"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration} ease-in ${p.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
}

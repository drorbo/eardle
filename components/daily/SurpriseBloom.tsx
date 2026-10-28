import { SURPRISE_MESSAGE } from "@/lib/daily/surprise";

// Flower with a beating heart beside it. Keyframes are local so no global stylesheet is touched.
export function SurpriseBloom({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 select-none" role="img" aria-label={`${SURPRISE_MESSAGE} — a flower and a heart`}>
      <style>{`
        @keyframes bloom-sway { 0%,100% { transform: rotate(-6deg) scale(1) } 50% { transform: rotate(6deg) scale(1.08) } }
        @keyframes bloom-beat { 0%,100% { transform: scale(1) } 15% { transform: scale(1.3) } 30% { transform: scale(1) } 45% { transform: scale(1.2) } }
        @media (prefers-reduced-motion: reduce) { .bloom-flower, .bloom-heart { animation: none !important } }
      `}</style>
      <div className={`flex items-center gap-3 ${compact ? "text-5xl" : "text-7xl"}`} aria-hidden="true">
        <span className="bloom-flower inline-block origin-bottom" style={{ animation: "bloom-sway 3s ease-in-out infinite" }}>🌸</span>
        <span className="bloom-heart inline-block" style={{ animation: "bloom-beat 1.4s ease-in-out infinite" }}>❤️</span>
      </div>
      <p className="text-sm italic text-text-muted">{SURPRISE_MESSAGE}</p>
    </div>
  );
}

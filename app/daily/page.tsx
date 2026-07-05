import { DailyPuzzlePlayer } from "./DailyPuzzlePlayer";

export default function DailyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-16">
        <DailyPuzzlePlayer />
      </div>
    </div>
  );
}

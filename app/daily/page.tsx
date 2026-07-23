import { DailyPuzzlePlayer } from "./DailyPuzzlePlayer";
import { LearnFeedbackBanner } from "@/components/ui/LearnFeedbackBanner";

export default function DailyPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-16">
        <LearnFeedbackBanner />
        <DailyPuzzlePlayer />
      </div>
    </div>
  );
}

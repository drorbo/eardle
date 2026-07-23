import Link from "next/link";

export function LearnFeedbackBanner() {
  return (
    <p className="text-center text-sm text-accent-banner-text bg-accent-banner-bg border border-accent-banner-border rounded-xl px-4 py-2.5 mb-6 sm:mb-8">
      🎓 New: explore{" "}
      <Link href="/learn" className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity">
        Learning mode
      </Link>{" "}
      to build the theory behind what you&apos;re hearing — and{" "}
      <Link href="/feedback" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
        let us know what you think
      </Link>
      .
    </p>
  );
}

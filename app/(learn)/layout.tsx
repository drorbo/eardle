import Link from "next/link";
import { getTopicsWithLessons } from "@/lib/db/lessons";
import { LearnSidebar } from "@/components/lesson/LearnSidebar";
import { MobileBrowseDisclosure } from "@/components/lesson/MobileBrowseDisclosure";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const topics = await getTopicsWithLessons();

  return (
    <>
      <div className="bg-accent-banner-bg border-b border-accent-banner-border text-center py-1.5 px-4">
        <p className="text-xs text-accent-banner-text">
          The Learning platform is in beta — please{" "}
          <Link href="/feedback" className="underline underline-offset-2 hover:opacity-70 transition-opacity">
            share your feedback
          </Link>
          {" "}and help us improve!
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
        {/* Mobile: collapsed disclosure above the content (hidden on /learn
            itself — see MobileBrowseDisclosure). Desktop: persistent sticky column. */}
        <MobileBrowseDisclosure topics={topics} />

        <aside className="hidden sm:block w-64 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-8">
          <LearnSidebar topics={topics} />
        </aside>

        <div className="min-w-0 flex-1 w-full">{children}</div>
      </div>
    </>
  );
}

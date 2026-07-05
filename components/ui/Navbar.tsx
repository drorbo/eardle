"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { CATEGORY_META } from "@/types/exercise";

// ── SVG icons ───────────────────────────────────────────────────────

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IntervalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="12" r="3" />
      <circle cx="20" cy="12" r="3" />
      <path d="M7 12h10" />
      <path d="M7 9.5v5M17 9.5v5" />
    </svg>
  );
}

function ChordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h11M4 12h11M4 17h11" />
      <circle cx="11" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="11" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="2.5" fill="currentColor" stroke="none" />
      <path d="M13.5 6V3" strokeWidth="1.5" />
    </svg>
  );
}

function ProgressionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="12" r="3" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="20" cy="12" r="3" />
      <path d="M7 12h2M15 12h2" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h5v-5h5v-5h5v-5" strokeLinejoin="round" />
    </svg>
  );
}

function DailyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function SignInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, (p: { className?: string }) => React.JSX.Element> = {
  note:        NoteIcon,
  interval:    IntervalIcon,
  chord:       ChordIcon,
  progression: ProgressionIcon,
  scale:       ScaleIcon,
};

// ── Fixed icon button with floating tooltip ──────────────────────────

function NavIcon({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
        active
          ? "bg-gray-800 text-white"
          : "text-gray-500 hover:text-white hover:bg-gray-800"
      }`}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </Link>
  );
}

function NavIconButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </button>
  );
}

// ── Main Navbar ──────────────────────────────────────────────────────

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const user = session?.user;
  const avatarSrc = user?.avatarUrl ?? (user?.id ? dicebearUrl(user.id) : null);
  const displayName = user?.nickname ?? user?.name ?? user?.email ?? "Account";

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <div className="bg-indigo-500/10 border-b border-indigo-500/20 text-center py-1.5 px-4">
        <p className="text-xs text-indigo-300">
          We&apos;re in beta — please{" "}
          <Link href="/feedback" className="underline underline-offset-2 hover:text-indigo-200 transition-colors">
            share your feedback
          </Link>
          {" "}and help us improve!
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Left: logo + category icons */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white tracking-tight flex-shrink-0">
            🎧 Eardle
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavIcon
              href="/daily"
              label="Daily EarDle"
              active={pathname === "/daily"}
              icon={<DailyIcon className="w-5 h-5" />}
            />
            {(Object.entries(CATEGORY_META) as [string, typeof CATEGORY_META[keyof typeof CATEGORY_META]][]).map(
              ([key, meta]) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <NavIcon
                    key={key}
                    href={`/${key}`}
                    label={meta.label}
                    active={pathname.startsWith(`/${key}`)}
                    icon={<Icon className="w-5 h-5" />}
                  />
                );
              }
            )}
          </div>
        </div>

        {/* Right: utility + auth icons */}
        <div className="hidden sm:flex items-center gap-1">
          <NavIcon
            href="/feedback"
            label="Feedback"
            active={pathname === "/feedback"}
            icon={<FeedbackIcon className="w-5 h-5" />}
          />

          {status !== "loading" && (
            user ? (
              <>
                <NavIcon
                  href="/dashboard"
                  label="Dashboard"
                  active={pathname === "/dashboard"}
                  icon={<DashboardIcon className="w-5 h-5" />}
                />
                <NavIcon
                  href="/profile"
                  label={displayName}
                  active={pathname === "/profile"}
                  icon={<UserIcon className="w-5 h-5" />}
                />
                <NavIconButton
                  onClick={() => signOut({ callbackUrl: "/" })}
                  label="Sign Out"
                  icon={<SignOutIcon className="w-5 h-5" />}
                />
              </>
            ) : (
              <>
                <NavIcon
                  href="/dashboard"
                  label="My Progress"
                  active={pathname === "/dashboard"}
                  icon={<DashboardIcon className="w-5 h-5" />}
                />
                <NavIcon
                  href="/signin"
                  label="Sign In"
                  active={pathname === "/signin"}
                  icon={<SignInIcon className="w-5 h-5" />}
                />
              </>
            )
          )}
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {user && avatarSrc && (
            <Link href="/profile">
              <Image
                src={avatarSrc}
                alt={displayName}
                width={28}
                height={28}
                className="rounded-full bg-gray-700"
                unoptimized
              />
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 space-y-1">
          <Link
            href="/daily"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
          >
            <span className="text-lg">📅</span>
            Daily EarDle
          </Link>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-1 pt-1">
            Categories
          </p>
          {(Object.entries(CATEGORY_META) as [string, typeof CATEGORY_META[keyof typeof CATEGORY_META]][]).map(
            ([key, meta]) => (
              <Link
                key={key}
                href={`/${key}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
              >
                <span className="text-lg">{meta.emoji}</span>
                {meta.label}
              </Link>
            )
          )}

          <div className="border-t border-gray-800 mt-2 pt-2 space-y-1">
            <Link
              href="/feedback"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
            >
              💬 Feedback
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
                >
                  👤 {displayName}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition text-sm text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
                >
                  📊 My Progress
                </Link>
                <Link
                  href="/signin"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition text-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

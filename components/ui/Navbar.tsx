"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { CATEGORY_META } from "@/types/exercise";
import { useTheme } from "@/components/ThemeProvider";

// ── SVG icons ───────────────────────────────────────────────────────

function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
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

function LearnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function PianoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M8 5v8M12 5v8M16 5v8" />
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

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ── Fixed icon button with floating tooltip ──────────────────────────

function NavIcon({
  href,
  label,
  icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
        active
          ? "bg-surface-2 text-text"
          : "text-text-subtle hover:text-text hover:bg-surface-2"
      }`}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 pointer-events-none">{badge}</span>
      )}
      <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-surface-2 border border-border text-text text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </Link>
  );
}

function DailyStreakBadge({ streak, playedToday }: { streak: number; playedToday: boolean }) {
  if (streak <= 0) return null;
  return (
    <span
      className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[10px] font-bold leading-none ${
        playedToday ? "bg-orange-500 text-white" : "bg-surface-2 text-text-secondary"
      }`}
    >
      🔥{streak}
    </span>
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
      className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-text-subtle hover:text-text hover:bg-surface-2 transition-colors"
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-surface-2 border border-border text-text text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
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
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dailyStatus, setDailyStatus] = useState({ currentStreak: 0, playedToday: false });
  // Server always renders assuming the "light" default (it can't read
  // localStorage), so the icon/label must match that on the client's first
  // render too — only reflect the real (possibly "dark") theme after mount,
  // once hydration has already reconciled, to avoid a mismatch.
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === "dark";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (status === "loading") return;
    // Read-only — Navbar shouldn't mint a new guest identity, only reflect one
    // that already exists (created by playing Daily or a regular exercise).
    let token: string | null = null;
    try { token = localStorage.getItem("eardle_session"); } catch { /* ignore */ }
    if (!session?.user && !token) return; // nothing to look up, stays at default
    fetch(`/api/daily/nav-status${token ? `?token=${encodeURIComponent(token)}` : ""}`)
      .then((r) => r.json())
      .then(setDailyStatus)
      .catch(() => {});
    // Navbar is a persistent layout component (doesn't remount on navigation),
    // so without this it would keep showing whatever streak/played-today state
    // was true when it first mounted — refetch on every route change (catches
    // "just navigated away after finishing today's puzzle") and immediately
    // when DailyPuzzlePlayer dispatches this event on completion (catches
    // "finished but stayed on /daily", no navigation needed).
  }, [status, session?.user, pathname]);

  useEffect(() => {
    function onDailyCompleted() {
      let token: string | null = null;
      try { token = localStorage.getItem("eardle_session"); } catch { /* ignore */ }
      fetch(`/api/daily/nav-status${token ? `?token=${encodeURIComponent(token)}` : ""}`)
        .then((r) => r.json())
        .then(setDailyStatus)
        .catch(() => {});
    }
    window.addEventListener("eardle:daily-completed", onDailyCompleted);
    return () => window.removeEventListener("eardle:daily-completed", onDailyCompleted);
  }, []);

  const user = session?.user;
  const avatarSrc = user?.avatarUrl ?? (user?.id ? dicebearUrl(user.id) : null);
  const displayName = user?.nickname ?? user?.name ?? user?.email ?? "Account";

  return (
    <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Left: logo + category icons */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-text tracking-tight flex-shrink-0">
            🎧 Eardle<sup className="text-[10px] font-normal text-text-faint ml-0.5">™</sup>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            <NavIcon
              href="/daily"
              label="Daily EarDle"
              active={pathname === "/daily"}
              icon={<DailyIcon className="w-5 h-5" />}
              badge={<DailyStreakBadge streak={dailyStatus.currentStreak} playedToday={dailyStatus.playedToday} />}
            />
            <NavIcon
              href="/learn"
              label="Learn"
              active={pathname.startsWith("/learn")}
              icon={<LearnIcon className="w-5 h-5" />}
            />
            <NavIcon
              href="/practice"
              label="Practice"
              active={pathname === "/practice" || Object.keys(CATEGORY_META).some((key) => pathname.startsWith(`/${key}`))}
              icon={<PracticeIcon className="w-5 h-5" />}
            />
            <NavIcon
              href="/piano"
              label="Keyboard Playground"
              active={pathname === "/piano"}
              icon={<PianoIcon className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Right: utility + auth icons */}
        <div className="hidden sm:flex items-center gap-1">
          <NavIconButton
            onClick={toggleTheme}
            label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            icon={isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          />
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

        {/* Mobile: daily streak + avatar + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <Link href="/daily" aria-label="Daily EarDle">
            <DailyStreakBadge streak={dailyStatus.currentStreak} playedToday={dailyStatus.playedToday} />
          </Link>
          {user && avatarSrc && (
            <Link href="/profile">
              <Image
                src={avatarSrc}
                alt={displayName}
                width={28}
                height={28}
                className="rounded-full bg-surface-2"
                unoptimized
              />
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition"
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
        <div className="sm:hidden border-t border-border-subtle bg-bg px-4 py-3 space-y-1">
          <Link
            href="/daily"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">📅</span>
            Daily EarDle
            <DailyStreakBadge streak={dailyStatus.currentStreak} playedToday={dailyStatus.playedToday} />
          </Link>
          <Link
            href="/learn"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎓</span>
            Learn
          </Link>
          <Link
            href="/practice"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎯</span>
            Practice
          </Link>
          <Link
            href="/piano"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
          >
            <span className="text-lg">🎹</span>
            Keyboard Playground
          </Link>

          <div className="border-t border-border-subtle mt-2 pt-2 space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm text-left"
            >
              {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <Link
              href="/feedback"
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
            >
              💬 Feedback
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
                >
                  👤 {displayName}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-text-subtle hover:text-text hover:bg-surface-2 transition text-sm text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-text-secondary hover:text-text hover:bg-surface-2 transition text-sm"
                >
                  📊 My Progress
                </Link>
                <Link
                  href="/signin"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-accent-hover-bg transition text-sm"
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

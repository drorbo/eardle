# Learn Overview Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat, 30-section stacked link list on `/learn` with a hero "start here / continue" banner plus a 6-tile category grid that expands in place to reveal that category's lessons as cards — per `docs/superpowers/specs/2026-08-09-learn-overview-redesign-design.md`.

**Architecture:** Pure presentational rewrite of `LearnOverviewClient.tsx` plus two small new leaf components and one shared metadata constant. No DB, API, or route changes. `LearnSidebar.tsx` gets a small edit to read from the same shared constant instead of its own local copy.

**Tech Stack:** Next.js 16 App Router, TypeScript, React (client components, `useState`/`useMemo`/`useEffect`), Tailwind CSS v4 theme tokens. **No test runner exists in this repo** (`package.json` has no `test` script, no Jest/Vitest/RTL dependency) — this plan substitutes `npx tsc --noEmit` (type-check) after each file change in place of a test-first cycle, and ends with a full `npm run build` + manual browser walkthrough instead of an automated test suite.

---

## File Structure

- `lib/learn/categoryMeta.ts` — **new**. Single source of truth for the 6 learn-nav categories (Fundamentals + the 5 `types/exercise.ts` `Category` values): id, label, emoji, Tailwind gradient/border classes. Reuses `CATEGORY_META`'s label/emoji for the 5 real categories rather than duplicating them.
- `components/lesson/CategoryTile.tsx` — **new**. One clickable tile: emoji, label, "`x`/`y` done" fraction, expand/collapse chevron. Presentational only, no data fetching.
- `components/lesson/TopicLessonCard.tsx` — **new**. One lesson row (status dot + title + arrow), extracted so both the overview page and (potentially later) other views can reuse it. Visually identical to today's row — the fix is removing 30 of these from view at once, not changing how one row looks.
- `components/lesson/LearnOverviewClient.tsx` — **rewritten**. Computes the 3-state hero, groups topics by category via the shared constant, renders the tile grid, and renders expanded categories' topics/lessons below it using `TopicLessonCard`.
- `app/(learn)/learn/page.tsx` — **small edit**. Trim the intro paragraph now that the hero/tiles carry that meaning.
- `components/lesson/LearnSidebar.tsx` — **small edit**. Read `LEARN_CATEGORY_ORDER` from the shared constant instead of its local `CATEGORY_ORDER` array; trim one line of copy.

No changes to `types/lesson.ts`, `lib/db/lessons.ts`, `lib/db/schema.ts`, `app/(learn)/learn/[topicSlug]/[lessonSlug]/page.tsx`, `LessonBlocks.tsx`, `StatusDot.tsx`, `useLessonProgress.ts`, or any API route.

---

### Task 1: Shared category metadata constant

**Files:**
- Create: `lib/learn/categoryMeta.ts`

- [ ] **Step 1: Create the file**

```ts
import { CATEGORY_META, type Category } from "@/types/exercise";
import type { NavCategoryId } from "@/types/lesson";

export interface LearnCategoryMeta {
  id: NavCategoryId;
  label: string;
  emoji: string;
  /** Tailwind gradient/border classes (light + dark), same visual weight as
   *  CategoryCard.tsx's resolved hues on /practice. Kept as a local literal
   *  rather than derived from CATEGORY_META.color so "fundamentals" — which
   *  has no Category value — can have its own entry in the same list. */
  colorClasses: string;
}

const REAL_CATEGORY_COLORS: Record<Category, string> = {
  note:        "from-sky-300 to-sky-200 border-sky-400 hover:border-sky-500 dark:from-sky-800/70 dark:to-sky-700/40 dark:border-sky-600 dark:hover:border-sky-400",
  interval:    "from-teal-300 to-teal-200 border-teal-400 hover:border-teal-500 dark:from-teal-800/70 dark:to-teal-700/40 dark:border-teal-600 dark:hover:border-teal-400",
  chord:       "from-amber-300 to-amber-200 border-amber-400 hover:border-amber-500 dark:from-amber-800/70 dark:to-amber-700/40 dark:border-amber-600 dark:hover:border-amber-400",
  progression: "from-rose-300 to-rose-200 border-rose-400 hover:border-rose-500 dark:from-rose-800/70 dark:to-rose-700/40 dark:border-rose-600 dark:hover:border-rose-400",
  scale:       "from-emerald-300 to-emerald-200 border-emerald-400 hover:border-emerald-500 dark:from-emerald-800/70 dark:to-emerald-700/40 dark:border-emerald-600 dark:hover:border-emerald-400",
};

export const LEARN_CATEGORY_ORDER: LearnCategoryMeta[] = [
  {
    id: "fundamentals",
    label: "Fundamentals",
    emoji: "🧱",
    colorClasses: "from-slate-300 to-slate-200 border-slate-400 hover:border-slate-500 dark:from-slate-700/70 dark:to-slate-600/40 dark:border-slate-500 dark:hover:border-slate-400",
  },
  { id: "note", label: CATEGORY_META.note.label, emoji: CATEGORY_META.note.emoji, colorClasses: REAL_CATEGORY_COLORS.note },
  { id: "interval", label: CATEGORY_META.interval.label, emoji: CATEGORY_META.interval.emoji, colorClasses: REAL_CATEGORY_COLORS.interval },
  { id: "chord", label: CATEGORY_META.chord.label, emoji: CATEGORY_META.chord.emoji, colorClasses: REAL_CATEGORY_COLORS.chord },
  { id: "progression", label: CATEGORY_META.progression.label, emoji: CATEGORY_META.progression.emoji, colorClasses: REAL_CATEGORY_COLORS.progression },
  { id: "scale", label: CATEGORY_META.scale.label, emoji: CATEGORY_META.scale.emoji, colorClasses: REAL_CATEGORY_COLORS.scale },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/learn/categoryMeta.ts` (pre-existing unrelated errors, if any, are not this task's concern — note them but don't fix here).

- [ ] **Step 3: Commit**

```bash
git add lib/learn/categoryMeta.ts
git commit -m "Add shared category metadata for the learn nav"
```

---

### Task 2: `CategoryTile` component

**Files:**
- Create: `components/lesson/CategoryTile.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { LearnCategoryMeta } from "@/lib/learn/categoryMeta";

interface Props {
  meta: LearnCategoryMeta;
  completed: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
}

export function CategoryTile({ meta, completed, total, expanded, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`
        text-left rounded-xl sm:rounded-2xl p-3 sm:p-4
        bg-gradient-to-br ${meta.colorClasses}
        border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]
        ${expanded ? "ring-2 ring-offset-1 ring-border" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl sm:text-2xl">{meta.emoji}</span>
        <span className="text-text-faint text-xs">{expanded ? "▾" : "▸"}</span>
      </div>
      <h3 className="text-sm sm:text-base font-bold text-text leading-tight">{meta.label}</h3>
      <p className="text-xs text-text-subtle mt-0.5">
        {total === 0 ? "No lessons yet" : `${completed}/${total} done`}
      </p>
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/lesson/CategoryTile.tsx` (it isn't imported anywhere yet, so this only checks the file compiles standalone).

- [ ] **Step 3: Commit**

```bash
git add components/lesson/CategoryTile.tsx
git commit -m "Add CategoryTile component for the learn overview"
```

---

### Task 3: `TopicLessonCard` component

**Files:**
- Create: `components/lesson/TopicLessonCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import { StatusDot } from "@/components/lesson/StatusDot";
import type { LessonStatus } from "@/hooks/useLessonProgress";
import type { LessonSummary } from "@/types/lesson";

interface Props {
  lesson: LessonSummary;
  status?: LessonStatus;
}

export function TopicLessonCard({ lesson, status }: Props) {
  return (
    <Link
      href={`/learn/${lesson.topicSlug}/${lesson.slug}`}
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition"
    >
      <span className="flex items-center gap-2.5 min-w-0">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-text truncate">{lesson.title}</span>
      </span>
      <span className="text-text-faint text-sm flex-shrink-0">→</span>
    </Link>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/lesson/TopicLessonCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/lesson/TopicLessonCard.tsx
git commit -m "Add TopicLessonCard component for the learn overview"
```

---

### Task 4: Rewrite `LearnOverviewClient.tsx`

**Files:**
- Modify: `components/lesson/LearnOverviewClient.tsx` (full rewrite, current file is 62 lines)

- [ ] **Step 1: Replace the file contents**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { CategoryTile } from "@/components/lesson/CategoryTile";
import { TopicLessonCard } from "@/components/lesson/TopicLessonCard";
import { LEARN_CATEGORY_ORDER } from "@/lib/learn/categoryMeta";
import type { NavCategoryId, TopicWithLessons } from "@/types/lesson";

export function LearnOverviewClient({ topics }: { topics: TopicWithLessons[] }) {
  const { progress, loaded } = useLessonProgress();

  const allLessons = useMemo(() => topics.flatMap((t) => t.lessons), [topics]);

  // First not-yet-viewed lesson in suggested-path order — undefined once
  // everything's been read, or before progress has loaded (avoids a flash).
  // Keyed on `viewed`, not `completed`: completed also requires having
  // practiced, so keying on it here would leave this stuck pointing at
  // lesson 1 for anyone who reads ahead without practicing every lesson.
  const continueLesson = loaded ? allLessons.find((l) => !progress[l.id]?.viewed) : undefined;
  // True only once progress has loaded and confirmed nothing was viewed —
  // undefined progress (not yet loaded) must not be mistaken for "new user".
  const nothingViewedYet = loaded && allLessons.length > 0 && allLessons.every((l) => !progress[l.id]?.viewed);

  const grouped = useMemo(() => {
    const map = new Map<NavCategoryId, TopicWithLessons[]>();
    for (const t of topics) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return LEARN_CATEGORY_ORDER.map((c) => ({ ...c, topics: map.get(c.id) ?? [] })).filter((c) => c.topics.length > 0);
  }, [topics]);

  const [expanded, setExpanded] = useState<Set<NavCategoryId>>(new Set());

  // Auto-expand (without collapsing anything the user already opened) the
  // category containing the "continue" lesson, so a returning user lands on
  // an already-open section instead of having to find and tap it themselves.
  useEffect(() => {
    if (!continueLesson) return;
    const topic = topics.find((t) => t.id === continueLesson.topicId);
    if (!topic) return;
    setExpanded((prev) => (prev.has(topic.category) ? prev : new Set(prev).add(topic.category)));
  }, [continueLesson, topics]);

  function toggle(id: NavCategoryId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {loaded && nothingViewedYet && allLessons[0] && (
        <Link
          href={`/learn/${allLessons[0].topicSlug}/${allLessons[0].slug}`}
          className="block mb-6 p-5 rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">
            👋 New here?
          </p>
          <p className="text-text font-bold text-lg">Start with the fundamentals →</p>
          <p className="text-text-muted text-sm mt-0.5">{allLessons[0].title}</p>
        </Link>
      )}

      {loaded && !nothingViewedYet && continueLesson && (
        <Link
          href={`/learn/${continueLesson.topicSlug}/${continueLesson.slug}`}
          className="block mb-6 p-5 rounded-2xl bg-accent-banner-bg border border-accent-banner-border transition hover:opacity-90"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-banner-text mb-1">
            Continue where you left off
          </p>
          <p className="text-text font-bold text-lg">{continueLesson.title} →</p>
        </Link>
      )}

      {loaded && !continueLesson && allLessons.length > 0 && (
        <p className="mb-6 text-sm text-text-faint italic">
          You&apos;ve explored every lesson — jump back into any topic below anytime.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {grouped.map((cat) => {
          const total = cat.topics.reduce((sum, t) => sum + t.lessons.length, 0);
          const completed = cat.topics.reduce(
            (sum, t) => sum + t.lessons.filter((l) => progress[l.id]?.completed).length,
            0
          );
          return (
            <CategoryTile
              key={cat.id}
              meta={cat}
              completed={completed}
              total={total}
              expanded={expanded.has(cat.id)}
              onToggle={() => toggle(cat.id)}
            />
          );
        })}
      </div>

      <div className="space-y-8">
        {grouped
          .filter((cat) => expanded.has(cat.id))
          .map((cat) => (
            <section key={cat.id}>
              <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </h2>
              <div className="space-y-6">
                {cat.topics.map((topic) => (
                  <div key={topic.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-2">
                      {topic.title}
                    </p>
                    {topic.description && <p className="text-text-muted text-sm mb-2">{topic.description}</p>}
                    <div className="space-y-2">
                      {topic.lessons.map((lesson) => (
                        <TopicLessonCard key={lesson.id} lesson={lesson} status={progress[lesson.id]} />
                      ))}
                      {topic.lessons.length === 0 && (
                        <p className="text-text-faint text-xs italic">No lessons in this topic yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/lesson/LearnOverviewClient.tsx`, `CategoryTile.tsx`, or `TopicLessonCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/lesson/LearnOverviewClient.tsx
git commit -m "Rewrite /learn overview as hero + category tile grid"
```

---

### Task 5: Trim the `/learn` intro copy

**Files:**
- Modify: `app/(learn)/learn/page.tsx:16-22`

- [ ] **Step 1: Edit the intro block**

Change:
```tsx
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Learn</h1>
        <p className="text-text-muted text-sm">
          A suggested path through the ideas behind Eardle&apos;s exercises — read at your own pace,
          jump to any topic any time.
        </p>
      </div>
```
to:
```tsx
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">Learn</h1>
        <p className="text-text-muted text-sm">
          Pick a subject below, or pick up where you left off.
        </p>
      </div>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(learn)/learn/page.tsx"
git commit -m "Trim /learn intro copy now that the hero/tiles carry that meaning"
```

---

### Task 6: Point `LearnSidebar` at the shared category metadata

**Files:**
- Modify: `components/lesson/LearnSidebar.tsx:1-18` and `:72`

- [ ] **Step 1: Replace the imports and local `CATEGORY_ORDER` array**

Change (lines 1-18):
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_META } from "@/types/exercise";
import type { NavCategoryId, TopicWithLessons } from "@/types/lesson";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";

const CATEGORY_ORDER: { id: NavCategoryId; label: string; emoji: string }[] = [
  { id: "fundamentals", label: "Fundamentals", emoji: "🧱" },
  { id: "note", label: CATEGORY_META.note.label, emoji: CATEGORY_META.note.emoji },
  { id: "interval", label: CATEGORY_META.interval.label, emoji: CATEGORY_META.interval.emoji },
  { id: "chord", label: CATEGORY_META.chord.label, emoji: CATEGORY_META.chord.emoji },
  { id: "progression", label: CATEGORY_META.progression.label, emoji: CATEGORY_META.progression.emoji },
  { id: "scale", label: CATEGORY_META.scale.label, emoji: CATEGORY_META.scale.emoji },
];
```
to:
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavCategoryId, TopicWithLessons } from "@/types/lesson";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { StatusDot } from "@/components/lesson/StatusDot";
import { LEARN_CATEGORY_ORDER } from "@/lib/learn/categoryMeta";
```

- [ ] **Step 2: Update the reference to the renamed constant**

Change (inside the `grouped` `useMemo`, originally around line 31):
```tsx
    return CATEGORY_ORDER.map((c) => ({ ...c, topics: map.get(c.id) ?? [] })).filter((c) => c.topics.length > 0);
```
to:
```tsx
    return LEARN_CATEGORY_ORDER.map((c) => ({ ...c, topics: map.get(c.id) ?? [] })).filter((c) => c.topics.length > 0);
```

- [ ] **Step 3: Trim the redundant explanatory line**

Change (originally around line 72):
```tsx
      <p className="px-2 mb-3 text-[11px] leading-snug text-text-faint">
        Grouped by category below — for the suggested reading order, start at the overview above.
      </p>
```
to:
```tsx
      <p className="px-2 mb-3 text-[11px] leading-snug text-text-faint">
        Jump to any lesson directly, or use the overview above for the suggested order.
      </p>
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `components/lesson/LearnSidebar.tsx` (confirms `LEARN_CATEGORY_ORDER`'s extra `colorClasses` field doesn't break the sidebar, which never reads it).

- [ ] **Step 5: Commit**

```bash
git add components/lesson/LearnSidebar.tsx
git commit -m "Point LearnSidebar at the shared category metadata"
```

---

### Task 7: Full build + manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Full production type-check + build**

Run: `npm run build`
Expected: build succeeds with no type or lint errors in any of the 6 touched/created files. (Pre-existing unrelated warnings elsewhere in the repo, if any, are not a blocker.)

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (check `netstat -ano | findstr ":300"` first — port 3000 may already be in use by another local project; Next.js will fall back to 3001/3002 automatically, note whichever port it prints)

- [ ] **Step 3: Browser walkthrough**

Using the Chrome browser tool, visit `/learn` and confirm each item from the spec's Verification section:
1. As a guest with no prior progress (fresh browser profile/incognito, or clear `localStorage["eardle_session"]` first): the "👋 New here? Start with the fundamentals →" hero appears and links to the first lesson (`Musical Alphabet & Octaves`'s first published lesson).
2. Click into and view a lesson or two across two different categories, return to `/learn`: hero switches to "Continue where you left off" pointing at the correct next lesson in `sortOrder`, and the corresponding category tile's fraction increases.
3. Click each of the 6 tiles: each expands in place below the grid showing that category's topics as `TopicLessonCard`s with correct `StatusDot` state; clicking an already-expanded tile collapses it again.
4. Click a lesson card: navigates to the existing `/learn/[topicSlug]/[lessonSlug]` route, and that page renders unchanged (breadcrumb, prerequisite link, `LessonBlocks`, practice CTA).
5. Confirm the sidebar (desktop persistent column, and the mobile `<details>` disclosure at a narrow viewport) still lists every lesson, still auto-expands the category of whatever lesson is currently open, and the trimmed copy line reads correctly.
6. Resize to a mobile viewport (e.g. 390px wide): tile grid is 2 columns, hero is full width, and clicking a tile's expanded content appears inline (no modal, no layout break).
7. Visit `/practice` and `/` (home page): confirm both are visually unchanged (they don't import anything touched by this plan, but confirm regardless since `CATEGORY_META` is a shared, high-traffic import).

- [ ] **Step 4: Fix anything found, re-verify, then final commit if any fixes were needed**

If Step 3 surfaces any issue, fix it, re-run `npx tsc --noEmit`, re-check the specific broken item in the browser, then:
```bash
git add -A
git commit -m "Fix issues found during /learn redesign browser verification"
```
(Skip this step entirely if Step 3 found nothing to fix.)

---

## Self-Review Notes

- **Spec coverage:** Hero 3-state banner → Task 4. Category tile grid + accordion → Tasks 1, 2, 4. Per-lesson cards replacing plain links → Task 3, wired in Task 4. Shared metadata constant → Task 1, consumed by Tasks 4 and 6. Sidebar copy/constant dedup → Task 6. Mobile grid behavior → Task 4's `grid-cols-2 sm:grid-cols-3`, checked in Task 7 Step 3.6. "Nothing else changes" guardrails (URLs, lesson content, progress API, no gating, admin) → verified by construction (no task touches those files) and spot-checked in Task 7 Step 3.4/3.7.
- **No placeholders:** every step above has complete, runnable code — none deferred to "similar to Task N."
- **Type consistency:** `LearnCategoryMeta` (Task 1) is the prop type for `CategoryTile.meta` (Task 2) and is what `grouped` items in `LearnOverviewClient` structurally satisfy (Task 4) and what `LearnSidebar` consumes via `LEARN_CATEGORY_ORDER` (Task 6) — same shape used everywhere, no renamed fields between tasks. `LessonSummary`/`LessonStatus`/`TopicWithLessons`/`NavCategoryId` are all pre-existing types from `types/lesson.ts` / `hooks/useLessonProgress.ts`, used with identical field names (`topicSlug`, `slug`, `title`, `topicId`, `category`) across every task — verified against the actual current file contents read from the repo, not from memory.

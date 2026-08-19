import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Blended-actor activity, per the design spec's identity model: an actor is
// userId if signed in, else sessionToken. Unioned across the three tables
// that record real interaction (sessions = exercise practice, daily_attempts
// = Daily EarDle, lesson_progress = Learn). streaks.updatedAt is excluded —
// it mutates in place, so it's not a "this actor did something at time T"
// event log the way the other three are.
const ACTIVITY_CTE = sql`
  activity AS (
    SELECT coalesce(user_id::text, session_token) AS actor, created_at
    FROM sessions
    UNION ALL
    SELECT coalesce(user_id::text, session_token), created_at
    FROM daily_attempts
    UNION ALL
    SELECT coalesce(user_id::text, session_token), coalesce(viewed_at, practiced_at)
    FROM lesson_progress
    WHERE coalesce(viewed_at, practiced_at) IS NOT NULL
  )
`;

function daysAgo(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 86400;
}

// ── Overview + Growth & Activity ────────────────────────────────────────

export interface DailyPoint {
  day: string; // "YYYY-MM-DD"
  value: number;
}

// Wrapped in cache() because both OverviewTab and GrowthTab independently
// call this with the same args on every /admin/stats load (all 5 tabs render
// as props into the client StatsTabs component up front, not lazily per
// active tab), which would otherwise run this multi-table union query twice
// per request (see the 2026-08-11 latency investigation, and lessons.ts for
// the same pattern applied to lesson queries).
/** Distinct blended actors active per day, last N days (zero-filled for empty days). */
export const getDailyActiveActors = cache(async function getDailyActiveActors(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH ${ACTIVITY_CTE},
    days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(DISTINCT activity.actor)::int AS value
    FROM days
    LEFT JOIN activity ON to_timestamp(activity.created_at)::date = days.day
    WHERE activity.created_at IS NULL OR activity.created_at >= ${since}
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
});

/** Signups per day, last N days (zero-filled), from users.createdAt. */
export async function getSignupsOverTime(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(users.id)::int AS value
    FROM days
    LEFT JOIN users ON to_timestamp(users.created_at)::date = days.day
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

export interface ActiveActorCounts {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number; // dau/mau, 0-100, rounded
}

// Wrapped in cache() for the same reason as getDailyActiveActors above:
// OverviewTab and GrowthTab both call this independently on every page load.
/** DAU (today) / WAU (last 7d) / MAU (last 30d) blended actor counts + stickiness ratio. */
export const getActiveActorCounts = cache(async function getActiveActorCounts(): Promise<ActiveActorCounts> {
  const [row] = await db.execute<{ dau: number; wau: number; mau: number }>(sql`
    WITH ${ACTIVITY_CTE}
    SELECT
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(1)})::int AS dau,
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(7)})::int AS wau,
      count(DISTINCT actor) FILTER (WHERE created_at >= ${daysAgo(30)})::int AS mau
    FROM activity
  `) as unknown as { dau: number; wau: number; mau: number }[];
  const dau = row?.dau ?? 0;
  const mau = row?.mau ?? 0;
  return { dau, wau: row?.wau ?? 0, mau, stickiness: mau > 0 ? Math.round((dau / mau) * 100) : 0 };
});

export interface StreakBucket {
  bucket: "0" | "1-2" | "3-6" | "7-13" | "14-29" | "30+";
  count: number;
}

const STREAK_BUCKET_CASE = sql`
  CASE
    WHEN current_streak = 0 THEN '0'
    WHEN current_streak BETWEEN 1 AND 2 THEN '1-2'
    WHEN current_streak BETWEEN 3 AND 6 THEN '3-6'
    WHEN current_streak BETWEEN 7 AND 13 THEN '7-13'
    WHEN current_streak BETWEEN 14 AND 29 THEN '14-29'
    ELSE '30+'
  END
`;
const STREAK_BUCKET_ORDER: StreakBucket["bucket"][] = ["0", "1-2", "3-6", "7-13", "14-29", "30+"];

/** Current-streak-length distribution for one streak kind ("exercise" or "daily"). */
export async function getStreakDistribution(kind: "exercise" | "daily"): Promise<StreakBucket[]> {
  const rows = await db.execute<{ bucket: StreakBucket["bucket"]; count: number }>(sql`
    SELECT ${STREAK_BUCKET_CASE} AS bucket, count(*)::int AS count
    FROM streaks
    WHERE kind = ${kind}
    GROUP BY bucket
  `);
  const byBucket = Object.fromEntries((rows as unknown as StreakBucket[]).map((r) => [r.bucket, r.count]));
  return STREAK_BUCKET_ORDER.map((bucket) => ({ bucket, count: byBucket[bucket] ?? 0 }));
}

export interface SignedUpVsGuest {
  signedUp: number;
  guest: number;
}

/** All-time distinct blended-actor split: how many are a real users.id vs. a guest token. */
export async function getSignedUpVsGuestSplit(): Promise<SignedUpVsGuest> {
  const rows = await db.execute<{ actor_kind: "signed_up" | "guest"; count: number }>(sql`
    WITH raw AS (
      SELECT user_id, session_token FROM sessions
      UNION ALL
      SELECT user_id, session_token FROM daily_attempts
      UNION ALL
      SELECT user_id, session_token FROM lesson_progress
    )
    SELECT
      CASE WHEN user_id IS NOT NULL THEN 'signed_up' ELSE 'guest' END AS actor_kind,
      count(DISTINCT coalesce(user_id::text, session_token))::int AS count
    FROM raw
    GROUP BY actor_kind
  `);
  const byKind = Object.fromEntries((rows as unknown as { actor_kind: string; count: number }[]).map((r) => [r.actor_kind, r.count]));
  return { signedUp: byKind.signed_up ?? 0, guest: byKind.guest ?? 0 };
}

// ── Exercise Practice ────────────────────────────────────────────────────

export interface CategorySeriesPoint {
  day: string;
  note: number;
  interval: number;
  chord: number;
  progression: number;
  scale: number;
}

/** Plays per day per category, last N days (zero-filled). One row per day, one column per category. */
export async function getPlaysOverTimeByCategory(days = 90): Promise<CategorySeriesPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; note: number; interval: number; chord: number; progression: number; scale: number }>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT
      days.day::text AS day,
      count(*) FILTER (WHERE exercises.category = 'note')::int AS note,
      count(*) FILTER (WHERE exercises.category = 'interval')::int AS interval,
      count(*) FILTER (WHERE exercises.category = 'chord')::int AS chord,
      count(*) FILTER (WHERE exercises.category = 'progression')::int AS progression,
      count(*) FILTER (WHERE exercises.category = 'scale')::int AS scale
    FROM days
    LEFT JOIN sessions ON to_timestamp(sessions.created_at)::date = days.day AND sessions.created_at >= ${since}
    LEFT JOIN exercises ON exercises.id = sessions.exercise_id
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as CategorySeriesPoint[];
}

export interface DifficultyBreakdown {
  difficulty: "easy" | "medium" | "hard" | "jazz";
  plays: number;
  accuracy: number; // 0-100, or -1 meaning "no plays"
}

/** All-time plays + accuracy by difficulty. */
export async function getDifficultyBreakdown(): Promise<DifficultyBreakdown[]> {
  const rows = await db.execute<{ difficulty: DifficultyBreakdown["difficulty"]; plays: number; correct: number }>(sql`
    SELECT exercises.difficulty AS difficulty, count(*)::int AS plays, sum(sessions.correct::int)::int AS correct
    FROM sessions
    JOIN exercises ON exercises.id = sessions.exercise_id
    GROUP BY exercises.difficulty
  `);
  const order: DifficultyBreakdown["difficulty"][] = ["easy", "medium", "hard", "jazz"];
  const byDiff = Object.fromEntries((rows as unknown as { difficulty: string; plays: number; correct: number }[]).map((r) => [r.difficulty, r]));
  return order.map((difficulty) => {
    const row = byDiff[difficulty];
    const plays = row?.plays ?? 0;
    const correct = row?.correct ?? 0;
    return { difficulty, plays, accuracy: plays > 0 ? Math.round((correct / plays) * 100) : -1 };
  });
}

// ── Daily EarDle ─────────────────────────────────────────────────────────

/** Daily EarDle attempts per day, last N days (zero-filled). */
export async function getDailyAttemptsOverTime(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(daily_attempts.id)::int AS value
    FROM days
    LEFT JOIN daily_attempts ON to_timestamp(daily_attempts.created_at)::date = days.day AND daily_attempts.created_at >= ${since}
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

export interface DailyWinStats {
  overallWinRate: number; // 0-100
  avgGuessesToWin: number; // rounded to 1 decimal
  byCategory: { category: string; winRate: number; attempts: number }[];
}

/** Overall + per-category Daily EarDle win rate, and average guesses-to-win. */
export async function getDailyWinStats(): Promise<DailyWinStats> {
  const [overall] = await db.execute<{ won: number; decided: number; avg_guesses: number }>(sql`
    SELECT
      count(*) FILTER (WHERE status = 'won')::int AS won,
      count(*) FILTER (WHERE status IN ('won','lost'))::int AS decided,
      avg(final_guess_count) FILTER (WHERE status = 'won')::numeric(10,1) AS avg_guesses
    FROM daily_attempts
  `) as unknown as { won: number; decided: number; avg_guesses: string | null }[];

  const byCategory = await db.execute<{ category: string; won: number; decided: number }>(sql`
    SELECT category, count(*) FILTER (WHERE status = 'won')::int AS won, count(*) FILTER (WHERE status IN ('won','lost'))::int AS decided
    FROM daily_attempts
    GROUP BY category
  `);

  const decided = overall?.decided ?? 0;
  const won = overall?.won ?? 0;
  return {
    overallWinRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
    avgGuessesToWin: overall?.avg_guesses ? Number(overall.avg_guesses) : 0,
    byCategory: (byCategory as unknown as { category: string; won: number; decided: number }[]).map((r) => ({
      category: r.category,
      winRate: r.decided > 0 ? Math.round((r.won / r.decided) * 100) : 0,
      attempts: r.decided,
    })),
  };
}

// ── Learning Platform ────────────────────────────────────────────────────

export interface LessonEngagementTotals {
  totalLessons: number;
  neverTouched: number;
  viewedOnly: number;
  completed: number; // viewed AND practiced
}

/** Completion funnel across all published lessons: never touched / viewed only / completed. */
export async function getLessonEngagementFunnel(): Promise<LessonEngagementTotals> {
  const [row] = await db.execute<{ total_lessons: number; touched: number; completed: number }>(sql`
    SELECT
      (SELECT count(*)::int FROM lessons WHERE published) AS total_lessons,
      (SELECT count(DISTINCT lesson_id)::int FROM lesson_progress) AS touched,
      (SELECT count(DISTINCT lesson_id)::int FROM lesson_progress WHERE viewed_at IS NOT NULL AND practiced_at IS NOT NULL) AS completed
  `) as unknown as { total_lessons: number; touched: number; completed: number }[];

  const totalLessons = row?.total_lessons ?? 0;
  const touched = row?.touched ?? 0;
  const completed = row?.completed ?? 0;
  return { totalLessons, neverTouched: Math.max(0, totalLessons - touched), viewedOnly: Math.max(0, touched - completed), completed };
}

export interface TopicEngagement {
  topicId: number;
  topicTitle: string;
  views: number;
  completions: number;
}

/** Per-topic lesson views + completions (distinct actor-lesson pairs), all published topics. */
export async function getTopicEngagement(): Promise<TopicEngagement[]> {
  const rows = await db.execute<{ topic_id: number; topic_title: string; views: number; completions: number }>(sql`
    SELECT
      topics.id AS topic_id,
      topics.title AS topic_title,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL)::int AS views,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL AND lesson_progress.practiced_at IS NOT NULL)::int AS completions
    FROM topics
    JOIN lessons ON lessons.topic_id = topics.id AND lessons.published
    LEFT JOIN lesson_progress ON lesson_progress.lesson_id = lessons.id
    GROUP BY topics.id, topics.title
    ORDER BY topics.sort_order
  `);
  return (rows as unknown as { topic_id: number; topic_title: string; views: number; completions: number }[]).map((r) => ({
    topicId: r.topic_id,
    topicTitle: r.topic_title,
    views: r.views,
    completions: r.completions,
  }));
}

export interface LearnAdoptionStats {
  totalLearners: number; // distinct blended actors who ever touched Learn
  adoptionRate: number; // 0-100: % of all-site actors who tried Learn at all
  activatedLearners: number; // distinct actors who completed >=1 lesson
  avgLessonsCompleted: number; // per activated learner, rounded to 1 decimal
}

/** Reach/adoption stats: how many of the site's actors have ever tried Learn, and how deep they go. */
export async function getLearnAdoptionStats(): Promise<LearnAdoptionStats> {
  const [row] = await db.execute<{
    total_learners: number;
    total_site_actors: number;
    activated_learners: number;
    completed_pairs: number;
  }>(sql`
    WITH learn_actors AS (
      SELECT DISTINCT coalesce(user_id::text, session_token) AS actor
      FROM lesson_progress
    ),
    site_actors AS (
      SELECT coalesce(user_id::text, session_token) AS actor FROM sessions
      UNION
      SELECT coalesce(user_id::text, session_token) FROM daily_attempts
      UNION
      SELECT coalesce(user_id::text, session_token) FROM lesson_progress
    ),
    completed AS (
      SELECT coalesce(user_id::text, session_token) AS actor, lesson_id
      FROM lesson_progress
      WHERE viewed_at IS NOT NULL AND practiced_at IS NOT NULL
    )
    SELECT
      (SELECT count(*)::int FROM learn_actors) AS total_learners,
      (SELECT count(DISTINCT actor)::int FROM site_actors) AS total_site_actors,
      (SELECT count(DISTINCT actor)::int FROM completed) AS activated_learners,
      (SELECT count(*)::int FROM completed) AS completed_pairs
  `) as unknown as { total_learners: number; total_site_actors: number; activated_learners: number; completed_pairs: number }[];

  const totalLearners = row?.total_learners ?? 0;
  const totalSiteActors = row?.total_site_actors ?? 0;
  const activatedLearners = row?.activated_learners ?? 0;
  const completedPairs = row?.completed_pairs ?? 0;

  return {
    totalLearners,
    adoptionRate: totalSiteActors > 0 ? Math.round((totalLearners / totalSiteActors) * 100) : 0,
    activatedLearners,
    avgLessonsCompleted: activatedLearners > 0 ? Math.round((completedPairs / activatedLearners) * 10) / 10 : 0,
  };
}

/** New-to-Learn actors per day, last N days (zero-filled) — first ever viewed/practiced timestamp per actor. */
export async function getNewLearnersOverTime(days = 90): Promise<DailyPoint[]> {
  const since = daysAgo(days);
  const rows = await db.execute<{ day: string; value: number }>(sql`
    WITH first_touch AS (
      SELECT coalesce(user_id::text, session_token) AS actor, min(coalesce(viewed_at, practiced_at)) AS first_at
      FROM lesson_progress
      WHERE coalesce(viewed_at, practiced_at) IS NOT NULL
      GROUP BY actor
    ),
    days AS (
      SELECT generate_series(to_timestamp(${since})::date, now()::date, '1 day')::date AS day
    )
    SELECT days.day::text AS day, count(first_touch.actor)::int AS value
    FROM days
    LEFT JOIN first_touch ON to_timestamp(first_touch.first_at)::date = days.day AND first_touch.first_at >= ${since}
    GROUP BY days.day
    ORDER BY days.day
  `);
  return rows as unknown as DailyPoint[];
}

export interface LessonProgressionStep {
  position: number; // 0-based index in curriculum order (topic sortOrder, then lesson sortOrder)
  lessonId: number;
  title: string;
  topicTitle: string;
  viewed: number;
  completed: number;
}

// Navigation between lessons is free ("browse anything, nothing locked" — see
// lib/db/lessons.ts), so this is NOT a strict sequential-completion funnel;
// it's per-lesson viewed/completed counts laid out in curriculum order, which
// still answers "how far into the material are people actually getting" —
// a real drop in either series at some position is a real signal, without
// asserting every actor took the lessons before it in order.
/** Viewed + completed counts per published lesson, ordered by the site's curriculum sequence. */
export async function getLessonProgressionByStep(): Promise<LessonProgressionStep[]> {
  const rows = await db.execute<{
    position: number;
    lesson_id: number;
    title: string;
    topic_title: string;
    viewed: number;
    completed: number;
  }>(sql`
    WITH ordered AS (
      SELECT
        lessons.id, lessons.title, topics.title AS topic_title,
        (row_number() OVER (ORDER BY topics.sort_order, lessons.sort_order) - 1)::int AS position
      FROM lessons
      JOIN topics ON topics.id = lessons.topic_id
      WHERE lessons.published
    )
    SELECT
      ordered.position AS position,
      ordered.id AS lesson_id,
      ordered.title AS title,
      ordered.topic_title AS topic_title,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL)::int AS viewed,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL AND lesson_progress.practiced_at IS NOT NULL)::int AS completed
    FROM ordered
    LEFT JOIN lesson_progress ON lesson_progress.lesson_id = ordered.id
    GROUP BY ordered.position, ordered.id, ordered.title, ordered.topic_title
    ORDER BY ordered.position
  `);
  return (
    rows as unknown as {
      position: number;
      lesson_id: number;
      title: string;
      topic_title: string;
      viewed: number;
      completed: number;
    }[]
  ).map((r) => ({
    position: r.position,
    lessonId: r.lesson_id,
    title: r.title,
    topicTitle: r.topic_title,
    viewed: r.viewed,
    completed: r.completed,
  }));
}

export interface LessonEngagementRow {
  lessonId: number;
  title: string;
  topicTitle: string;
  views: number;
  completions: number;
}

/** Top 10 most-engaged lessons by view count (ties broken by completions). */
export async function getTopLessons(limit = 10): Promise<LessonEngagementRow[]> {
  const rows = await db.execute<{ lesson_id: number; title: string; topic_title: string; views: number; completions: number }>(sql`
    SELECT
      lessons.id AS lesson_id,
      lessons.title AS title,
      topics.title AS topic_title,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL)::int AS views,
      count(lesson_progress.id) FILTER (WHERE lesson_progress.viewed_at IS NOT NULL AND lesson_progress.practiced_at IS NOT NULL)::int AS completions
    FROM lessons
    JOIN topics ON topics.id = lessons.topic_id
    LEFT JOIN lesson_progress ON lesson_progress.lesson_id = lessons.id
    WHERE lessons.published
    GROUP BY lessons.id, lessons.title, topics.title
    ORDER BY views DESC, completions DESC
    LIMIT ${limit}
  `);
  return (rows as unknown as { lesson_id: number; title: string; topic_title: string; views: number; completions: number }[]).map((r) => ({
    lessonId: r.lesson_id,
    title: r.title,
    topicTitle: r.topic_title,
    views: r.views,
    completions: r.completions,
  }));
}

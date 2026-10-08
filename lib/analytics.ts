/**
 * Analytical metrics engine with explicit mathematical formulas.
 * Rule: No invented scores beyond these defined metrics.
 */

export interface TaskRecord {
  id: string;
  track: "language" | "dsa" | "project" | "internship";
  done: boolean;
  done_at?: string | null;
  planned_minutes?: number | null;
}

export interface FocusSessionRecord {
  id: string;
  started_at: string;
  seconds: number;
}

export interface QuizAttemptRecord {
  id: string;
  total: number;
  max_total: number;
  graded_at: string;
}

/**
 * Formula: completion_rate = (done_tasks / total_tasks) * 100
 */
export function calculateCompletionRate(doneCount: number, totalCount: number): {
  rate: number;
  formula: string;
} {
  const formula = "Completion Rate = (completed_tasks / total_tasks) × 100";
  if (totalCount === 0) return { rate: 0, formula };
  const rate = Math.round((doneCount / totalCount) * 100);
  return { rate, formula };
}

/**
 * Formula: planned_vs_actual = sum(planned_minutes) vs sum(seconds) / 60
 */
export function calculatePlannedVsActual(
  tasks: TaskRecord[],
  sessions: FocusSessionRecord[]
): {
  plannedMinutes: number;
  actualMinutes: number;
  varianceMinutes: number;
  formula: string;
} {
  const formula = "Variance = Actual Focus Minutes - Planned Task Minutes";
  const plannedMinutes = tasks.reduce((sum, t) => sum + (t.planned_minutes || 0), 0);
  const actualMinutes = Math.round(
    sessions.reduce((sum, s) => sum + (s.seconds || 0), 0) / 60
  );
  const varianceMinutes = actualMinutes - plannedMinutes;

  return { plannedMinutes, actualMinutes, varianceMinutes, formula };
}

/**
 * Formula: current_streak = consecutive days count backwards from today/yesterday with activity
 */
export function calculateCurrentStreak(activityDates: string[]): {
  streak: number;
  formula: string;
} {
  const formula = "Current Streak = consecutive 24h calendar days with at least 1 completed task or focus session";
  if (activityDates.length === 0) return { streak: 0, formula };

  // Convert to unique YYYY-MM-DD set
  const dateSet = new Set(
    activityDates.map((d) => new Date(d).toISOString().slice(0, 10))
  );

  const today = new Date();
  let currentCheck = new Date(today);
  const todayStr = currentCheck.toISOString().slice(0, 10);

  // If today has no activity yet, start check from yesterday
  if (!dateSet.has(todayStr)) {
    currentCheck.setDate(currentCheck.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const dateStr = currentCheck.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, formula };
}

/**
 * Formula: track_breakdown = count(tasks) & completion_rate per track
 */
export function calculateTrackBreakdown(tasks: TaskRecord[]) {
  const tracks: Record<string, { total: number; done: number; rate: number }> = {
    language: { total: 0, done: 0, rate: 0 },
    dsa: { total: 0, done: 0, rate: 0 },
    project: { total: 0, done: 0, rate: 0 },
    internship: { total: 0, done: 0, rate: 0 },
  };

  for (const t of tasks) {
    const key = t.track || "dsa";
    if (!tracks[key]) {
      tracks[key] = { total: 0, done: 0, rate: 0 };
    }
    tracks[key].total++;
    if (t.done) tracks[key].done++;
  }

  for (const key of Object.keys(tracks)) {
    const cur = tracks[key];
    cur.rate = cur.total > 0 ? Math.round((cur.done / cur.total) * 100) : 0;
  }

  return tracks;
}

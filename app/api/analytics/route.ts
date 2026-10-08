import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCompletionRate,
  calculatePlannedVsActual,
  calculateCurrentStreak,
  calculateTrackBreakdown,
} from "@/lib/analytics";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, track, done, done_at, planned_minutes")
      .eq("user_id", user.id);

    // 2. Fetch focus sessions
    const { data: sessions } = await supabase
      .from("focus_sessions")
      .select("id, started_at, seconds")
      .eq("user_id", user.id)
      .order("started_at", { ascending: true });

    // 3. Fetch quiz attempts
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, total, max_total, graded_at")
      .eq("user_id", user.id)
      .order("graded_at", { ascending: true });

    const safeTasks = tasks || [];
    const safeSessions = sessions || [];
    const safeAttempts = attempts || [];

    // Calculations
    const doneTasksCount = safeTasks.filter((t) => t.done).length;
    const completionData = calculateCompletionRate(doneTasksCount, safeTasks.length);
    const plannedVsActualData = calculatePlannedVsActual(safeTasks, safeSessions);

    // Gather all active activity dates for streak calculation
    const activityDates: string[] = [];
    safeTasks.forEach((t) => {
      if (t.done_at) activityDates.push(t.done_at);
    });
    safeSessions.forEach((s) => {
      activityDates.push(s.started_at);
    });

    const streakData = calculateCurrentStreak(activityDates);
    const trackBreakdown = calculateTrackBreakdown(safeTasks);

    // Daily focus chart data (last 7 days)
    const dailyFocusMap: Record<string, number> = {};
    safeSessions.forEach((s) => {
      const day = s.started_at.slice(0, 10);
      dailyFocusMap[day] = (dailyFocusMap[day] || 0) + Math.round(s.seconds / 60);
    });

    const focusTrends = Object.entries(dailyFocusMap).map(([date, minutes]) => ({
      date: new Date(date).toLocaleDateString([], { month: "short", day: "numeric" }),
      minutes,
    }));

    // Quiz score progression
    const quizTrends = safeAttempts.map((a, i) => ({
      attempt: `Attempt ${i + 1}`,
      percentage: Math.round((a.total / (a.max_total || 1)) * 100),
      score: a.total,
      max: a.max_total,
      date: new Date(a.graded_at).toLocaleDateString([], { month: "short", day: "numeric" }),
    }));

    return NextResponse.json({
      completion: {
        totalTasks: safeTasks.length,
        doneTasks: doneTasksCount,
        rate: completionData.rate,
        formula: completionData.formula,
      },
      time: {
        plannedMinutes: plannedVsActualData.plannedMinutes,
        actualMinutes: plannedVsActualData.actualMinutes,
        varianceMinutes: plannedVsActualData.varianceMinutes,
        formula: plannedVsActualData.formula,
      },
      streak: {
        currentStreakDays: streakData.streak,
        formula: streakData.formula,
      },
      tracks: trackBreakdown,
      focusTrends,
      quizTrends,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

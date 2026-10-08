import { describe, it, expect } from "vitest";
import {
  calculateCompletionRate,
  calculatePlannedVsActual,
  calculateCurrentStreak,
  calculateTrackBreakdown,
} from "@/lib/analytics";

describe("Analytics Formulas Verification", () => {
  it("calculates completion rate mathematically without invented scores", () => {
    expect(calculateCompletionRate(5, 10).rate).toBe(50);
    expect(calculateCompletionRate(0, 0).rate).toBe(0);
    expect(calculateCompletionRate(7, 8).rate).toBe(88);
  });

  it("calculates planned vs actual minutes from focus sessions", () => {
    const tasks = [
      { id: "1", track: "dsa" as const, done: true, planned_minutes: 45 },
      { id: "2", track: "language" as const, done: false, planned_minutes: 30 },
    ];
    const sessions = [
      { id: "s1", started_at: "2026-10-09T00:00:00Z", seconds: 1800 }, // 30 min
      { id: "s2", started_at: "2026-10-09T01:00:00Z", seconds: 3600 }, // 60 min
    ];

    const res = calculatePlannedVsActual(tasks, sessions);
    expect(res.plannedMinutes).toBe(75);
    expect(res.actualMinutes).toBe(90);
    expect(res.varianceMinutes).toBe(15);
  });

  it("calculates consecutive calendar day activity streak", () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();

    const res = calculateCurrentStreak([today, yesterday, twoDaysAgo]);
    expect(res.streak).toBe(3);
  });

  it("breaks down task completion per track accurately", () => {
    const tasks = [
      { id: "1", track: "language" as const, done: true },
      { id: "2", track: "language" as const, done: false },
      { id: "3", track: "dsa" as const, done: true },
      { id: "4", track: "project" as const, done: true },
    ];

    const breakdown = calculateTrackBreakdown(tasks);
    expect(breakdown.language.total).toBe(2);
    expect(breakdown.language.done).toBe(1);
    expect(breakdown.language.rate).toBe(50);
    expect(breakdown.dsa.rate).toBe(100);
  });
});

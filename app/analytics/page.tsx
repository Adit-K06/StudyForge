"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Layers,
  Info,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Learning Analytics" subtitle="Mathematical metrics" showSyncButton={false} />
        <div className="flex-1 p-16 text-center text-sm text-[var(--text-muted)] animate-pulse">
          Loading learning metrics...
        </div>
      </div>
    );
  }

  const trackChartData = data?.tracks
    ? [
        { name: "Language", total: data.tracks.language.total, done: data.tracks.language.done },
        { name: "DSA", total: data.tracks.dsa.total, done: data.tracks.dsa.done },
        { name: "Project", total: data.tracks.project.total, done: data.tracks.project.done },
        { name: "Internship", total: data.tracks.internship.total, done: data.tracks.internship.done },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Learning Analytics"
        subtitle="Mathematical metrics and performance breakdown"
        showSyncButton={false}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-8">
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Completion Rate */}
          <div className="glass-panel p-5 rounded-3xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Completion Rate
              </span>
              <CheckCircle2 className="w-4 h-4 text-forest-400" />
            </div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text-primary)]">
              {data?.completion?.rate || 0}%
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {data?.completion?.doneTasks || 0} of {data?.completion?.totalTasks || 0} tasks done
            </p>
            <div className="pt-1 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)]">
              Formula: (done / total) × 100
            </div>
          </div>

          {/* 2. Planned vs Actual Focus */}
          <div className="glass-panel p-5 rounded-3xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Actual Focus Time
              </span>
              <Clock className="w-4 h-4 text-forest-400" />
            </div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text-primary)]">
              {Math.round((data?.time?.actualMinutes || 0) / 60)}h {(data?.time?.actualMinutes || 0) % 60}m
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Planned: {data?.time?.plannedMinutes || 0}m (Variance: {data?.time?.varianceMinutes > 0 ? "+" : ""}
              {data?.time?.varianceMinutes || 0}m)
            </p>
            <div className="pt-1 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)]">
              Formula: sum(focus_seconds) / 60
            </div>
          </div>

          {/* 3. Current Streak */}
          <div className="glass-panel p-5 rounded-3xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Current Streak
              </span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="font-mono text-3xl font-extrabold text-amber-400">
              {data?.streak?.currentStreakDays || 0} {data?.streak?.currentStreakDays === 1 ? "Day" : "Days"}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Active daily consistency</p>
            <div className="pt-1 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)]">
              Formula: Consecutive 24h active days
            </div>
          </div>

          {/* 4. Quiz History Score */}
          <div className="glass-panel p-5 rounded-3xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Quiz Attempts
              </span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="font-mono text-3xl font-extrabold text-[var(--text-primary)]">
              {data?.quizTrends?.length || 0}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Latest: {data?.quizTrends?.length > 0 ? `${data.quizTrends[data.quizTrends.length - 1].percentage}%` : "No attempts yet"}
            </p>
            <div className="pt-1 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)]">
              Formula: (total_score / max_score) × 100
            </div>
          </div>
        </div>

        {/* Charts Row 1: Focus Trends & Track Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Focus Time Area Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Daily Focus Duration</h3>
                <p className="text-xs text-[var(--text-muted)]">Total focus session minutes logged</p>
              </div>
              <TrendingUp className="w-4 h-4 text-forest-400" />
            </div>

            <div className="h-64 w-full">
              {data?.focusTrends && data.focusTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.focusTrends}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3d946f" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#3d946f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#234232" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#729683" fontSize={11} />
                    <YAxis stroke="#729683" fontSize={11} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e16",
                        borderColor: "#1a3829",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="minutes" stroke="#3d946f" fill="url(#focusGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Log focus sessions with the Focus stopwatch to see trends.
                </div>
              )}
            </div>
          </div>

          {/* Per-track Tasks Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Per-Track Tasks</h3>
                <p className="text-xs text-[var(--text-muted)]">Completed vs Total tasks across tracks</p>
              </div>
              <Layers className="w-4 h-4 text-forest-400" />
            </div>

            <div className="h-64 w-full">
              {trackChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trackChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#234232" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#729683" fontSize={11} />
                    <YAxis stroke="#729683" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1e16",
                        borderColor: "#1a3829",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="total" name="Total Tasks" fill="#2d7658" radius={[4, 4, 0, 0]} opacity={0.4} />
                    <Bar dataKey="done" name="Completed" fill="#3d946f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No tasks tracked yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Quiz Score Progression Trend */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Quiz Score Progression Trend</h3>
              <p className="text-xs text-[var(--text-muted)]">Score percentages across consecutive attempts</p>
            </div>
            <Award className="w-4 h-4 text-purple-400" />
          </div>

          <div className="h-64 w-full">
            {data?.quizTrends && data.quizTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.quizTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#234232" opacity={0.3} />
                  <XAxis dataKey="attempt" stroke="#729683" fontSize={11} />
                  <YAxis stroke="#729683" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1e16",
                      borderColor: "#1a3829",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Score %"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#a855f7" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                Take quizzes on the Quiz page to view performance progress.
              </div>
            )}
          </div>
        </div>

        {/* Mathematical Metric Definitions Card */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <Info className="w-4 h-4 text-forest-400" />
            <span>Formulas & Metric Integrity</span>
          </div>
          <ul className="text-xs text-[var(--text-muted)] space-y-1.5 list-disc pl-5">
            <li><strong>Completion Rate:</strong> Calculated as (done_tasks / total_tasks) × 100%.</li>
            <li><strong>Planned vs Actual:</strong> Sum of planned_minutes vs sum of seconds / 60 logged in focus_sessions.</li>
            <li><strong>Current Streak:</strong> Calculated by inspecting consecutive calendar days with at least 1 completed task or focus session.</li>
            <li><strong>No Invented Scores:</strong> All values are mathematical aggregations without arbitrary artificial multipliers.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

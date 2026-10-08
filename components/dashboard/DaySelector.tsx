"use client";

import React from "react";
import { Calendar, ChevronRight, CheckCircle2 } from "lucide-react";

export interface DayInfo {
  id: string;
  day_number: number;
  repo_path: string;
  content_hash: string;
  synced_at: string;
  total_tasks?: number;
  done_tasks?: number;
}

interface DaySelectorProps {
  days: DayInfo[];
  selectedDayNumber: number | null;
  onSelectDay: (dayNum: number) => void;
  isLoading?: boolean;
}

export function DaySelector({
  days,
  selectedDayNumber,
  onSelectDay,
  isLoading = false,
}: DaySelectorProps) {
  if (days.length === 0) {
    return (
      <div className="p-4 rounded-2xl glass-panel text-center text-sm text-[var(--text-muted)]">
        No days discovered yet. Click &quot;Sync Repo&quot; to fetch your curriculum roadmap.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center space-x-2.5 min-w-max">
        {days.map((day) => {
          const isSelected = selectedDayNumber === day.day_number;
          const isComplete = day.total_tasks && day.total_tasks > 0 && day.done_tasks === day.total_tasks;
          const pct = day.total_tasks && day.total_tasks > 0 ? Math.round(((day.done_tasks || 0) / day.total_tasks) * 100) : 0;

          return (
            <button
              key={day.day_number}
              onClick={() => onSelectDay(day.day_number)}
              type="button"
              className={`touch-target px-4 py-2.5 rounded-2xl flex items-center space-x-3 transition-all border text-left ${
                isSelected
                  ? "bg-forest-600 text-white border-forest-500 shadow-glow font-semibold"
                  : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-forest-500/50 hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Day
                </span>
                <span className="text-lg font-bold leading-none">{day.day_number}</span>
              </div>

              {day.total_tasks ? (
                <div className="flex items-center space-x-1.5 pl-2 border-l border-white/20">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <div className="text-[11px] font-mono opacity-90">
                      {day.done_tasks}/{day.total_tasks}
                    </div>
                  )}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

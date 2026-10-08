"use client";

import React, { useState } from "react";
import {
  Check,
  Clock,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { DatabaseTask } from "@/lib/tasks";

interface TaskItemProps {
  task: DatabaseTask;
  subtasks: DatabaseTask[];
  onToggleDone: (task: DatabaseTask, done: boolean) => Promise<void>;
  onEdit: (task: DatabaseTask) => void;
  onDelete: (id: string) => Promise<void>;
  onAddSubtask: (parentTask: DatabaseTask) => void;
  onMoveUp?: (task: DatabaseTask) => Promise<void>;
  onMoveDown?: (task: DatabaseTask) => Promise<void>;
}

export function TaskItem({
  task,
  subtasks,
  onToggleDone,
  onEdit,
  onDelete,
  onAddSubtask,
  onMoveUp,
  onMoveDown,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if all subtasks are completed
  const hasSubtasks = subtasks.length > 0;
  const allSubtasksDone = hasSubtasks && subtasks.every((st) => st.done);
  const promptAutoCompleteParent = hasSubtasks && allSubtasksDone && !task.done;

  const formattedDoneTime = task.done_at
    ? new Date(task.done_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      className={`glass-panel rounded-2xl border transition-all ${
        task.done
          ? "border-forest-600/30 bg-forest-950/20 opacity-80"
          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-forest-500/40"
      }`}
    >
      {/* Main Task Header Card */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        {/* Checkbox & Expand Toggle */}
        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleDone(task, !task.done)}
            aria-label={task.done ? "Mark task as incomplete" : "Mark task as complete"}
            className={`touch-target flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              task.done
                ? "bg-forest-600 border-forest-500 text-white shadow-sm"
                : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-forest-500/60"
            }`}
          >
            {task.done && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-base font-semibold text-[var(--text-primary)] task-strike ${
                  task.done ? "is-done" : ""
                }`}
              >
                {task.title}
              </span>

              {task.user_edited && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-500/15 text-forest-400 font-medium">
                  Customized
                </span>
              )}
            </div>

            {task.notes && (
              <p
                className={`text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-line ${
                  task.done ? "line-through opacity-70" : ""
                }`}
              >
                {task.notes}
              </p>
            )}

            {/* Metadata Badges: Duration, Start Time, Done Timestamp */}
            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-[var(--text-muted)]">
              {task.planned_minutes && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-forest-400" />
                  <span>{task.planned_minutes}m</span>
                </div>
              )}

              {task.planned_start && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-forest-400" />
                  <span>{new Date(task.planned_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}

              {formattedDoneTime && (
                <span className="text-[11px] font-mono text-forest-400">
                  Completed at {formattedDoneTime}
                </span>
              )}
            </div>

            {/* Prompt when all subtasks are done but parent is not */}
            {promptAutoCompleteParent && (
              <div className="mt-3 p-2.5 rounded-xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-between text-xs text-forest-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-forest-400" />
                  All subtasks finished! Mark parent complete?
                </span>
                <button
                  type="button"
                  onClick={() => onToggleDone(task, true)}
                  className="px-2.5 py-1 rounded-lg bg-forest-600 text-white font-semibold text-[11px] hover:bg-forest-500"
                >
                  Complete Parent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Controls: Expand Subtasks & Menu */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {hasSubtasks && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
              className="touch-target p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10 transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Task actions"
              className="touch-target p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 z-30 glass-panel rounded-2xl border border-[var(--border-color)] p-1.5 shadow-glass space-y-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddSubtask(task);
                    }}
                    className="touch-target w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-forest-500/15"
                  >
                    <Plus className="w-3.5 h-3.5 text-forest-400" />
                    <span>Add Sub-task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="touch-target w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-forest-500/15"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-forest-400" />
                    <span>Edit Task</span>
                  </button>
                  {onMoveUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveUp(task);
                      }}
                      className="touch-target w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-forest-500/15"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-forest-400" />
                      <span>Move Up</span>
                    </button>
                  )}
                  {onMoveDown && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveDown(task);
                      }}
                      className="touch-target w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-[var(--text-primary)] hover:bg-forest-500/15"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-forest-400" />
                      <span>Move Down</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="touch-target w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/15"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks Accordion */}
      {hasSubtasks && expanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2 border-t border-[var(--border-color)]/60 pt-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-2">
            <span>Exercises & Steps ({subtasks.filter((s) => s.done).length}/{subtasks.length})</span>
            <button
              type="button"
              onClick={() => onAddSubtask(task)}
              className="text-forest-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {subtasks.map((sub) => {
            const subDoneTime = sub.done_at
              ? new Date(sub.done_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <div
                key={sub.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                  sub.done
                    ? "bg-forest-950/20 border-forest-600/20 opacity-75"
                    : "bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-forest-500/30"
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleDone(sub, !sub.done)}
                    aria-label={sub.done ? "Mark subtask incomplete" : "Mark subtask complete"}
                    className={`touch-target flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      sub.done
                        ? "bg-forest-600 border-forest-500 text-white"
                        : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-forest-500/60"
                    }`}
                  >
                    {sub.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm text-[var(--text-primary)] task-strike ${
                        sub.done ? "is-done" : ""
                      }`}
                    >
                      {sub.title}
                    </span>

                    {sub.notes && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {sub.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--text-muted)]">
                      {sub.planned_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-forest-400" />
                          {sub.planned_minutes}m
                        </span>
                      )}
                      {subDoneTime && (
                        <span className="font-mono text-forest-400">
                          {subDoneTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(sub)}
                    aria-label="Edit subtask"
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(sub.id)}
                    aria-label="Delete subtask"
                    className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

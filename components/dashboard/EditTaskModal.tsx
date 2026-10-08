"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, FileText, Check } from "lucide-react";
import { DatabaseTask } from "@/lib/tasks";

interface EditTaskModalProps {
  task: DatabaseTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Partial<DatabaseTask> & { id: string }) => Promise<void>;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [plannedMinutes, setPlannedMinutes] = useState(task.planned_minutes || 30);
  const [plannedStart, setPlannedStart] = useState(
    task.planned_start ? task.planned_start.slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: task.id,
        title: title.trim(),
        notes,
        planned_minutes: plannedMinutes,
        planned_start: plannedStart ? new Date(plannedStart).toISOString() : null,
        user_edited: true,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-[var(--border-color)] shadow-glass space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit Task</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Notes / Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key notes, LeetCode link, or implementation reminders..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-forest-400" />
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(parseInt(e.target.value, 10) || 30)}
                className="touch-target w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-forest-400" />
                Planned Start (Optional)
              </label>
              <input
                type="datetime-local"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="touch-target w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="touch-target px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-forest-500/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="touch-target px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md hover:shadow-glow transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

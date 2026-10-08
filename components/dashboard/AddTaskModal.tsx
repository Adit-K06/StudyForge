"use client";

import React, { useState } from "react";
import { X, Plus, Clock, Tag } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: string | null;
  parentId?: string | null;
  initialTrack?: "language" | "dsa" | "project" | "internship";
  onAdd: (taskData: {
    title: string;
    notes: string;
    track: "language" | "dsa" | "project" | "internship";
    planned_minutes: number;
    parent_id?: string | null;
    planned_start?: string | null;
  }) => Promise<void>;
}

export function AddTaskModal({
  isOpen,
  onClose,
  dayId,
  parentId = null,
  initialTrack = "dsa",
  onAdd,
}: AddTaskModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [track, setTrack] = useState<"language" | "dsa" | "project" | "internship">(initialTrack);
  const [plannedMinutes, setPlannedMinutes] = useState(30);
  const [plannedStart, setPlannedStart] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        notes: notes.trim(),
        track,
        planned_minutes: plannedMinutes,
        parent_id: parentId,
        planned_start: plannedStart ? new Date(plannedStart).toISOString() : null,
      });
      setTitle("");
      setNotes("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-[var(--border-color)] shadow-glass space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {parentId ? "Add Sub-task" : "Add New Task"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!parentId && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Track
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["language", "dsa", "project"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrack(t)}
                    className={`touch-target py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                      track === t
                        ? "bg-forest-600 text-white border-forest-500 shadow-sm"
                        : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-forest-500/40"
                    }`}
                  >
                    {t === "language" ? "Language" : t === "dsa" ? "DSA" : "Project"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={parentId ? "e.g., Implement copy constructor" : "e.g., Vector Memory Layout & Operations"}
              className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details or resources for this task..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
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
                max={300}
                step={5}
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(parseInt(e.target.value, 10) || 30)}
                className="touch-target w-full px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Planned Start
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
              disabled={loading}
              className="touch-target px-5 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md hover:shadow-glow transition-all disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

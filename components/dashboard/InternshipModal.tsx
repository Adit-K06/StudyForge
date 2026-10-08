"use client";

import React, { useState } from "react";
import { X, Sparkles, Rocket, Clock, CheckCircle } from "lucide-react";

interface InternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InternshipModal({ isOpen, onClose, onSuccess }: InternshipModalProps) {
  if (!isOpen) return null;

  const [projectBrief, setProjectBrief] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(4);
  const [loading, setLoading] = useState(false);
  const [resultPlan, setResultPlan] = useState<any | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectBrief.trim()) return;

    setLoading(true);
    setResultPlan(null);

    try {
      const res = await fetch("/api/internship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectBrief: projectBrief.trim(),
          numberOfDays,
        }),
      });

      const data = await res.json();
      if (res.ok && data.plan) {
        setResultPlan(data.plan);
        onSuccess();
      } else {
        alert(data.error || "Failed to generate internship plan");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-[var(--border-color)] shadow-glass space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Internship Track Generator</h3>
              <p className="text-xs text-[var(--text-muted)]">Turn any project brief into an interview roadmap</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-forest-500/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!resultPlan ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Project Brief
              </label>
              <textarea
                rows={3}
                required
                value={projectBrief}
                onChange={(e) => setProjectBrief(e.target.value)}
                placeholder="e.g., Simple auth system with JWT, refresh tokens, and rate limiting"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Gemini will architect ideation, interview questions (networking, hashing, DB, JWT), and deployment steps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={numberOfDays}
                onChange={(e) => setNumberOfDays(parseInt(e.target.value, 10) || 4)}
                className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--border-color)]">
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
                className="touch-target px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md hover:shadow-glow flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Architecting Curriculum..." : "Generate Internship Plan"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-forest-500/15 border border-forest-500/30 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-forest-300">
                <CheckCircle className="w-5 h-5" />
                <span>{resultPlan.project_title}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{resultPlan.architecture_summary}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Key Interview Probe Topics:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {resultPlan.interview_topics?.map((topic: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-lg bg-forest-600/20 text-forest-300 font-medium border border-forest-600/30"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="touch-target px-6 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md"
              >
                View Generated Tasks on Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

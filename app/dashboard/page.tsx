"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
  Cpu,
  FolderGit2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Header } from "@/components/Header";
import { DaySelector, DayInfo } from "@/components/dashboard/DaySelector";
import { TaskItem } from "@/components/dashboard/TaskItem";
import { AddTaskModal } from "@/components/dashboard/AddTaskModal";
import { EditTaskModal } from "@/components/dashboard/EditTaskModal";
import { InternshipModal } from "@/components/dashboard/InternshipModal";
import { DatabaseTask } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [days, setDays] = useState<DayInfo[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "language" | "dsa" | "project" | "incomplete">("all");
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DatabaseTask | null>(null);
  const [activeParentForSubtask, setActiveParentForSubtask] = useState<DatabaseTask | null>(null);

  // Fetch Days
  const fetchDays = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: daysData, error } = await supabase
        .from("days")
        .select("id, day_number, repo_path, content_hash, synced_at")
        .order("day_number", { ascending: true });

      if (error) {
        console.error("Error fetching days:", error);
        return;
      }

      if (daysData && daysData.length > 0) {
        // Also fetch task counts per day
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("day_id, done");

        const countMap = new Map<string, { total: number; done: number }>();
        if (tasksData) {
          for (const t of tasksData) {
            if (!t.day_id) continue;
            const current = countMap.get(t.day_id) || { total: 0, done: 0 };
            current.total++;
            if (t.done) current.done++;
            countMap.set(t.day_id, current);
          }
        }

        const enrichedDays: DayInfo[] = daysData.map((d) => ({
          ...d,
          total_tasks: countMap.get(d.id)?.total || 0,
          done_tasks: countMap.get(d.id)?.done || 0,
        }));

        setDays(enrichedDays);

        // Select the first day by default if none selected
        if (selectedDayNum === null && enrichedDays.length > 0) {
          setSelectedDayNum(enrichedDays[0].day_number);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDays(false);
    }
  }, [selectedDayNum]);

  // Fetch Tasks for the selected Day
  const fetchTasksForDay = useCallback(async (dayNum: number) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/tasks?dayNumber=${dayNum}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchDays();
  }, [fetchDays]);

  useEffect(() => {
    if (selectedDayNum !== null) {
      fetchTasksForDay(selectedDayNum);
    }
  }, [selectedDayNum, fetchTasksForDay]);

  // Sync GitHub Repo
  const handleSyncRepo = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await fetchDays();
        if (selectedDayNum !== null) {
          await fetchTasksForDay(selectedDayNum);
        }
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (err: any) {
      alert("Failed to sync repository: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate Plan with Gemini
  const handleGeneratePlan = async () => {
    if (selectedDayNum === null) return;
    setIsGenerating(true);
    setConflicts([]);

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: selectedDayNum }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.tasks) {
          setTasks(data.tasks);
        }
        if (data.conflicts && data.conflicts.length > 0) {
          setConflicts(data.conflicts);
        }
        await fetchDays();
      } else {
        alert(data.error || "Plan generation failed");
      }
    } catch (err: any) {
      alert("Failed to generate plan: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Task Completion
  const handleToggleDone = async (task: DatabaseTask, done: boolean) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, done, done_at: done ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, done }),
      });

      if (!res.ok) {
        // Revert on failure
        setTasks(previousTasks);
      } else {
        // Update days counter
        fetchDays();
      }
    } catch (err) {
      setTasks(previousTasks);
    }
  };

  // Add Task / Subtask
  const handleAddTask = async (taskData: any) => {
    const selectedDay = days.find((d) => d.day_number === selectedDayNum);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...taskData,
        day_id: selectedDay?.id,
      }),
    });

    const data = await res.json();
    if (res.ok && data.task) {
      setTasks((prev) => [...prev, data.task]);
      fetchDays();
    }
  };

  // Edit Task
  const handleSaveEdit = async (updatedTask: Partial<DatabaseTask> & { id: string }) => {
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTask),
    });

    const data = await res.json();
    if (res.ok && data.task) {
      setTasks((prev) => prev.map((t) => (t.id === data.task.id ? data.task : t)));
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id && t.parent_id !== id));
      fetchDays();
    }
  };

  // Reorder Tasks Up/Down
  const handleMoveOrder = async (task: DatabaseTask, direction: "up" | "down") => {
    const siblings = tasks
      .filter((t) => t.parent_id === task.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const index = siblings.findIndex((t) => t.id === task.id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const otherTask = siblings[targetIndex];
    const newOrder = otherTask.sort_order;
    const otherNewOrder = task.sort_order;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) return { ...t, sort_order: newOrder };
        if (t.id === otherTask.id) return { ...t, sort_order: otherNewOrder };
        return t;
      })
    );

    await Promise.all([
      fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, sort_order: newOrder }),
      }),
      fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: otherTask.id, sort_order: otherNewOrder }),
      }),
    ]);
  };

  // Compute metrics
  const totalTasksCount = tasks.length;
  const doneTasksCount = tasks.filter((t) => t.done).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;
  const totalPlannedMinutes = tasks.reduce((sum, t) => sum + (t.planned_minutes || 0), 0);

  // Filter tasks
  const filteredParents = tasks
    .filter((t) => !t.parent_id)
    .filter((t) => {
      if (activeFilter === "incomplete") return !t.done;
      if (activeFilter === "language") return t.track === "language";
      if (activeFilter === "dsa") return t.track === "dsa";
      if (activeFilter === "project") return t.track === "project";
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  const getSubtasks = (parentId: string) =>
    tasks.filter((t) => t.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const selectedDay = days.find((d) => d.day_number === selectedDayNum);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Study Dashboard"
        subtitle="AI-driven roadmap & dynamic daily checklist"
        isSyncing={isSyncing}
        onSync={handleSyncRepo}
        showSyncButton={true}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Day Selector Bar */}
        <section aria-label="Roadmap Days">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Curriculum Days
            </h3>
            {days.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {days.length} days discovered from repo
              </span>
            )}
          </div>
          <DaySelector
            days={days}
            selectedDayNumber={selectedDayNum}
            onSelectDay={(num) => setSelectedDayNum(num)}
            isLoading={loadingDays}
          />
        </section>

        {/* If no days discovered yet */}
        {days.length === 0 && !loadingDays && (
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-[var(--border-color)] text-center space-y-4 max-w-xl mx-auto my-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Connect to your Roadmap Repo
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Click the button below to sync your repository. StudyForge will inspect the directory tree, parse day folders, and prepare them for AI plan generation.
            </p>
            <button
              onClick={handleSyncRepo}
              disabled={isSyncing}
              className="touch-target px-6 py-3 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-glow flex items-center justify-center space-x-2 mx-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing Repository..." : "Sync Repository Now"}</span>
            </button>
          </div>
        )}

        {/* Selected Day Stats & Plan Generation Header */}
        {selectedDayNum !== null && (
          <>
            {/* Diff / Conflict notification banner if preserved edits */}
            {conflicts.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Notice: Preserved {conflicts.length} Customized Tasks</span>
                  <p className="mt-0.5 opacity-90">
                    We updated the plan from the new curriculum source, but your custom-edited tasks were strictly preserved to protect your manual notes and progress.
                  </p>
                </div>
              </div>
            )}

            {/* Day Header Card */}
            <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-600 text-white">
                    Day {selectedDayNum}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Path: {selectedDay?.repo_path || `day${selectedDayNum}`}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  Daily Execution Plan
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-forest-400" />
                    {doneTasksCount} of {totalTasksCount} tasks completed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-forest-400" />
                    {totalPlannedMinutes} total planned minutes
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 flex-wrap">
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="touch-target px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-glow flex items-center space-x-2 transition-all disabled:opacity-50"
                  title="Generate study plan with Gemini 2.5 Flash"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin text-forest-200" : ""}`} />
                  <span>
                    {isGenerating
                      ? "Generating..."
                      : tasks.length === 0
                      ? "Generate Plan"
                      : "Refresh Plan"}
                  </span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="touch-target px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-forest-500/10 text-[var(--text-primary)] font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4 text-forest-400" />
                  <span>Add Task</span>
                </button>

                <button
                  onClick={() => setIsInternshipModalOpen(true)}
                  className="touch-target px-4 py-2.5 rounded-xl border border-forest-500/30 bg-forest-950/20 hover:bg-forest-900/30 text-forest-300 font-semibold text-xs sm:text-sm flex items-center space-x-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Internship Track</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {totalTasksCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Day Completion</span>
                  <span className="font-mono text-forest-400">{completionPercentage}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-600 via-forest-500 to-emerald-400 rounded-full transition-all duration-500 shadow-glow"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            {totalTasksCount > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1 pl-1 pr-2">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                {(
                  [
                    { id: "all", label: "All Tracks" },
                    { id: "incomplete", label: "Incomplete" },
                    { id: "language", label: "Language" },
                    { id: "dsa", label: "DSA" },
                    { id: "project", label: "Project" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      activeFilter === tab.id
                        ? "bg-forest-600 text-white font-semibold shadow-sm"
                        : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Plan Generation Empty State */}
            {tasks.length === 0 && !loadingTasks && (
              <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-dashed border-[var(--border-color)] text-center space-y-4 max-w-lg mx-auto">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-forest-600/15 text-forest-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  No plan generated yet for Day {selectedDayNum}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Click &quot;Generate Plan&quot; to have Gemini inspect this day&apos;s source files from your roadmap repo, extracting specific exercises, DSA problems, and project tasks.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="touch-target px-6 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md hover:shadow-glow inline-flex items-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Analyzing Files & Generating..." : "Generate Daily Plan"}</span>
                </button>
              </div>
            )}

            {/* Task List Grouped / Filtered */}
            {filteredParents.length > 0 && (
              <div className="space-y-4">
                {filteredParents.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    subtasks={getSubtasks(task.id)}
                    onToggleDone={handleToggleDone}
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={handleDeleteTask}
                    onAddSubtask={(parent) => {
                      setActiveParentForSubtask(parent);
                      setIsAddModalOpen(true);
                    }}
                    onMoveUp={(t) => handleMoveOrder(t, "up")}
                    onMoveDown={(t) => handleMoveOrder(t, "down")}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setActiveParentForSubtask(null);
        }}
        dayId={selectedDay?.id || null}
        parentId={activeParentForSubtask?.id}
        initialTrack={activeParentForSubtask?.track || "dsa"}
        onAdd={handleAddTask}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSave={handleSaveEdit}
      />

      {/* Internship Track Generator Modal */}
      <InternshipModal
        isOpen={isInternshipModalOpen}
        onClose={() => setIsInternshipModalOpen(false)}
        onSuccess={() => {
          if (selectedDayNum !== null) fetchTasksForDay(selectedDayNum);
        }}
      />
    </div>
  );
}

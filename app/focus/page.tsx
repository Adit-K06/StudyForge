"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { TreeGrowth } from "@/components/focus/TreeGrowth";
import { ambientAudio, NoiseType } from "@/lib/audio";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Volume1,
  Sparkles,
  Link2,
  Clock,
  History,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DatabaseTask } from "@/lib/tasks";

interface StoredSession {
  isRunning: boolean;
  sessionStart: number | null; // Date.now() timestamp
  lastResumed: number | null; // Date.now() timestamp
  accumulatedSeconds: number;
  linkedTaskId: string | null;
}

export default function FocusPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [linkedTaskId, setLinkedTaskId] = useState<string>("");
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Sound state
  const [activeSound, setActiveSound] = useState<NoiseType | "none">("none");
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);

  // References to keep exact timestamps
  const sessionRef = useRef<StoredSession>({
    isRunning: false,
    sessionStart: null,
    lastResumed: null,
    accumulatedSeconds: 0,
    linkedTaskId: null,
  });

  // Load active session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("studyforge_focus_session");
      if (saved) {
        const parsed: StoredSession = JSON.parse(saved);
        sessionRef.current = parsed;
        setIsRunning(parsed.isRunning);
        if (parsed.linkedTaskId) setLinkedTaskId(parsed.linkedTaskId);

        // Derive elapsed from timestamps
        let total = parsed.accumulatedSeconds || 0;
        if (parsed.isRunning && parsed.lastResumed) {
          total += (Date.now() - parsed.lastResumed) / 1000;
        }
        setElapsedSeconds(Math.floor(total));
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }

    // Fetch user tasks for linking
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d) => {
        if (d.tasks) setTasks(d.tasks.filter((t: DatabaseTask) => !t.done));
      })
      .catch(console.error);

    // Fetch past sessions
    fetchRecentSessions();
  }, []);

  const fetchRecentSessions = () => {
    fetch("/api/focus-sessions")
      .then((r) => r.json())
      .then((d) => {
        if (d.sessions) setSessions(d.sessions);
      })
      .catch(console.error);
  };

  // Sync timer tick: derives elapsed from timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      const cur = sessionRef.current;
      if (cur.isRunning && cur.lastResumed) {
        const now = Date.now();
        const diff = (now - cur.lastResumed) / 1000;
        const total = cur.accumulatedSeconds + diff;
        setElapsedSeconds(Math.floor(total));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const saveSessionToStorage = () => {
    localStorage.setItem(
      "studyforge_focus_session",
      JSON.stringify(sessionRef.current)
    );
  };

  // Timer Controls
  const handleStart = () => {
    const now = Date.now();
    sessionRef.current = {
      isRunning: true,
      sessionStart: sessionRef.current.sessionStart || now,
      lastResumed: now,
      accumulatedSeconds: sessionRef.current.accumulatedSeconds || 0,
      linkedTaskId: linkedTaskId || null,
    };
    setIsRunning(true);
    saveSessionToStorage();
  };

  const handlePause = () => {
    const cur = sessionRef.current;
    if (cur.isRunning && cur.lastResumed) {
      const added = (Date.now() - cur.lastResumed) / 1000;
      cur.accumulatedSeconds += added;
      cur.isRunning = false;
      cur.lastResumed = null;
      setIsRunning(false);
      setElapsedSeconds(Math.floor(cur.accumulatedSeconds));
      saveSessionToStorage();
    }
  };

  const handleStop = async () => {
    const cur = sessionRef.current;
    let finalSeconds = cur.accumulatedSeconds;
    if (cur.isRunning && cur.lastResumed) {
      finalSeconds += (Date.now() - cur.lastResumed) / 1000;
    }

    finalSeconds = Math.floor(finalSeconds);

    if (finalSeconds >= 10 && cur.sessionStart) {
      // Confetti celebration if focused for meaningful duration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3d946f", "#8eccaf", "#bae1ce", "#2d7658"],
        });
      } catch (e) {
        // Ignored
      }

      // Save to database
      try {
        await fetch("/api/focus-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: linkedTaskId || null,
            started_at: new Date(cur.sessionStart).toISOString(),
            ended_at: new Date().toISOString(),
            seconds: finalSeconds,
          }),
        });
        fetchRecentSessions();
      } catch (err) {
        console.error("Failed to save focus session:", err);
      }
    }

    // Reset timer
    sessionRef.current = {
      isRunning: false,
      sessionStart: null,
      lastResumed: null,
      accumulatedSeconds: 0,
      linkedTaskId: null,
    };
    setIsRunning(false);
    setElapsedSeconds(0);
    saveSessionToStorage();

    // Stop sound
    ambientAudio.stop();
    setActiveSound("none");
  };

  // Sound handler
  const handleSelectSound = (type: NoiseType | "none") => {
    setActiveSound(type);
    if (type === "none") {
      ambientAudio.stop();
    } else {
      ambientAudio.playNoise(type, isMuted ? 0 : volume);
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (!isMuted && activeSound !== "none") {
      ambientAudio.setVolume(v);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (activeSound !== "none") {
      ambientAudio.setVolume(nextMuted ? 0 : volume);
    }
  };

  // Format Elapsed Time HH:MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Focus Stopwatch"
        subtitle="Elapsed-time focus tracker with growing forest tree & ambient sound"
        showSyncButton={false}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Stopwatch Column */}
          <div className="lg:col-span-7 flex flex-col items-center glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-6 text-center">
            {/* Tree Growth Component */}
            <TreeGrowth elapsedSeconds={elapsedSeconds} />

            {/* Big Stopwatch Display */}
            <div className="space-y-1">
              <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {formatTime(elapsedSeconds)}
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {isRunning ? "Focus session in progress..." : elapsedSeconds > 0 ? "Session paused" : "Ready to focus"}
              </p>
            </div>

            {/* Task Link Selector */}
            <div className="w-full max-w-sm text-left">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-forest-400" />
                Link to Task (Optional)
              </label>
              <select
                value={linkedTaskId}
                onChange={(e) => {
                  setLinkedTaskId(e.target.value);
                  sessionRef.current.linkedTaskId = e.target.value || null;
                  saveSessionToStorage();
                }}
                disabled={isRunning}
                className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-60"
              >
                <option value="">No task selected (general focus)</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.track.toUpperCase()}] {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Stopwatch Control Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="touch-target px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm sm:text-base shadow-glow flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{elapsedSeconds > 0 ? "Resume" : "Start Focus"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="touch-target px-7 py-3.5 rounded-2xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-sm sm:text-base shadow-md flex items-center space-x-2 transition-all active:scale-95"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              {elapsedSeconds > 0 && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="touch-target px-6 py-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center space-x-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop & Save</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Ambient Audio + History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Ambient Sound Controller */}
            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-forest-600/20 text-forest-400 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Ambient Sound</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Web Audio synthetic white/brown noise</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-forest-500/10"
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-forest-400" />
                  )}
                </button>
              </div>

              {/* Noise Presets */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {(
                  [
                    { id: "none", label: "Off" },
                    { id: "brown", label: "Rain / Brown" },
                    { id: "pink", label: "Leaves / Pink" },
                    { id: "white", label: "White Noise" },
                  ] as const
                ).map((snd) => (
                  <button
                    key={snd.id}
                    type="button"
                    onClick={() => handleSelectSound(snd.id)}
                    className={`touch-target py-2 px-3 rounded-xl border transition-all text-center ${
                      activeSound === snd.id
                        ? "bg-forest-600 text-white border-forest-500 shadow-sm"
                        : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-forest-500/30"
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              {activeSound !== "none" && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-forest-500"
                  />
                </div>
              )}
            </div>

            {/* Recent Sessions List */}
            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border-color)]">
                <History className="w-4 h-4 text-forest-400" />
                <span>Recent Focus Sessions</span>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">
                  No focus sessions recorded yet. Start the stopwatch above!
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {sessions.slice(0, 8).map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-[var(--text-primary)] truncate">
                          {s.tasks?.title || "General Focus"}
                        </p>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {new Date(s.started_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(s.started_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-forest-600/15 text-forest-400 font-mono font-bold flex-shrink-0">
                        {Math.round(s.seconds / 60)} min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

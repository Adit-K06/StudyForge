import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Timer, CheckCircle, BrainCircuit } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 max-w-5xl mx-auto">
      {/* Hero Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5 text-forest-200" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Study<span className="text-forest-500">Forge</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="touch-target px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs sm:text-sm font-semibold shadow-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="my-16 sm:my-24 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-500/10 border border-forest-500/20 text-forest-400 text-xs font-semibold">
          <BrainCircuit className="w-4 h-4" />
          <span>AI-Driven Autonomous Study Planner</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] max-w-3xl mx-auto leading-tight">
          Turn your GitHub roadmap into dynamic daily mastery.
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          StudyForge continuously syncs your curriculum repository, dynamically turning code and guides into structured daily tasks, active recall quizzes, and interview-depth notes with Gemini.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="touch-target px-7 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-glow flex items-center space-x-2 transition-all hover:scale-105"
          >
            <span>Open Study Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="touch-target px-6 py-3.5 rounded-2xl glass-panel text-[var(--text-primary)] font-semibold text-sm hover:border-forest-500/50 transition-all"
          >
            <span>Sign In to Your Workspace</span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-16 text-left">
          <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Dynamic Plan Generation</h3>
            <p className="text-xs text-[var(--text-muted)]">
              No hardcoded curricula. Gemini structures your C++, Python, DSA, and project tasks dynamically from your repo files.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Active Recall & Quizzes</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Generate 30-question exam-style quizzes with deterministic MCQ grading and AI subjective evaluation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="w-9 h-9 rounded-xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Focus Stopwatch & Metrics</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Track actual focus time with growing tree visuals and ambient audio, surviving browser refresh and sleep.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)]">
        <span>StudyForge © 2026. Built with Next.js & Supabase.</span>
        <div className="flex space-x-4">
          <Link href="/dashboard" className="hover:text-[var(--text-primary)]">
            Dashboard
          </Link>
          <Link href="/settings" className="hover:text-[var(--text-primary)]">
            Settings
          </Link>
        </div>
      </footer>
    </div>
  );
}

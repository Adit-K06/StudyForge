"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  History,
  Send,
  Code,
  FileText,
  AlertCircle,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DayInfo } from "@/components/dashboard/DaySelector";
import { QuizQuestion, QuestionGrade } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";

export default function QuizPage() {
  const [days, setDays] = useState<DayInfo[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "mcq" | "coding" | "subjective">("all");
  const [viewHistory, setViewHistory] = useState(false);

  // Fetch Days
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("days")
      .select("id, day_number, repo_path, content_hash, synced_at")
      .order("day_number", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDays(data as DayInfo[]);
          setSelectedDayNum(data[0].day_number);
        }
      });

    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch("/api/quiz/history")
      .then((r) => r.json())
      .then((d) => {
        if (d.attempts) setHistory(d.attempts);
      })
      .catch(console.error);
  };

  // Generate or Load Quiz
  const handleLoadQuiz = useCallback(async (dayNum: number, force = false) => {
    setIsGenerating(true);
    setEvaluation(null);
    setAnswers({});
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: dayNum, forceRegenerate: force }),
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuizId(data.quizId);
        setQuestions(data.questions);
      } else {
        alert(data.error || "Failed to load quiz");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDayNum !== null) {
      handleLoadQuiz(selectedDayNum, false);
    }
  }, [selectedDayNum, handleLoadQuiz]);

  // Answer handler
  const handleSelectMcq = (questionId: string, optionIndex: number) => {
    if (evaluation) return; // Locked after grading
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleTextAnswer = (questionId: string, val: string) => {
    if (evaluation) return;
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  // Submit Exam
  const handleSubmitQuiz = async () => {
    if (!quizId) return;
    const answeredCount = Object.keys(answers).length;
    if (
      answeredCount < questions.length &&
      !confirm(`You have answered ${answeredCount} of ${questions.length} questions. Submit anyway?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluation(data);
        fetchHistory();

        if (data.percentage >= 70) {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#3d946f", "#8eccaf", "#ffd700"],
            });
          } catch (e) {}
        }
      } else {
        alert(data.error || "Submission failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === "mcq") return q.type === "mcq";
    if (activeFilter === "coding") return q.type === "coding";
    if (activeFilter === "subjective") return q.type === "subjective";
    return true;
  });

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Active Recall Quiz"
        subtitle="30 Dynamic questions with deterministic MCQ & AI rubric evaluation"
        showSyncButton={false}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Top Controls: Day selector + History Drawer Toggle */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Select Day:
            </label>
            <select
              value={selectedDayNum || ""}
              onChange={(e) => setSelectedDayNum(Number(e.target.value))}
              disabled={isGenerating || isSubmitting}
              className="touch-target px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              {days.map((d) => (
                <option key={d.day_number} value={d.day_number}>
                  Day {d.day_number}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setViewHistory(!viewHistory)}
              className="touch-target px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-forest-500/10 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <History className="w-4 h-4 text-forest-400" />
              <span>{viewHistory ? "Hide History" : "Past Attempts"}</span>
            </button>

            <button
              type="button"
              onClick={() => selectedDayNum && handleLoadQuiz(selectedDayNum, true)}
              disabled={isGenerating || isSubmitting}
              className="touch-target px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs shadow-md hover:shadow-glow flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Generating 30 Questions..." : "Regenerate Quiz"}</span>
            </button>
          </div>
        </div>

        {/* History Panel (Collapsible) */}
        {viewHistory && (
          <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] space-y-3 animate-fade-in">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-4 h-4 text-forest-400" />
              <span>Your Quiz Attempt History</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No past attempts found yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {history.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>Score: {att.total} / {att.max_total}</span>
                      <span className="font-mono text-forest-400">
                        {Math.round((att.total / (att.max_total || 1)) * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {new Date(att.graded_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Banner when graded */}
        {evaluation && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-forest-500/40 bg-forest-950/20 shadow-glow space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-600 text-white">
                  Exam Graded
                </span>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1.5">
                  Final Score: {evaluation.totalScore} / {evaluation.maxTotal} ({evaluation.percentage}%)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  MCQ questions graded deterministically. Coding & subjective answers evaluated by Gemini against standard rubrics.
                </p>
              </div>

              <button
                type="button"
                onClick={() => selectedDayNum && handleLoadQuiz(selectedDayNum, true)}
                className="touch-target px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs shadow-md"
              >
                Retake New Quiz
              </button>
            </div>
          </div>
        )}

        {/* Exam Navigation / Progress Bar */}
        {questions.length > 0 && !evaluation && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
              <span>Exam Progress ({answeredCount} of {questions.length} answered)</span>
              <span className="font-mono text-forest-400">{progressPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
              <div
                className="h-full bg-forest-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Question Type Filter Tabs */}
        {questions.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { id: "all", label: `All (${questions.length})` },
                { id: "mcq", label: `MCQ (${questions.filter((q) => q.type === "mcq").length})` },
                { id: "coding", label: `Coding (${questions.filter((q) => q.type === "coding").length})` },
                { id: "subjective", label: `Subjective (${questions.filter((q) => q.type === "subjective").length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`touch-target px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
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

        {/* Questions List */}
        {isGenerating ? (
          <div className="p-16 text-center text-sm text-[var(--text-muted)] animate-pulse space-y-2">
            <Sparkles className="w-8 h-8 text-forest-400 mx-auto animate-spin" />
            <p className="font-semibold text-[var(--text-primary)]">
              Generating 30 rigorous questions from Day {selectedDayNum} files...
            </p>
            <p className="text-xs">Preparing 15 MCQs, 8 Coding Problems, and 7 Subjective questions.</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)] glass-panel rounded-3xl">
            No questions available. Click &quot;Regenerate Quiz&quot; above.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const grade = evaluation?.perQuestionScore?.[q.id] as QuestionGrade | undefined;
              const hasAnswered = answers[q.id] !== undefined && answers[q.id] !== "";

              return (
                <div
                  key={q.id}
                  className={`glass-panel p-5 sm:p-7 rounded-3xl border transition-all space-y-4 ${
                    grade
                      ? grade.score === grade.maxScore
                        ? "border-emerald-500/40 bg-emerald-950/10"
                        : grade.score > 0
                        ? "border-amber-500/40 bg-amber-950/10"
                        : "border-red-500/40 bg-red-950/10"
                      : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
                  }`}
                >
                  {/* Header: Question Number, Type Badge, Marks */}
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border-color)]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-forest-400">
                        Q{questions.findIndex((orig) => orig.id === q.id) + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-forest-600/15 text-forest-400 uppercase font-bold text-[10px]">
                        {q.type}
                      </span>
                      {grade && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            grade.isAiGraded
                              ? "bg-purple-500/15 text-purple-300"
                              : "bg-blue-500/15 text-blue-300"
                          }`}
                        >
                          {grade.isAiGraded ? "AI-Graded with Rubric" : "Deterministically Graded"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[var(--text-muted)] font-mono">
                        {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                      </span>
                      {grade && (
                        <span
                          className={`font-mono font-bold ${
                            grade.score === grade.maxScore ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          Score: {grade.score}/{grade.maxScore}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm sm:text-base font-semibold text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {q.question}
                  </p>

                  {/* MCQ Options */}
                  {q.type === "mcq" && q.options && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = answers[q.id] === optIdx;
                        const isOriginalCorrect =
                          evaluation?.originalQuestions?.find((orig: any) => orig.id === q.id)?.correct_index === optIdx;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectMcq(q.id, optIdx)}
                            disabled={Boolean(evaluation)}
                            className={`touch-target w-full p-3 sm:p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                              evaluation
                                ? isOriginalCorrect
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                                  : isSelected
                                  ? "bg-red-500/20 border-red-500 text-red-300"
                                  : "bg-[var(--bg-primary)] border-[var(--border-color)] opacity-60"
                                : isSelected
                                ? "bg-forest-600 text-white border-forest-500 shadow-sm"
                                : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-forest-500/50"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Coding Question Editor */}
                  {q.type === "coding" && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={6}
                        value={answers[q.id] || ""}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        disabled={Boolean(evaluation)}
                        placeholder="Write your code solution (C++ / Python)..."
                        className="w-full p-3.5 rounded-2xl bg-black/40 border border-[var(--border-color)] font-mono text-xs sm:text-sm text-emerald-200 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  )}

                  {/* Subjective Question Box */}
                  {q.type === "subjective" && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={4}
                        value={answers[q.id] || ""}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        disabled={Boolean(evaluation)}
                        placeholder="Type your explanation or conceptual reasoning..."
                        className="w-full p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  )}

                  {/* Grade Feedback after grading */}
                  {grade && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs space-y-1 animate-fade-in">
                      <span className="font-bold text-[var(--text-secondary)]">Feedback:</span>
                      <p className="text-[var(--text-muted)] leading-relaxed">{grade.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Submit Action */}
            {!evaluation && (
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="touch-target px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm shadow-glow flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Grading with AI & Rubrics..." : "Submit Exam for Grading"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

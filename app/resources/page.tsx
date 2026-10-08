"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import {
  BookOpen,
  Sparkles,
  Download,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ChevronDown,
} from "lucide-react";
import { DayInfo } from "@/components/dashboard/DaySelector";
import { createClient } from "@/lib/supabase/client";

export default function ResourcesPage() {
  const [days, setDays] = useState<DayInfo[]>([]);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [noteMarkdown, setNoteMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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
  }, []);

  // Fetch Note when Day changes
  const fetchNote = useCallback(async (dayNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/study-notes?dayNumber=${dayNum}`);
      const data = await res.json();
      if (data.note?.markdown) {
        setNoteMarkdown(data.note.markdown);
      } else {
        setNoteMarkdown("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDayNum !== null) {
      fetchNote(selectedDayNum);
    }
  }, [selectedDayNum, fetchNote]);

  // Generate or Regenerate Note
  const handleGenerateNote = async () => {
    if (selectedDayNum === null) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/study-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber: selectedDayNum }),
      });
      const data = await res.json();
      if (res.ok && data.note?.markdown) {
        setNoteMarkdown(data.note.markdown);
      } else {
        alert(data.error || "Failed to generate notes");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!noteMarkdown) return;
    navigator.clipboard.writeText(noteMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Screen Header */}
      <div className="print:hidden">
        <Header
          title="Interview Study Notes"
          subtitle="Deep-dive concept breakdowns and staff interview prep"
          showSyncButton={false}
        />
      </div>

      <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Day Selector & Controls Bar */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Select Day:
            </label>
            <select
              value={selectedDayNum || ""}
              onChange={(e) => setSelectedDayNum(Number(e.target.value))}
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
            {noteMarkdown && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="touch-target px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-forest-500/10 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Copy markdown content"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-forest-400" />}
                  <span>{copied ? "Copied" : "Copy Markdown"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="touch-target px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-forest-500/10 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4 text-forest-400" />
                  <span>Download PDF</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleGenerateNote}
              disabled={isGenerating}
              className="touch-target px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs shadow-md hover:shadow-glow flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin text-forest-200" : ""}`} />
              <span>
                {isGenerating
                  ? "Generating Notes..."
                  : noteMarkdown
                  ? "Regenerate"
                  : "Generate Notes"}
              </span>
            </button>
          </div>
        </div>

        {/* AI Disclaimer Notice */}
        <div className="p-3.5 rounded-2xl bg-forest-500/10 border border-forest-500/20 text-[var(--text-secondary)] text-xs flex items-center space-x-2.5 print:hidden">
          <AlertTriangle className="w-4 h-4 text-forest-400 flex-shrink-0" />
          <span>
            <strong>AI-Generated Content:</strong> Grounded strictly in your Day {selectedDayNum} repository files. Verify critical edge cases and language specifics before technical interviews.
          </span>
        </div>

        {/* Notes Content Display */}
        {isLoading ? (
          <div className="p-16 text-center text-sm text-[var(--text-muted)] animate-pulse">
            Loading study notes...
          </div>
        ) : !noteMarkdown ? (
          <div className="glass-panel p-10 rounded-3xl border border-dashed border-[var(--border-color)] text-center space-y-4 max-w-lg mx-auto print:hidden">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-forest-600/15 text-forest-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              No notes generated yet for Day {selectedDayNum}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Click &quot;Generate Notes&quot; to have Gemini craft an interview-depth guide grounded in this day&apos;s curriculum files.
            </p>
            <button
              onClick={handleGenerateNote}
              disabled={isGenerating}
              className="touch-target px-6 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-md inline-flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Study Notes</span>
            </button>
          </div>
        ) : (
          <article className="glass-panel p-6 sm:p-10 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-6 prose dark:prose-invert max-w-none print:shadow-none print:border-none print:p-0">
            {/* Simple Markdown visual renderer */}
            <div className="space-y-4 text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap font-sans">
              {noteMarkdown.split("\n\n").map((block, idx) => {
                if (block.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3 mt-6">
                      {block.replace(/^# /, "")}
                    </h1>
                  );
                }
                if (block.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-lg sm:text-xl font-bold text-forest-400 mt-6 mb-2 border-b border-forest-600/20 pb-1">
                      {block.replace(/^## /, "")}
                    </h2>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-base font-semibold text-[var(--text-primary)] mt-4">
                      {block.replace(/^### /, "")}
                    </h3>
                  );
                }
                if (block.startsWith("```")) {
                  const cleaned = block.replace(/```[a-z]*\n?/gi, "");
                  return (
                    <pre key={idx} className="p-4 rounded-xl bg-black/40 border border-[var(--border-color)] text-xs font-mono overflow-x-auto text-emerald-200 my-3">
                      <code>{cleaned}</code>
                    </pre>
                  );
                }
                return (
                  <p key={idx} className="text-[var(--text-primary)]">
                    {block}
                  </p>
                );
              })}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

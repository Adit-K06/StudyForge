"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Settings as SettingsIcon, Save, FolderGit2, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/adi-training/swe-roadmap");
  const [repoBranch, setRepoBranch] = useState("main");
  const [rootPath, setRootPath] = useState("");
  const [ignoreFolders, setIgnoreFolders] = useState("archive, archived");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setRepoUrl(d.settings.repo_url || "");
          setRepoBranch(d.settings.repo_branch || "main");
          setRootPath(d.settings.root_path || "");
          if (Array.isArray(d.settings.ignore_folders)) {
            setIgnoreFolders(d.settings.ignore_folders.join(", "));
          }
          setLastSynced(d.settings.last_synced_at);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const parsedIgnore = ignoreFolders
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl,
          repo_branch: repoBranch,
          root_path: rootPath,
          ignore_folders: parsedIgnore,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLastSynced(data.timestamp);
        alert(`Sync successful! Discovered ${data.daysDiscovered} days.`);
      } else {
        alert(data.error || "Sync failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Settings"
        subtitle="Curriculum repository ingestion and ingestion rules"
        showSyncButton={false}
      />

      <main className="flex-1 p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] shadow-glass space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-[var(--border-color)]">
            <div className="w-10 h-10 rounded-xl bg-forest-600/20 text-forest-400 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Roadmap GitHub Repository
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Configure where your daily curriculum files are stored
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-forest-500/15 border border-forest-500/30 text-forest-400 text-xs sm:text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-forest-400" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                GitHub Repository URL
              </label>
              <input
                type="text"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/adi-training/swe-roadmap"
                className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Public or private repository URL. Private repos require GITHUB_TOKEN in your environment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Branch
                </label>
                <input
                  type="text"
                  required
                  value={repoBranch}
                  onChange={(e) => setRepoBranch(e.target.value)}
                  placeholder="main"
                  className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Root Path (Optional)
                </label>
                <input
                  type="text"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder="e.g. phase1 or leave empty"
                  className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Prefix subfolder to limit day discovery (e.g. &apos;phase1&apos;).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Ignore Folders (Comma-separated)
              </label>
              <input
                type="text"
                value={ignoreFolders}
                onChange={(e) => setIgnoreFolders(e.target.value)}
                placeholder="archive, archived"
                className="touch-target w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Folders ignored by the day discovery regex (default: archive, archived).
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="touch-target px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-forest-500/10 text-xs sm:text-sm font-semibold flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-forest-400" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Repository Now"}</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="touch-target px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-glow flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sync Info Card */}
        <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-[var(--text-secondary)]">
            <ShieldAlert className="w-4 h-4 text-forest-400" />
            <span>Non-Destructive Safe Sync Guarantee</span>
          </div>
          <p>
            When syncing or re-generating daily plans, StudyForge will never overwrite tasks you manually created or edited (<code className="font-mono text-forest-400">user_edited = true</code>). Custom notes, durations, and completion timestamps are preserved.
          </p>
          {lastSynced && (
            <p className="pt-1 font-mono text-[11px]">
              Last synced: {new Date(lastSynced).toLocaleString()}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

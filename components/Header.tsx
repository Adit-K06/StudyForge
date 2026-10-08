"use client";

import React, { useState } from "react";
import { RefreshCw, Sun, Moon, Sparkles, CheckCircle2 } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  isSyncing?: boolean;
  onSync?: () => void;
  lastSyncedText?: string;
  showSyncButton?: boolean;
}

export function Header({
  title = "Dashboard",
  subtitle = "Daily AI-Generated Study Plan",
  isSyncing = false,
  onSync,
  lastSyncedText,
  showSyncButton = true,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-normal">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {showSyncButton && onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            type="button"
            className="touch-target inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-forest-600/15 text-forest-500 hover:bg-forest-600/25 active:scale-95 disabled:opacity-50 border border-forest-600/25 transition-all"
            title="Sync roadmap repository from GitHub"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-forest-400" : ""}`} />
            <span className="hidden sm:inline">
              {isSyncing ? "Syncing..." : "Sync Repo"}
            </span>
          </button>
        )}

        {/* Mobile theme toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle dark/light theme"
          className="md:hidden touch-target p-2 rounded-xl text-[var(--text-secondary)] hover:bg-forest-500/10 border border-[var(--border-color)]"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-forest-600" />
          )}
        </button>
      </div>
    </header>
  );
}

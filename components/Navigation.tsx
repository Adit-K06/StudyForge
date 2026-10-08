"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Timer,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resources", href: "/resources", icon: BookOpen },
  { name: "Quiz", href: "/quiz", icon: HelpCircle },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-6 justify-between select-none">
      <div className="space-y-6">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5 text-forest-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Study<span className="text-forest-500">Forge</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">AI Curriculum Planner</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`touch-target flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-forest-600 text-white shadow-sm font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-forest-500/10 hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-forest-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-forest-900/40 text-forest-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Theme & Logout */}
      <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="touch-target w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-forest-500/10 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-forest-600" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <span className="text-xs text-[var(--text-muted)] capitalize">{theme}</span>
        </button>

        <button
          onClick={handleSignOut}
          type="button"
          aria-label="Log out"
          className="touch-target w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-t border-[var(--border-color)] px-2 py-1.5 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`touch-target flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
              isActive
                ? "text-forest-400 font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

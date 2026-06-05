"use client";

/**
 * Design System Showcase (/design)
 *
 * A DB-free, auth-free surface that renders the canonical design tokens and core
 * component patterns in both light and dark themes. Serves two purposes:
 *  1. A living reference for the design system (single source of truth in action).
 *  2. A visual-verification surface for the dark-mode / token migration (P2),
 *     since the core app surfaces are auth-gated and cannot be rendered without a DB.
 */

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const SWATCHES: { name: string; varName: string }[] = [
  { name: "bg / primary", varName: "--color-bg-primary" },
  { name: "bg / secondary", varName: "--color-bg-secondary" },
  { name: "text / primary", varName: "--color-text-primary" },
  { name: "text / secondary", varName: "--color-text-secondary" },
  { name: "border / default", varName: "--color-border-default" },
  { name: "blue", varName: "--color-blue" },
  { name: "green", varName: "--color-green" },
  { name: "red", varName: "--color-red" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-6">
        {children}
      </div>
    </section>
  );
}

export default function DesignShowcasePage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Design System</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Canonical tokens &amp; components — light / dark reference
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? "Switch to dark" : "Switch to light"}
          </button>
        </header>

        {/* Colors */}
        <Section title="Color tokens">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SWATCHES.map((s) => (
              <div key={s.varName} className="space-y-2">
                <div
                  className="h-16 rounded-lg border border-slate-200 dark:border-slate-700"
                  style={{ backgroundColor: `var(${s.varName})` }}
                />
                <div className="text-xs">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-slate-500 dark:text-slate-400">{s.varName}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-2">
            <p className="text-4xl font-bold">Display — the quick brown fox</p>
            <p className="text-2xl font-semibold">Heading — the quick brown fox</p>
            <p className="text-base">Body — the quick brown fox jumps over the lazy dog</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Caption — secondary supporting text
            </p>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors">
              Primary
            </button>
            <button className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Secondary
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
              Ghost
            </button>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors">
              Danger
            </button>
            <button
              disabled
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              Disabled
            </button>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Form inputs">
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm dark:text-slate-100 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 focus:outline-none transition-all"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Disabled</span>
              <input
                disabled
                placeholder="Unavailable"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </label>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-medium">
              Neutral
            </span>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3 py-1 text-xs font-medium">
              Info
            </span>
            <span className="rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 px-3 py-1 text-xs font-medium">
              Success
            </span>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium">
              Warning
            </span>
            <span className="rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-3 py-1 text-xs font-medium">
              Error
            </span>
          </div>
        </Section>

        {/* Alerts */}
        <Section title="Alerts">
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 px-4 py-3 text-sm">
              Informational message with supporting detail.
            </div>
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 px-4 py-3 text-sm">
              Success — your changes were saved.
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
              Error — something went wrong. Please try again.
            </div>
          </div>
        </Section>

        {/* Cards + radius/shadow */}
        <Section title="Surfaces (radius &amp; elevation)">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
              <div className="font-medium">Card / sm shadow</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">rounded-lg</div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-md">
              <div className="font-medium">Card / md shadow</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">rounded-xl</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-xl">
              <div className="font-medium">Card / xl shadow</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">rounded-2xl</div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

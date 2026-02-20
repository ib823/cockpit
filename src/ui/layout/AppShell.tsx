import React, { useState } from "react";
import clsx from "clsx";
import { useTheme } from "@/components/theme/ThemeProvider";

export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
}

export interface AppShellProps {
  nav: NavItem[];
  children: React.ReactNode;
  pageHeader?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ nav, children, pageHeader }) => {
  const [open, setOpen] = useState(true);
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] grid"
      style={{ gridTemplateColumns: open ? "240px 1fr" : "64px 1fr" }}
    >
      {/* Sidebar */}
      <aside
        className={clsx(
          "border-r border-[var(--line)] bg-[var(--surface)] transition-all duration-200 sticky top-0 h-screen hidden md:flex flex-col"
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="font-semibold truncate">Bound</div>
          <button
            className="p-1.5 rounded-md hover:bg-[var(--canvas)]"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M8 6l8 6-8 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="px-2 py-2 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <a
              key={item.key}
              href={item.href || "#"}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[var(--canvas)]",
                item.active && "bg-[var(--accent-soft)]"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto p-3">
          <button
            className="w-full h-9 rounded-md border border-[var(--line)] hover:bg-[var(--canvas)]"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        {/* Top bar (mobile) */}
        <div className="md:hidden sticky top-0 z-[40] bg-[var(--surface)] border-b border-[var(--line)] px-4 h-12 flex items-center justify-between">
          <button className="p-2 -ml-2" onClick={() => setOpen((o) => !o)} aria-label="Toggle nav">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="font-medium">Bound</div>
          <button
            className="p-2"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle theme"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m13.657-6.343l-1.414 1.414M7.757 16.243l-1.414 1.414m12.728 0l-1.414-1.414M7.757 7.757L6.343 6.343"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Page header */}
        {pageHeader && (
          <div className="px-4 lg:px-8 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
            {pageHeader}
          </div>
        )}

        {/* Content */}
        <main className="px-4 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

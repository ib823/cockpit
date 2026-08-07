"use client";

/**
 * Design system — Tabs (layer 3, Composites)
 *
 * For switching views *within* a screen. Route-level navigation belongs in
 * AppShell's sub-nav instead: a tab that changes the URL is a link wearing a
 * tab's clothes, and the two behave differently under a screen reader.
 *
 * Implements the ARIA tabs pattern properly, which is the part usually
 * missing: arrow keys move between tabs, Home/End jump to the ends, and only
 * the active tab is in the tab order — so Tab moves *out* of the tab strip
 * into the panel rather than walking through every tab.
 */

import { cx } from "./cx";
import React, { useId, useRef, type ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown after the label. */
  badge?: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Names the tab strip, e.g. "Security settings". */
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, label, children, className }: TabsProps) {
  const base = useId();
  const stripRef = useRef<HTMLDivElement | null>(null);

  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = (id: string) => `${base}-panel-${id}`;

  const move = (delta: number) => {
    const index = tabs.findIndex((t) => t.id === activeId);
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    onChange(next.id);
    // Focus follows selection, which is the automatic-activation variant of
    // the pattern — correct here because switching panels is cheap.
    stripRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(next.id))}`)
      ?.focus();
  };

  return (
    <div className={cx(styles.wrap, className)}>
      <div className={styles.strip} role="tablist" aria-label={label} ref={stripRef}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              id={tabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(tab.id)}
              // Only the active tab is tabbable, so Tab leaves the strip and
              // enters the panel instead of walking through every tab.
              tabIndex={active ? 0 : -1}
              className={cx(styles.tab, active && styles.tabActive)}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  move(1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(-1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  onChange(tabs[0].id);
                } else if (event.key === "End") {
                  event.preventDefault();
                  onChange(tabs[tabs.length - 1].id);
                }
              }}
            >
              {tab.label}
              {tab.badge != null && <span className={styles.badge}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={panelId(activeId)}
        aria-labelledby={tabId(activeId)}
        // Focusable so a keyboard user landing here from the strip has
        // somewhere to be when the panel holds only static content.
        tabIndex={0}
        className={styles.panel}
      >
        {children}
      </div>
    </div>
  );
}

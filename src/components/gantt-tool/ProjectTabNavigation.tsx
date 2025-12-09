/**
 * Project Tab Navigation
 *
 * Apple HIG-compliant tab bar for switching between project views:
 * - Timeline: Gantt chart view
 * - Context: Business context and requirements
 * - Financials: Cost and revenue analysis (protected)
 *
 * Design principles:
 * - Segmented control style (Apple Calendar/Mail tabs)
 * - Keyboard navigation (Arrow keys, Tab)
 * - WCAG 2.1 compliant
 * - Responsive (stack on mobile)
 *
 * SECURITY: Financials tab visibility is controlled by props
 * based on user permissions (determined server-side)
 */

"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import styles from "./ProjectTabNavigation.module.css";

export type ProjectTab = "timeline" | "context" | "financials";

interface ProjectTabNavigationProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  disabled?: boolean;
  showFinancialsTab?: boolean;
}

interface TabConfig {
  id: ProjectTab;
  label: string;
  shortLabel: string; // For mobile
  ariaLabel: string;
  protected?: boolean; // For protected tabs like Financials
}

const BASE_TABS: TabConfig[] = [
  {
    id: "timeline",
    label: "Timeline",
    shortLabel: "Timeline",
    ariaLabel: "View project timeline and Gantt chart",
  },
  {
    id: "context",
    label: "Context",
    shortLabel: "Context",
    ariaLabel: "Edit project context and requirements",
  },
];

const FINANCIALS_TAB: TabConfig = {
  id: "financials",
  label: "Financials",
  shortLabel: "Finance",
  ariaLabel: "View project financials and cost analysis",
  protected: true,
};

export function ProjectTabNavigation({
  activeTab,
  onTabChange,
  disabled = false,
  showFinancialsTab = false,
}: ProjectTabNavigationProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  // Build tabs array based on permissions
  const TABS = useMemo(() => {
    const tabs = [...BASE_TABS];
    if (showFinancialsTab) {
      tabs.push(FINANCIALS_TAB);
    }
    return tabs;
  }, [showFinancialsTab]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      const currentIndex = TABS.findIndex((t) => t.id === activeTab);

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
        onTabChange(TABS[prevIndex].id);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
        onTabChange(TABS[nextIndex].id);
      } else if (e.key === "Home") {
        e.preventDefault();
        onTabChange(TABS[0].id);
      } else if (e.key === "End") {
        e.preventDefault();
        onTabChange(TABS[TABS.length - 1].id);
      }
    },
    [activeTab, disabled, onTabChange, TABS]
  );

  useEffect(() => {
    const activeButton = tabListRef.current?.querySelector(
      `[data-tab="${activeTab}"]`
    ) as HTMLButtonElement;
    if (activeButton && document.activeElement?.getAttribute("role") === "tab") {
      activeButton.focus();
    }
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Project views"
        className={styles.tabList}
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = disabled;

          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              aria-label={tab.ariaLabel}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              className={`${styles.tab} ${isActive ? styles.active : ""} ${
                isDisabled ? styles.disabled : ""
              }`}
              onClick={() => !isDisabled && onTabChange(tab.id)}
            >
              <span className={styles.tabLabelFull}>{tab.label}</span>
              <span className={styles.tabLabelShort}>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Responsive Gantt Wrapper
 *
 * Intelligently switches between:
 * - Mobile (< 768px): Simplified list view for phones
 * - Tablet/Desktop (≥ 768px): Full Gantt canvas with timeline
 *
 * Provides optimal UX for each device type with touch-friendly interactions
 */

"use client";

import React, { useState, useEffect } from "react";
import { GanttCanvas } from "./GanttCanvas";
import { GanttMobileListView } from "./GanttMobileListView";
import { Alert } from "antd";
import { Smartphone, Tablet, Monitor, List, BarChart3 } from "lucide-react";

type ScreenSize = "mobile" | "tablet" | "desktop";
type ViewMode = "auto" | "timeline" | "list";

interface ResponsiveGanttWrapperProps {
  children?: React.ReactNode;
  showViewToggle?: boolean; // For development/testing
}

export function ResponsiveGanttWrapper({
  children,
  showViewToggle = false,
}: ResponsiveGanttWrapperProps) {
  const [screenSize, setScreenSize] = useState<ScreenSize>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Server-side rendering: render desktop version
  if (!isMounted) {
    return children;
  }

  // Determine which view to show
  const shouldShowListView =
    viewMode === "list" || (viewMode === "auto" && screenSize === "mobile");

  const shouldShowTimeline =
    viewMode === "timeline" || (viewMode === "auto" && screenSize !== "mobile");

  // Mobile: List view by default
  if (shouldShowListView) {
    return (
      <div className="h-full flex flex-col">
        {/* View Toggle for Mobile (optional) */}
        {showViewToggle && screenSize === "mobile" && (
          <div className="p-2 bg-white border-b flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">View:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === "list" || viewMode === "auto"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <List className="w-3 h-3" />
                List
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  (viewMode as ViewMode) === "timeline" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Timeline
              </button>
            </div>
          </div>
        )}

        {/* Mobile List View */}
        <div className="flex-1 overflow-auto">
          <GanttMobileListView />
        </div>
      </div>
    );
  }

  // Tablet: Full Gantt with touch optimization
  if (screenSize === "tablet") {
    return (
      <div className="h-full flex flex-col">
        {/* Tablet Info Banner (dismissible) */}
        <Alert
          type="success"
          icon={<Tablet className="w-4 h-4" />}
          message="Tablet View"
          description="Optimized for touch. All Gantt features available. Pinch to zoom, drag to pan."
          className="m-2 sm:m-4"
          closable
        />

        {/* Tablet-optimized Gantt */}
        <div className="flex-1 overflow-auto touch-pan-x touch-pan-y">{children}</div>
      </div>
    );
  }

  // Desktop: Full experience with all features
  return <>{children}</>;
}

/**
 * Responsive Breakpoints (Tailwind CSS)
 *
 * sm: 640px   - Small tablets and large phones (landscape)
 * md: 768px   - Tablets
 * lg: 1024px  - Small desktops and large tablets (landscape)
 * xl: 1280px  - Desktops
 * 2xl: 1536px - Large desktops
 *
 * Our Strategy:
 * - Mobile: < 640px (limited view, horizontal scroll)
 * - Tablet: 640px - 1024px (touch-optimized, all features)
 * - Desktop: >= 1024px (full features, mouse-optimized)
 */

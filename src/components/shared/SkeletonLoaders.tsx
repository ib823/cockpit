/**
 * Skeleton Loaders
 *
 * Professional loading placeholders that show the structure of content
 * while data is being fetched. Much better UX than spinners.
 */

"use client";

import { Skeleton } from "antd";

/**
 * Base Skeleton Line - Reusable building block
 */
function SkeletonLine({
  width = "100%",
  height = "16px",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse ${className}`}
      style={{
        width,
        height,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

/**
 * Project Card Skeleton
 * Used in project list/grid view
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
      {/* Title */}
      <SkeletonLine width="70%" height="24px" />

      {/* Meta info */}
      <div className="flex items-center gap-4">
        <SkeletonLine width="100px" height="14px" />
        <SkeletonLine width="100px" height="14px" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <SkeletonLine width="100%" height="14px" />
        <SkeletonLine width="90%" height="14px" />
        <SkeletonLine width="80%" height="14px" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 pt-2">
        <SkeletonLine width="60px" height="32px" className="rounded-full" />
        <SkeletonLine width="60px" height="32px" className="rounded-full" />
        <SkeletonLine width="60px" height="32px" className="rounded-full" />
      </div>
    </div>
  );
}

/**
 * Gantt Chart Skeleton
 * Shows structure of gantt chart while loading
 */
export function GanttChartSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Timeline header */}
      <div className="h-16 bg-gradient-to-b from-gray-100 to-white rounded-lg flex items-center px-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <SkeletonLine key={i} width="60px" height="32px" />
        ))}
      </div>

      {/* Phase bars */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-4">
            {/* Controls */}
            <SkeletonLine width="80px" height="48px" />

            {/* Phase bar */}
            <div
              className="flex-1 rounded-lg"
              style={{
                marginLeft: `${i * 8}%`,
                width: `${60 - i * 10}%`,
              }}
            >
              <SkeletonLine height="56px" />
            </div>
          </div>

          {/* Tasks (if expanded) */}
          {i % 2 === 0 && (
            <div className="ml-20 space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-4">
                  <SkeletonLine width="60px" height="32px" />
                  <div
                    className="flex-1"
                    style={{
                      marginLeft: `${j * 5}%`,
                      width: `${40 - j * 8}%`,
                    }}
                  >
                    <SkeletonLine height="32px" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Org Chart Node Skeleton
 * Used while loading organization chart
 */
export function OrgChartNodeSkeleton() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 w-[240px] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="80px" height="14px" />
        <SkeletonLine width="24px" height="24px" className="rounded-full" />
      </div>

      {/* Name */}
      <SkeletonLine width="70%" height="18px" />

      {/* Designation */}
      <SkeletonLine width="50%" height="12px" />

      {/* Work status */}
      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
        <SkeletonLine width="40px" height="24px" className="rounded" />
        <SkeletonLine width="40px" height="24px" className="rounded" />
      </div>
    </div>
  );
}

/**
 * Resource List Item Skeleton
 * Used in resource management modal
 */
export function ResourceListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      {/* Avatar */}
      <SkeletonLine width="48px" height="48px" className="rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <SkeletonLine width="60%" height="16px" />
        <SkeletonLine width="40%" height="12px" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <SkeletonLine width="80px" height="32px" className="rounded" />
        <SkeletonLine width="32px" height="32px" className="rounded" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 * Generic table row placeholder
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="flex-1">
          <SkeletonLine height="16px" width={i === 0 ? "80%" : "60%"} />
        </div>
      ))}
    </div>
  );
}

/**
 * Modal Content Skeleton
 * Used while modal content is loading
 */
export function ModalContentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Title */}
      <SkeletonLine width="50%" height="24px" />

      {/* Form fields */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonLine width="120px" height="14px" />
          <SkeletonLine width="100%" height="40px" className="rounded-lg" />
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <SkeletonLine width="100px" height="40px" className="rounded-lg" />
        <SkeletonLine width="100px" height="40px" className="rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Dashboard Card Skeleton
 * Used for dashboard widgets
 */
export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="40%" height="20px" />
        <SkeletonLine width="32px" height="32px" className="rounded-full" />
      </div>

      {/* Big number */}
      <SkeletonLine width="60%" height="48px" />

      {/* Trend */}
      <div className="flex items-center gap-2">
        <SkeletonLine width="80px" height="24px" className="rounded-full" />
        <SkeletonLine width="100px" height="14px" />
      </div>

      {/* Mini chart */}
      <div className="h-24 flex items-end gap-1">
        {[...Array(12)].map((_, i) => (
          <SkeletonLine key={i} width="100%" height={`${Math.random() * 60 + 40}%`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Full Page Skeleton
 * Used for entire page loading states
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div className="space-y-2">
          <SkeletonLine width="300px" height="32px" />
          <SkeletonLine width="200px" height="16px" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonLine width="120px" height="40px" className="rounded-lg" />
          <SkeletonLine width="120px" height="40px" className="rounded-lg" />
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * List Skeleton
 * Generic list loading state
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-0">
      {[...Array(items)].map((_, i) => (
        <ResourceListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Compact Skeleton - for inline loading
 */
export function CompactSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <SkeletonLine key={i} height="20px" />
      ))}
    </div>
  );
}

/**
 * Add shimmer animation to global styles
 * This should be added to your global CSS file:
 *
 * @keyframes shimmer {
 *   0% { background-position: -200% 0; }
 *   100% { background-position: 200% 0; }
 * }
 */

// Export individual skeleton types for custom compositions
export { SkeletonLine };

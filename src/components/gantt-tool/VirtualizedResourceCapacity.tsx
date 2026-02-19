/**
 * Virtualized Resource Capacity Component
 *
 * PERFORMANCE: Uses react-window for virtualized rendering of large resource lists.
 * Only renders visible rows, dramatically improving performance for 50+ resources.
 *
 * Key optimizations:
 * - Virtual scrolling with react-window VariableSizeList
 * - Memoized row components
 * - Stable callback references
 * - O(1) capacity data lookups via Map
 */

import React, { memo, useCallback, useMemo, useRef } from "react";
// @ts-expect-error react-window types may not export VariableSizeList in all versions
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import type { Resource, ResourceCategory } from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES } from "@/types/gantt-tool";
import {
  ResourceRowMemoized,
  ResourceCapacityRowMemoized,
  getResourceDisplayInfo,
} from "./ResourceRowMemoized";
import type { ResourceCapacityResult } from "@/lib/gantt-tool/resource-capacity-calculator";

// ============================================================================
// Constants
// ============================================================================

const GROUP_HEADER_HEIGHT = 36;
const RESOURCE_ROW_HEIGHT = 44;

// ============================================================================
// Types
// ============================================================================

interface SubCompanyInfo {
  name: string;
  parentCompany: string;
  indicatorColor?: string;
}

interface FunctionalGroup {
  id: string;
  name: string;
  leadResource: Resource | null;
  members: Resource[];
  color: string;
}

interface VirtualizedResourceCapacityProps {
  functionalGroups: FunctionalGroup[];
  collapsedTeams: Set<string>;
  selectedResourceIds: Set<string>;
  resourceCapacityMap: Map<string, ResourceCapacityResult>;
  projectWeeks: { weekIdentifier: string; weekStartDate: Date; weekEndDate: Date }[];
  companyLogos: Record<string, string>;
  subCompanies: SubCompanyInfo[];
  editingCell: { resourceId: string; weekId: string } | null;
  editingCellValue: string;
  getPositionPercent: (date: Date) => number;
  onToggleGroupCollapse: (groupId: string) => void;
  onToggleResourceSelection: (resourceId: string) => void;
  onSelectGroupResources: (groupId: string, members: Resource[], allSelected: boolean) => void;
  onResourceEdit: (resourceId: string) => void;
  onCellClick: (resourceId: string, weekId: string, currentValue: number) => void;
  onCellValueChange: (value: string) => void;
  onCellEdit: (resourceId: string, weekId: string, value: number) => void;
  onCellEditCancel: () => void;
  // For synchronized scrolling between sidebar and timeline
  scrollTop?: number;
  onScroll?: (scrollTop: number) => void;
}

// Row types for the virtual list
type VirtualRow =
  | { type: "group-header"; group: FunctionalGroup; isCollapsed: boolean; allSelected: boolean; someSelected: boolean }
  | { type: "resource"; resource: Resource; groupColor: string };

// ============================================================================
// Memoized Group Header Component
// ============================================================================

const GroupHeaderRow = memo(function GroupHeaderRow({
  group,
  isCollapsed,
  allSelected,
  someSelected,
  onToggle,
  onSelectAll,
}: {
  group: FunctionalGroup;
  isCollapsed: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
}) {
  const groupColor = group.color;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 24px 0 32px",
        height: `${GROUP_HEADER_HEIGHT}px`,
        backgroundColor: `${groupColor}08`,
        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
        borderLeft: `3px solid ${groupColor}`,
        cursor: "pointer",
      }}
      onClick={onToggle}
    >
      {/* Group Checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectAll();
        }}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: allSelected || someSelected
            ? `2px solid ${groupColor}`
            : "2px solid rgba(0, 0, 0, 0.2)",
          backgroundColor: allSelected ? groupColor : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {allSelected && <Check size={10} style={{ color: "#fff" }} />}
        {someSelected && !allSelected && (
          <div style={{ width: 8, height: 2, backgroundColor: groupColor, borderRadius: 1 }} />
        )}
      </div>

      {isCollapsed ? (
        <ChevronRight size={14} style={{ color: groupColor, opacity: 0.8 }} />
      ) : (
        <ChevronDown size={14} style={{ color: groupColor, opacity: 0.8 }} />
      )}
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: groupColor,
          letterSpacing: "-0.01em",
        }}
      >
        {group.name}
      </span>
      <span
        style={{
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
        }}
      >
        ({group.members.length})
      </span>
      {group.leadResource && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-text-tertiary)",
            marginLeft: "auto",
          }}
        >
          Lead: {group.leadResource.name}
        </span>
      )}
      {isCollapsed && (
        <span
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: "#FF9500",
            backgroundColor: "rgba(255, 149, 0, 0.1)",
            padding: "2px 6px",
            borderRadius: 4,
            marginLeft: group.leadResource ? "8px" : "auto",
          }}
        >
          Collapsed
        </span>
      )}
    </div>
  );
});

// ============================================================================
// Virtualized Resource Sidebar (Left Panel)
// ============================================================================

export const VirtualizedResourceSidebar = memo(function VirtualizedResourceSidebar({
  functionalGroups,
  collapsedTeams,
  selectedResourceIds,
  companyLogos,
  subCompanies,
  onToggleGroupCollapse,
  onToggleResourceSelection,
  onSelectGroupResources,
  onResourceEdit,
  scrollTop,
  onScroll,
}: Omit<VirtualizedResourceCapacityProps,
  | "resourceCapacityMap"
  | "projectWeeks"
  | "editingCell"
  | "editingCellValue"
  | "getPositionPercent"
  | "onCellClick"
  | "onCellValueChange"
  | "onCellEdit"
  | "onCellEditCancel"
>) {
  const listRef = useRef<List>(null);

  // Build flat list of virtual rows
  const virtualRows = useMemo((): VirtualRow[] => {
    const rows: VirtualRow[] = [];

    functionalGroups.forEach((group) => {
      const isCollapsed = collapsedTeams.has(group.id);
      const allSelected = group.members.every((r) => selectedResourceIds.has(r.id));
      const someSelected = group.members.some((r) => selectedResourceIds.has(r.id));

      rows.push({
        type: "group-header",
        group,
        isCollapsed,
        allSelected,
        someSelected,
      });

      if (!isCollapsed) {
        group.members.forEach((resource) => {
          rows.push({
            type: "resource",
            resource,
            groupColor: group.color,
          });
        });
      }
    });

    return rows;
  }, [functionalGroups, collapsedTeams, selectedResourceIds]);

  // Get row height
  const getItemSize = useCallback((index: number) => {
    const row = virtualRows[index];
    return row.type === "group-header" ? GROUP_HEADER_HEIGHT : RESOURCE_ROW_HEIGHT;
  }, [virtualRows]);

  // Render row
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = virtualRows[index];

    if (row.type === "group-header") {
      return (
        <div style={style}>
          <GroupHeaderRow
            group={row.group}
            isCollapsed={row.isCollapsed}
            allSelected={row.allSelected}
            someSelected={row.someSelected}
            onToggle={() => onToggleGroupCollapse(row.group.id)}
            onSelectAll={() => onSelectGroupResources(row.group.id, row.group.members, row.allSelected)}
          />
        </div>
      );
    }

    const { logo, indicatorColor } = getResourceDisplayInfo(row.resource, companyLogos, subCompanies);

    return (
      <div style={style}>
        <ResourceRowMemoized
          resource={row.resource}
          isSelected={selectedResourceIds.has(row.resource.id)}
          logo={logo}
          indicatorColor={indicatorColor}
          onSelect={onToggleResourceSelection}
          onEdit={onResourceEdit}
        />
      </div>
    );
  }, [
    virtualRows,
    selectedResourceIds,
    companyLogos,
    subCompanies,
    onToggleGroupCollapse,
    onSelectGroupResources,
    onToggleResourceSelection,
    onResourceEdit,
  ]);

  // Handle scroll synchronization
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);

  // Sync scroll position from external source
  React.useEffect(() => {
    if (scrollTop !== undefined && listRef.current) {
      listRef.current.scrollTo(scrollTop);
    }
  }, [scrollTop]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          itemCount={virtualRows.length}
          itemSize={getItemSize}
          onScroll={handleScroll}
          overscanCount={5}
          style={{ willChange: "transform" }}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
});

// ============================================================================
// Virtualized Resource Timeline (Right Panel)
// ============================================================================

export const VirtualizedResourceTimeline = memo(function VirtualizedResourceTimeline({
  functionalGroups,
  collapsedTeams,
  selectedResourceIds,
  resourceCapacityMap,
  projectWeeks,
  editingCell,
  editingCellValue,
  getPositionPercent,
  onToggleGroupCollapse,
  onCellClick,
  onCellValueChange,
  onCellEdit,
  onCellEditCancel,
  scrollTop,
  onScroll,
}: Omit<VirtualizedResourceCapacityProps,
  | "companyLogos"
  | "subCompanies"
  | "onToggleResourceSelection"
  | "onSelectGroupResources"
  | "onResourceEdit"
>) {
  const listRef = useRef<List>(null);

  // Build flat list of virtual rows (matching sidebar structure)
  const virtualRows = useMemo((): VirtualRow[] => {
    const rows: VirtualRow[] = [];

    functionalGroups.forEach((group) => {
      const isCollapsed = collapsedTeams.has(group.id);
      const allSelected = group.members.every((r) => selectedResourceIds.has(r.id));
      const someSelected = group.members.some((r) => selectedResourceIds.has(r.id));

      rows.push({
        type: "group-header",
        group,
        isCollapsed,
        allSelected,
        someSelected,
      });

      if (!isCollapsed) {
        group.members.forEach((resource) => {
          rows.push({
            type: "resource",
            resource,
            groupColor: group.color,
          });
        });
      }
    });

    return rows;
  }, [functionalGroups, collapsedTeams, selectedResourceIds]);

  // Get row height
  const getItemSize = useCallback((index: number) => {
    const row = virtualRows[index];
    return row.type === "group-header" ? GROUP_HEADER_HEIGHT : RESOURCE_ROW_HEIGHT;
  }, [virtualRows]);

  // Render row
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = virtualRows[index];

    if (row.type === "group-header") {
      // Empty row for group header (timeline doesn't show header content)
      return (
        <div
          style={{
            ...style,
            backgroundColor: `${row.group.color}08`,
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        />
      );
    }

    const capacityData = resourceCapacityMap.get(row.resource.id);

    return (
      <div style={style}>
        <ResourceCapacityRowMemoized
          resource={row.resource}
          isSelected={selectedResourceIds.has(row.resource.id)}
          capacityData={capacityData}
          projectWeeks={projectWeeks}
          getPositionPercent={getPositionPercent}
          editingCell={editingCell}
          editingCellValue={editingCellValue}
          onCellClick={onCellClick}
          onCellValueChange={onCellValueChange}
          onCellEdit={onCellEdit}
          onCellEditCancel={onCellEditCancel}
        />
      </div>
    );
  }, [
    virtualRows,
    selectedResourceIds,
    resourceCapacityMap,
    projectWeeks,
    getPositionPercent,
    editingCell,
    editingCellValue,
    onCellClick,
    onCellValueChange,
    onCellEdit,
    onCellEditCancel,
  ]);

  // Handle scroll synchronization
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);

  // Sync scroll position from external source
  React.useEffect(() => {
    if (scrollTop !== undefined && listRef.current) {
      listRef.current.scrollTo(scrollTop);
    }
  }, [scrollTop]);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          ref={listRef}
          height={height}
          width={width}
          itemCount={virtualRows.length}
          itemSize={getItemSize}
          onScroll={handleScroll}
          overscanCount={5}
          style={{ willChange: "transform" }}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );
});

// ============================================================================
// Hook for synchronized scrolling
// ============================================================================

export function useSynchronizedScroll() {
  const [scrollTop, setScrollTop] = React.useState(0);

  const handleSidebarScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  const handleTimelineScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  return {
    scrollTop,
    handleSidebarScroll,
    handleTimelineScroll,
  };
}

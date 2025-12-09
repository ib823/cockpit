/**
 * OrgChartPro - Apple-Quality Organization Chart
 *
 * Design Principles (Steve Jobs / Jony Ive):
 * - Deep simplicity: One unified implementation, not scattered fragments
 * - Direct manipulation: Drag nodes to restructure, inline editing
 * - Keyboard-first: Full navigation without mouse
 * - Touch-ready: 44pt minimum targets, gesture support
 * - Progressive disclosure: Show complexity only when needed
 *
 * Features:
 * - 280x120px cards with glassmorphism on selection
 * - Collapsible subtrees with animated transitions
 * - Keyboard navigation (arrows, tab, enter, delete)
 * - Minimap navigator for large charts
 * - Responsive breakpoints: mobile, tablet, desktop
 * - Zero debug logging in production
 */

"use client";

import { useState, useRef, useCallback, useMemo, useEffect, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import type {
  GanttProject,
  Resource,
  ResourceDesignation,
  ResourceCategory,
  ResourceFormData,
  ResourceGroup,
  OrgChartConnection,
  ConnectionAnchor,
} from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import { ResourceEditModal } from "./ResourceEditModal";
import {
  autoOrganizeHierarchy,
  getHierarchyStats,
  calculateHierarchicalPositions,
} from "@/lib/gantt-tool/org-chart-auto-organize";
import {
  exportOrgChartToPNG,
  exportOrgChartToPDF,
  exportOrgChartToPPT,
} from "@/lib/gantt-tool/export-utils";

// ============================================================================
// Design Tokens - Apple HIG Compliant
// ============================================================================

const TOKENS = {
  // Card dimensions (8pt grid)
  card: {
    width: 280,
    height: 120,
    gap: 100,
    levelGap: 160,
    padding: 80,
  },
  // Colors - Apple system colors
  colors: {
    bg: {
      primary: "#FFFFFF",
      secondary: "#F5F5F7",
      glass: "rgba(255, 255, 255, 0.72)",
      overlay: "rgba(0, 0, 0, 0.4)",
    },
    text: {
      primary: "#1D1D1F",
      secondary: "#86868B",
      tertiary: "#AEAEB2",
      inverse: "#FFFFFF",
    },
    border: {
      default: "#E5E5EA",
      subtle: "#F2F2F7",
      focus: "#007AFF",
    },
    accent: {
      blue: "#007AFF",
      green: "#34C759",
      red: "#FF3B30",
      orange: "#FF9500",
      purple: "#AF52DE",
    },
  },
  // Typography - SF Pro
  typography: {
    family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif",
    size: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 28 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  // Animations - Apple spring physics
  spring: {
    default: { type: "spring", stiffness: 300, damping: 30 },
    gentle: { type: "spring", stiffness: 200, damping: 25 },
    snappy: { type: "spring", stiffness: 400, damping: 35 },
    quick: { type: "spring", stiffness: 500, damping: 30 },
  },
  // Breakpoints
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
  },
} as const;

// Category priority order for list sorting (lower = higher priority)
// Leadership at top, then PM, Change Management, Functional, Technical, Security, Basis, QA, Client, Other
const CATEGORY_SORT_ORDER: Record<ResourceCategory, number> = {
  leadership: 0,
  pm: 1,
  change: 2,
  functional: 3,
  technical: 4,
  security: 5,
  basis: 6,
  qa: 7,
  client: 9, // Client placeholders near the bottom
  other: 8,
};

// ============================================================================
// Types
// ============================================================================

interface NodePosition {
  x: number;
  y: number;
}

interface LayoutBounds {
  width: number;
  height: number;
  minX: number;
  minY: number;
}

type DeviceType = "mobile" | "tablet" | "desktop";

type DropZone = "child" | "root" | null;

interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  hoveredId: string | null;
  dropZone: DropZone;
}

// ============================================================================
// Layout Engine - Reingold-Tilford Algorithm
// ============================================================================

function calculateSubtreeWidth(
  resourceId: string,
  resources: Resource[],
  collapsedNodes: Set<string>
): number {
  if (collapsedNodes.has(resourceId)) {
    return TOKENS.card.width;
  }

  const children = resources.filter(r => r.managerResourceId === resourceId);
  if (children.length === 0) {
    return TOKENS.card.width;
  }

  let totalWidth = 0;
  children.forEach((child, idx) => {
    totalWidth += calculateSubtreeWidth(child.id, resources, collapsedNodes);
    if (idx < children.length - 1) {
      totalWidth += TOKENS.card.gap;
    }
  });

  return Math.max(totalWidth, TOKENS.card.width);
}

function calculateLayout(
  resources: Resource[],
  collapsedNodes: Set<string>
): { positions: Map<string, NodePosition>; bounds: LayoutBounds } {
  const positions = new Map<string, NodePosition>();
  const validIds = new Set(resources.map(r => r.id));

  // Find roots: no manager or manager not in list
  const roots = resources.filter(r =>
    !r.managerResourceId || !validIds.has(r.managerResourceId)
  );

  if (roots.length === 0 && resources.length > 0) {
    // Fallback grid for broken data
    resources.forEach((r, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      positions.set(r.id, {
        x: TOKENS.card.padding + col * (TOKENS.card.width + TOKENS.card.gap),
        y: TOKENS.card.padding + row * (TOKENS.card.height + TOKENS.card.levelGap),
      });
    });
    return {
      positions,
      bounds: {
        width: TOKENS.card.padding * 2 + 4 * (TOKENS.card.width + TOKENS.card.gap),
        height: TOKENS.card.padding * 2 + Math.ceil(resources.length / 4) * (TOKENS.card.height + TOKENS.card.levelGap),
        minX: 0,
        minY: 0,
      },
    };
  }

  let currentX = TOKENS.card.padding;
  let maxDepth = 0;

  function positionSubtree(
    resourceId: string,
    startX: number,
    level: number
  ): number {
    maxDepth = Math.max(maxDepth, level);
    const y = TOKENS.card.padding + level * (TOKENS.card.height + TOKENS.card.levelGap);

    if (collapsedNodes.has(resourceId)) {
      positions.set(resourceId, { x: startX, y });
      return TOKENS.card.width;
    }

    const children = resources.filter(r => r.managerResourceId === resourceId);

    if (children.length === 0) {
      positions.set(resourceId, { x: startX, y });
      return TOKENS.card.width;
    }

    let childX = startX;
    children.forEach((child, idx) => {
      if (idx > 0) childX += TOKENS.card.gap;
      const width = positionSubtree(child.id, childX, level + 1);
      childX += width;
    });

    const totalChildWidth = childX - startX;
    const parentX = startX + (totalChildWidth - TOKENS.card.width) / 2;
    positions.set(resourceId, { x: Math.round(parentX / 8) * 8, y });

    return totalChildWidth;
  }

  roots.forEach((root, idx) => {
    if (idx > 0) currentX += TOKENS.card.gap * 2;
    const width = positionSubtree(root.id, currentX, 0);
    currentX += width;
  });

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + TOKENS.card.width);
    maxY = Math.max(maxY, pos.y + TOKENS.card.height);
  });

  return {
    positions,
    bounds: {
      width: maxX - minX + TOKENS.card.padding * 2,
      height: maxY - minY + TOKENS.card.padding * 2,
      minX: minX - TOKENS.card.padding,
      minY: minY - TOKENS.card.padding,
    },
  };
}

// ============================================================================
// Hooks
// ============================================================================

function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const checkDevice = () => {
      const w = window.innerWidth;
      if (w < TOKENS.breakpoints.mobile) setDeviceType("mobile");
      else if (w < TOKENS.breakpoints.tablet) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}

function useKeyboardNavigation(
  resources: Resource[],
  positions: Map<string, NodePosition>,
  selectedId: string | null,
  onSelect: (id: string | null) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onToggleCollapse: (id: string) => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!selectedId) {
        // Select first node if none selected
        if (resources.length > 0 && (e.key === "Tab" || e.key === "ArrowDown")) {
          e.preventDefault();
          onSelect(resources[0].id);
        }
        return;
      }

      const currentPos = positions.get(selectedId);
      if (!currentPos) return;

      switch (e.key) {
        case "ArrowUp": {
          e.preventDefault();
          // Find parent
          const current = resources.find(r => r.id === selectedId);
          if (current?.managerResourceId) {
            onSelect(current.managerResourceId);
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          // Find first child
          const children = resources.filter(r => r.managerResourceId === selectedId);
          if (children.length > 0) {
            onSelect(children[0].id);
          }
          break;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          // Find sibling
          const current = resources.find(r => r.id === selectedId);
          const siblings = resources.filter(r => r.managerResourceId === current?.managerResourceId);
          const currentIdx = siblings.findIndex(s => s.id === selectedId);
          const nextIdx = e.key === "ArrowLeft" ? currentIdx - 1 : currentIdx + 1;
          if (nextIdx >= 0 && nextIdx < siblings.length) {
            onSelect(siblings[nextIdx].id);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          onEdit(selectedId);
          break;
        }
        case "Delete":
        case "Backspace": {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onDelete(selectedId);
          }
          break;
        }
        case " ": {
          e.preventDefault();
          onToggleCollapse(selectedId);
          break;
        }
        case "Escape": {
          e.preventDefault();
          onSelect(null);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resources, positions, selectedId, onSelect, onEdit, onDelete, onToggleCollapse]);
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SubCompanyInfo {
  id: string;
  name: string;
  parentCompany: string;
  indicatorColor: string;
}

// Shared Connection Anchors Component - used by both OrgNode and GroupNode
interface ConnectionAnchorsProps {
  nodeId: string;
  isConnectionSource: boolean;
  onAnchorClick: (nodeId: string, anchor: ConnectionAnchor) => void;
}

const ConnectionAnchors = memo(function ConnectionAnchors({
  nodeId,
  isConnectionSource,
  onAnchorClick,
}: ConnectionAnchorsProps) {
  // Visual circle style (12px visible)
  const anchorVisualStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    borderRadius: "50%",
    backgroundColor: isConnectionSource ? TOKENS.colors.accent.blue : TOKENS.colors.bg.primary,
    border: `2px solid ${TOKENS.colors.accent.blue}`,
    transition: "transform 100ms ease, background-color 100ms ease",
    pointerEvents: "none", // Let parent handle clicks
  };

  // Touch-friendly hit area wrapper (44px minimum touch target)
  const anchorTouchStyle: React.CSSProperties = {
    position: "absolute",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "crosshair",
    zIndex: 10,
  };

  const handleHover = (e: React.MouseEvent<HTMLDivElement>, scale: number) => {
    const visual = e.currentTarget.querySelector("div") as HTMLDivElement;
    if (visual) visual.style.transform = `scale(${scale})`;
  };

  return (
    <>
      {/* Top anchor */}
      <div
        onClick={(e) => { e.stopPropagation(); onAnchorClick(nodeId, "top"); }}
        style={{ ...anchorTouchStyle, top: -22, left: "50%", transform: "translateX(-50%)" }}
        onMouseEnter={(e) => handleHover(e, 1.3)}
        onMouseLeave={(e) => handleHover(e, 1)}
        aria-label="Connect from top"
      >
        <div style={anchorVisualStyle} />
      </div>
      {/* Bottom anchor */}
      <div
        onClick={(e) => { e.stopPropagation(); onAnchorClick(nodeId, "bottom"); }}
        style={{ ...anchorTouchStyle, bottom: -22, left: "50%", transform: "translateX(-50%)" }}
        onMouseEnter={(e) => handleHover(e, 1.3)}
        onMouseLeave={(e) => handleHover(e, 1)}
        aria-label="Connect from bottom"
      >
        <div style={anchorVisualStyle} />
      </div>
      {/* Left anchor */}
      <div
        onClick={(e) => { e.stopPropagation(); onAnchorClick(nodeId, "left"); }}
        style={{ ...anchorTouchStyle, left: -22, top: "50%", transform: "translateY(-50%)" }}
        onMouseEnter={(e) => handleHover(e, 1.3)}
        onMouseLeave={(e) => handleHover(e, 1)}
        aria-label="Connect from left"
      >
        <div style={anchorVisualStyle} />
      </div>
      {/* Right anchor */}
      <div
        onClick={(e) => { e.stopPropagation(); onAnchorClick(nodeId, "right"); }}
        style={{ ...anchorTouchStyle, right: -22, top: "50%", transform: "translateY(-50%)" }}
        onMouseEnter={(e) => handleHover(e, 1.3)}
        onMouseLeave={(e) => handleHover(e, 1)}
        aria-label="Connect from right"
      >
        <div style={anchorVisualStyle} />
      </div>
    </>
  );
});

interface OrgNodeProps {
  resource: Resource;
  position: NodePosition;
  actualPosition: NodePosition;
  isSelected: boolean;
  isMultiSelected: boolean;
  companyLogos: Record<string, string>;
  subCompanies: SubCompanyInfo[];
  deviceType: DeviceType;
  isDragging: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onMultiPositionChange: (updates: Array<{ id: string; x: number; y: number }>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragMove?: (id: string, visualX: number, visualY: number) => void;
  multiSelectedIds: Set<string>;
  getPositionForId: (id: string) => NodePosition | undefined;
  // Connection mode props
  isConnectionMode?: boolean;
  isConnectionSource?: boolean;
  onAnchorClick?: (resourceId: string, anchor: ConnectionAnchor) => void;
}

const OrgNode = memo(function OrgNode({
  resource,
  position,
  actualPosition,
  isSelected,
  isMultiSelected,
  companyLogos,
  subCompanies,
  deviceType,
  isDragging,
  scale,
  onSelect,
  onEdit,
  onDelete,
  onPositionChange,
  onMultiPositionChange,
  onDragStart,
  onDragEnd,
  onDragMove,
  multiSelectedIds,
  getPositionForId,
  isConnectionMode,
  isConnectionSource,
  onAnchorClick,
}: OrgNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const category = RESOURCE_CATEGORIES[resource.category] || RESOURCE_CATEGORIES.other;
  const designation = RESOURCE_DESIGNATIONS[resource.designation] || "Consultant";

  const subCompany = resource.companyName
    ? subCompanies.find(sc => sc.name === resource.companyName)
    : undefined;

  const logo = resource.companyName
    ? (subCompany ? companyLogos[subCompany.parentCompany] : companyLogos[resource.companyName])
    : undefined;

  const indicatorColor = subCompany?.indicatorColor;

  const showActions = (isHovered || isSelected || isMultiSelected) && deviceType !== "mobile" && !isDragging;

  // Determine if this card is part of a multi-selection being dragged
  const isPartOfMultiDrag = isMultiSelected && multiSelectedIds.size > 1;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: actualPosition.x,
      startY: actualPosition.y,
    };
    setDragOffset({ x: 0, y: 0 });
    setIsCardDragging(true);
    onDragStart();
  }, [actualPosition.x, actualPosition.y, onDragStart]);

  useEffect(() => {
    if (!isCardDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = (e.clientX - dragStartRef.current.mouseX) / scale;
      const dy = (e.clientY - dragStartRef.current.mouseY) / scale;

      setDragOffset({ x: dx, y: dy });

      if (onDragMove) {
        const visualX = actualPosition.x + dx;
        const visualY = actualPosition.y + dy;
        onDragMove(resource.id, visualX, visualY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragStartRef.current) {
        const dx = (e.clientX - dragStartRef.current.mouseX) / scale;
        const dy = (e.clientY - dragStartRef.current.mouseY) / scale;

        // If this card is part of a multi-selection, move all selected cards
        if (isPartOfMultiDrag) {
          const updates: Array<{ id: string; x: number; y: number }> = [];
          multiSelectedIds.forEach(id => {
            const pos = getPositionForId(id);
            if (pos) {
              updates.push({
                id,
                x: Math.max(0, pos.x + dx),
                y: Math.max(0, pos.y + dy),
              });
            }
          });
          onMultiPositionChange(updates);
        } else {
          const finalX = Math.max(0, dragStartRef.current.startX + dx);
          const finalY = Math.max(0, dragStartRef.current.startY + dy);
          onPositionChange(resource.id, finalX, finalY);
        }
      }

      dragStartRef.current = null;
      setDragOffset(null);
      setIsCardDragging(false);
      onDragEnd();

      if (onDragMove) {
        onDragMove(resource.id, actualPosition.x, actualPosition.y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCardDragging, resource.id, actualPosition.x, actualPosition.y, onPositionChange, onMultiPositionChange, onDragEnd, onDragMove, scale, isPartOfMultiDrag, multiSelectedIds, getPositionForId]);

  const displayX = dragOffset ? position.x + dragOffset.x : position.x;
  const displayY = dragOffset ? position.y + dragOffset.y : position.y;

  // Visual states: primary selection (blue) vs multi-selection (purple)
  const isAnySelected = isSelected || isMultiSelected;
  const selectionColor = isMultiSelected && !isSelected
    ? TOKENS.colors.accent.purple // Multi-selected but not primary
    : TOKENS.colors.accent.blue;  // Primary selection

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isCardDragging) onSelect(e);
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: displayX,
        top: displayY,
        width: TOKENS.card.width,
        minHeight: TOKENS.card.height,
        cursor: isCardDragging ? "grabbing" : "grab",
        outline: "none",
        zIndex: isCardDragging ? 1000 : isAnySelected ? 100 : 1,
        opacity: isCardDragging ? 0.95 : 1,
        boxShadow: isCardDragging ? "0 12px 40px rgba(0, 0, 0, 0.2)" : undefined,
        transition: isCardDragging ? "none" : "opacity 150ms ease, box-shadow 150ms ease",
        userSelect: "none",
        willChange: isCardDragging ? "left, top" : "auto",
      }}
      tabIndex={0}
      role="listitem"
      aria-selected={isAnySelected}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 16,
          borderRadius: 16,
          backgroundColor: isAnySelected ? TOKENS.colors.bg.glass : TOKENS.colors.bg.primary,
          backdropFilter: isAnySelected ? "blur(20px)" : "none",
          WebkitBackdropFilter: isAnySelected ? "blur(20px)" : "none",
          border: `2px solid ${isAnySelected ? selectionColor : TOKENS.colors.border.default}`,
          boxShadow: isAnySelected
              ? `0 0 0 4px ${isMultiSelected && !isSelected ? "rgba(175, 82, 222, 0.15)" : "rgba(0, 122, 255, 0.15)"}, 0 8px 32px rgba(0, 0, 0, 0.12)`
              : isHovered
                ? "0 8px 24px rgba(0, 0, 0, 0.1)"
                : "0 2px 8px rgba(0, 0, 0, 0.06)",
          transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Header: Logo + Name */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Avatar/Logo with Indicator */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: `${category.color}15`,
                border: `1px solid ${category.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt={resource.companyName || ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: TOKENS.typography.family }}>{category.abbr}</span>
              )}
            </div>
            {/* Sub-company indicator dot */}
            {indicatorColor && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: indicatorColor,
                  border: "2px solid white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
                title={`${resource.companyName} indicator`}
              />
            )}
          </div>

          {/* Name + Designation */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.md,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={resource.name}
            >
              {resource.name}
            </div>
            <div
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.secondary,
                marginTop: 2,
              }}
            >
              {designation}
            </div>
          </div>

        </div>

        {/* Badges: Category + Company */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Category Badge */}
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: `${category.color}12`,
              border: `1px solid ${category.color}25`,
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.xs,
              fontWeight: TOKENS.typography.weight.medium,
              color: category.color,
            }}
          >
            {category.label}
          </div>

          {/* Company Badge */}
          {resource.companyName && (
            <div
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                backgroundColor: TOKENS.colors.bg.secondary,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.secondary,
              }}
            >
              {resource.companyName}
            </div>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex", gap: 6, marginTop: 4 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: TOKENS.colors.bg.secondary,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  cursor: "pointer",
                  minHeight: 36,
                  transition: "background-color 100ms ease",
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: TOKENS.colors.accent.red,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.inverse,
                  cursor: "pointer",
                  minHeight: 36,
                  transition: "background-color 100ms ease",
                }}
              >
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Anchor Points - visible in connection mode */}
        {isConnectionMode && onAnchorClick && (
          <ConnectionAnchors
            nodeId={resource.id}
            isConnectionSource={isConnectionSource ?? false}
            onAnchorClick={onAnchorClick}
          />
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Group Node Component - Renders collapsed groups on canvas
// ============================================================================

interface GroupNodeProps {
  group: ResourceGroup;
  members: Resource[];
  position: NodePosition;
  actualPosition: NodePosition;
  isSelected: boolean;
  companyLogos: Record<string, string>;
  subCompanies: SubCompanyInfo[];
  deviceType: DeviceType;
  isDragging: boolean;
  scale: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPositionChange: (groupId: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  // Connection mode props
  isConnectionMode?: boolean;
  isConnectionSource?: boolean;
  onAnchorClick?: (resourceId: string, anchor: ConnectionAnchor) => void;
}

const GroupNode = memo(function GroupNode({
  group,
  members,
  position,
  actualPosition,
  isSelected,
  companyLogos,
  subCompanies,
  deviceType,
  isDragging,
  scale,
  onSelect,
  onEdit,
  onDelete,
  onPositionChange,
  onDragStart,
  onDragEnd,
  isConnectionMode,
  isConnectionSource,
  onAnchorClick,
}: GroupNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  const leadResource = group.leadResourceId
    ? members.find(m => m.id === group.leadResourceId)
    : null;
  const showActions = (isHovered || isSelected) && deviceType !== "mobile" && !isDragging;

  // Get unique categories in the group for badges
  const uniqueCategories = [...new Set(members.map(m => m.category))].slice(0, 2);
  // Get unique companies
  const uniqueCompanies = [...new Set(members.map(m => m.companyName).filter(Boolean))].slice(0, 1);

  // Mouse handlers for free-form dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: actualPosition.x,
      posY: actualPosition.y,
    };
    setIsCardDragging(true);
    onDragStart();
  }, [actualPosition.x, actualPosition.y, onDragStart]);

  useEffect(() => {
    if (!isCardDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;

      const newX = Math.max(0, dragStartRef.current.posX + dx);
      const newY = Math.max(0, dragStartRef.current.posY + dy);

      onPositionChange(group.id, newX, newY);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsCardDragging(false);
      onDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isCardDragging, group.id, onPositionChange, onDragEnd, scale]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isCardDragging) onSelect();
      }}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: TOKENS.card.width,
        minHeight: TOKENS.card.height,
        cursor: isCardDragging ? "grabbing" : "grab",
        outline: "none",
        zIndex: isCardDragging ? 1000 : isSelected ? 100 : 1,
        opacity: isCardDragging ? 0.9 : 1,
        transform: isCardDragging ? "scale(1.02)" : "scale(1)",
        transition: isCardDragging ? "none" : "opacity 150ms ease, transform 150ms ease",
        userSelect: "none",
      }}
      tabIndex={0}
      role="listitem"
      aria-selected={isSelected}
    >
      {/* Card - Styled like resource cards */}
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 16,
          borderRadius: 16,
          backgroundColor: isSelected ? TOKENS.colors.bg.glass : TOKENS.colors.bg.primary,
          backdropFilter: isSelected ? "blur(20px)" : "none",
          WebkitBackdropFilter: isSelected ? "blur(20px)" : "none",
          border: `2px solid ${isSelected ? TOKENS.colors.accent.purple : TOKENS.colors.border.default}`,
          boxShadow: isSelected
            ? `0 0 0 4px rgba(175, 82, 222, 0.15), 0 8px 32px rgba(0, 0, 0, 0.12)`
            : isHovered
              ? "0 8px 24px rgba(0, 0, 0, 0.1)"
              : "0 2px 8px rgba(0, 0, 0, 0.06)",
          transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Header: Avatar + Name (matching resource card layout) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Group Avatar - purple themed */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: `${TOKENS.colors.accent.purple}15`,
              border: `1px solid ${TOKENS.colors.accent.purple}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Group icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 20c0-3.3-2.7-6-6-6s-6 2.7-6 6M11 10a4 4 0 100-8 4 4 0 000 8zM21 20c0-2.5-1.5-4.6-3.6-5.5M16.5 3.5a4 4 0 010 7"
                stroke={TOKENS.colors.accent.purple}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Member count badge */}
            <div
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: TOKENS.colors.accent.purple,
                border: `2px solid ${TOKENS.colors.bg.primary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TOKENS.typography.family,
                fontSize: 9,
                fontWeight: TOKENS.typography.weight.bold,
                color: TOKENS.colors.text.inverse,
              }}
            >
              {members.length}
            </div>
          </div>

          {/* Name + Description */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.md,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={group.name}
            >
              {group.name}
            </div>
            <div
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.secondary,
                marginTop: 2,
              }}
            >
              {leadResource ? `Lead: ${leadResource.name}` : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        {/* Badges: Group Type + Categories (matching resource card badges) */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {/* Group Badge */}
          <div
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              backgroundColor: `${TOKENS.colors.accent.purple}12`,
              border: `1px solid ${TOKENS.colors.accent.purple}25`,
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.xs,
              fontWeight: TOKENS.typography.weight.medium,
              color: TOKENS.colors.accent.purple,
            }}
          >
            Group
          </div>

          {/* Category Badges */}
          {uniqueCategories.map(cat => {
            const category = RESOURCE_CATEGORIES[cat] || RESOURCE_CATEGORIES.other;
            return (
              <div
                key={cat}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  backgroundColor: `${category.color}12`,
                  border: `1px solid ${category.color}25`,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.medium,
                  color: category.color,
                }}
              >
                {category.label}
              </div>
            );
          })}

          {/* Company Badge (if single company dominates) */}
          {uniqueCompanies.length === 1 && (
            <div
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                backgroundColor: TOKENS.colors.bg.secondary,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.secondary,
              }}
            >
              {uniqueCompanies[0]}
            </div>
          )}
        </div>

        {/* Member Avatars Preview (stacked) - show company logos when available */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          {members.slice(0, 5).map((member, idx) => {
            // Check if member's company is a sub-company
            const memberSubCompany = member.companyName
              ? subCompanies.find(sc => sc.name === member.companyName)
              : undefined;
            // If sub-company, use parent's logo
            const memberLogo = member.companyName
              ? (memberSubCompany ? companyLogos[memberSubCompany.parentCompany] : companyLogos[member.companyName])
              : undefined;
            const memberIndicator = memberSubCompany?.indicatorColor;

            return (
              <div
                key={member.id}
                style={{
                  position: "relative",
                  width: 24,
                  height: 24,
                  marginLeft: idx > 0 ? -6 : 0,
                  zIndex: 5 - idx,
                }}
                title={member.name}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: memberLogo ? TOKENS.colors.bg.primary : (RESOURCE_CATEGORIES[member.category]?.color || TOKENS.colors.text.tertiary),
                    border: `2px solid ${TOKENS.colors.bg.primary}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: TOKENS.typography.family,
                    fontSize: 9,
                    fontWeight: TOKENS.typography.weight.bold,
                    color: TOKENS.colors.text.inverse,
                    overflow: "hidden",
                  }}
                >
                  {memberLogo ? (
                    <img
                      src={memberLogo}
                      alt={member.companyName || ""}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                {memberIndicator && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: memberIndicator,
                      border: "1px solid white",
                    }}
                  />
                )}
              </div>
            );
          })}
          {members.length > 5 && (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: TOKENS.colors.bg.secondary,
                border: `2px solid ${TOKENS.colors.bg.primary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TOKENS.typography.family,
                fontSize: 9,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.secondary,
                marginLeft: -6,
              }}
            >
              +{members.length - 5}
            </div>
          )}
        </div>

        {/* Hover Actions (matching resource card actions) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              style={{ display: "flex", gap: 6, marginTop: 4 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: TOKENS.colors.bg.secondary,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  cursor: "pointer",
                  minHeight: 36,
                  transition: "background-color 100ms ease",
                }}
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: TOKENS.colors.accent.red,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.inverse,
                  cursor: "pointer",
                  minHeight: 36,
                  transition: "background-color 100ms ease",
                }}
              >
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connection Anchor Points - visible in connection mode */}
      {isConnectionMode && onAnchorClick && (
        <ConnectionAnchors
          nodeId={group.id}
          isConnectionSource={isConnectionSource ?? false}
          onAnchorClick={onAnchorClick}
        />
      )}
    </div>
  );
});

// Import OrgChartCardPosition type
import type { OrgChartCardPosition } from "@/types/gantt-tool";

// Minimap Component
const Minimap = memo(function Minimap({
  bounds,
  positions,
  viewportRect,
  onNavigate,
}: {
  bounds: LayoutBounds;
  positions: Map<string, NodePosition>;
  viewportRect: { x: number; y: number; width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const scale = 0.08;
  const minimapWidth = Math.min(200, bounds.width * scale);
  const minimapHeight = Math.min(150, bounds.height * scale);

  const handleClick = (e: React.MouseEvent) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    onNavigate(x + bounds.minX, y + bounds.minY);
  };

  if (bounds.width < 1000 && bounds.height < 800) return null;

  return (
    <div
      ref={minimapRef}
      onClick={handleClick}
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: minimapWidth,
        height: minimapHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 8,
        border: `1px solid ${TOKENS.colors.border.default}`,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        cursor: "pointer",
        zIndex: 100,
      }}
    >
      {/* Nodes */}
      {Array.from(positions.entries()).map(([id, pos]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: (pos.x - bounds.minX) * scale,
            top: (pos.y - bounds.minY) * scale,
            width: TOKENS.card.width * scale,
            height: TOKENS.card.height * scale,
            backgroundColor: TOKENS.colors.accent.blue,
            borderRadius: 2,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Viewport indicator */}
      <div
        style={{
          position: "absolute",
          left: (viewportRect.x - bounds.minX) * scale,
          top: (viewportRect.y - bounds.minY) * scale,
          width: viewportRect.width * scale,
          height: viewportRect.height * scale,
          border: `2px solid ${TOKENS.colors.accent.blue}`,
          borderRadius: 2,
          backgroundColor: "rgba(0, 122, 255, 0.1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
});

// Empty State
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        maxWidth: 400,
        padding: 40,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: TOKENS.colors.bg.secondary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4.5v15m7.5-7.5h-15"
            stroke={TOKENS.colors.text.tertiary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3
        style={{
          fontFamily: TOKENS.typography.family,
          fontSize: TOKENS.typography.size.xl,
          fontWeight: TOKENS.typography.weight.semibold,
          color: TOKENS.colors.text.primary,
          margin: "0 0 8px",
        }}
      >
        No Team Members
      </h3>
      <p
        style={{
          fontFamily: TOKENS.typography.family,
          fontSize: TOKENS.typography.size.md,
          color: TOKENS.colors.text.secondary,
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}
      >
        Add resources to build your organization chart
      </p>
      <button
        onClick={onAdd}
        style={{
          padding: "14px 28px",
          borderRadius: 12,
          border: "none",
          backgroundColor: TOKENS.colors.accent.blue,
          fontFamily: TOKENS.typography.family,
          fontSize: TOKENS.typography.size.md,
          fontWeight: TOKENS.typography.weight.semibold,
          color: TOKENS.colors.text.inverse,
          cursor: "pointer",
          transition: "transform 100ms ease, box-shadow 100ms ease",
          boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
        }}
      >
        Add Resource
      </button>
    </div>
  );
}

// ============================================================================
// Bulk Edit Modal Component
// ============================================================================

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResourceIds: Set<string>;
  resources: Resource[];
  companyLogos: Record<string, string>;
  subCompanies: SubCompanyInfo[];
  onBulkUpdate: (updates: Partial<Resource>) => Promise<void>;
  onOpenLogoLibrary?: () => void;
}

interface BulkEditFormData {
  category?: ResourceCategory | "";
  designation?: ResourceDesignation | "";
  companyName?: string | "";
  managerResourceId?: string | null | "";
  location?: string;
  assignmentLevel?: "phase" | "task" | "both" | "";
  isBillable?: boolean | null;
}

function BulkEditModal({
  isOpen,
  onClose,
  selectedResourceIds,
  resources,
  companyLogos,
  subCompanies,
  onBulkUpdate,
  onOpenLogoLibrary,
}: BulkEditModalProps) {
  const [formData, setFormData] = useState<BulkEditFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportsToSearch, setReportsToSearch] = useState("");
  const [showReportsToDropdown, setShowReportsToDropdown] = useState(false);
  const reportsToRef = useRef<HTMLDivElement>(null);

  // Get the selected resources for display
  const selectedResources = useMemo(
    () => resources.filter(r => selectedResourceIds.has(r.id)),
    [resources, selectedResourceIds]
  );

  // Company names from uploaded logos + sub-companies
  const parentCompanyNames = Object.keys(companyLogos);
  const subCompanyNames = subCompanies.map(sc => sc.name);
  const allCompanyNames = [...parentCompanyNames, ...subCompanyNames];
  const hasUploadedLogos = allCompanyNames.length > 0;

  // Potential managers (excluding selected resources to avoid circular reference)
  const potentialManagers = useMemo(
    () => resources.filter(r => !selectedResourceIds.has(r.id)),
    [resources, selectedResourceIds]
  );

  const filteredManagers = useMemo(() => {
    if (!reportsToSearch) return potentialManagers;
    const search = reportsToSearch.toLowerCase();
    return potentialManagers.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.category.toLowerCase().includes(search)
    );
  }, [potentialManagers, reportsToSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reportsToRef.current && !reportsToRef.current.contains(e.target as Node)) {
        setShowReportsToDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setReportsToSearch("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Build updates object with only fields that have been changed
    const updates: Partial<Resource> = {};

    if (formData.category) {
      updates.category = formData.category as ResourceCategory;
    }
    if (formData.designation) {
      updates.designation = formData.designation as ResourceDesignation;
    }
    if (formData.companyName) {
      updates.companyName = formData.companyName;
    }
    if (formData.managerResourceId !== undefined && formData.managerResourceId !== "") {
      updates.managerResourceId = formData.managerResourceId || null;
    }
    if (formData.location) {
      updates.location = formData.location;
    }
    if (formData.assignmentLevel) {
      updates.assignmentLevel = formData.assignmentLevel as "phase" | "task" | "both";
    }
    if (formData.isBillable !== null && formData.isBillable !== undefined) {
      updates.isBillable = formData.isBillable;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onBulkUpdate(updates);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedManagerName = formData.managerResourceId
    ? resources.find(r => r.id === formData.managerResourceId)?.name || "Unknown"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: TOKENS.colors.bg.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={TOKENS.spring.default}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          backgroundColor: TOKENS.colors.bg.primary,
          borderRadius: 16,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.lg,
                fontWeight: TOKENS.typography.weight.bold,
                color: TOKENS.colors.text.primary,
                margin: 0,
              }}
            >
              Bulk Edit Resources
            </h2>
            <p
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                color: TOKENS.colors.text.secondary,
                margin: "4px 0 0",
              }}
            >
              {selectedResourceIds.size} resources selected
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "none",
              backgroundColor: TOKENS.colors.bg.secondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Selected Resources Preview */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.secondary,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Selected Resources
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: 12,
                backgroundColor: TOKENS.colors.bg.secondary,
                borderRadius: 8,
                maxHeight: 80,
                overflow: "auto",
              }}
            >
              {selectedResources.slice(0, 10).map(r => (
                <span
                  key={r.id}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    backgroundColor: TOKENS.colors.bg.primary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    color: TOKENS.colors.text.primary,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                  }}
                >
                  {r.name}
                </span>
              ))}
              {selectedResources.length > 10 && (
                <span
                  style={{
                    padding: "4px 8px",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    color: TOKENS.colors.text.secondary,
                  }}
                >
                  +{selectedResources.length - 10} more
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.xs,
              color: TOKENS.colors.text.tertiary,
              marginBottom: 16,
              padding: "8px 12px",
              backgroundColor: "rgba(0, 122, 255, 0.08)",
              borderRadius: 6,
              borderLeft: `3px solid ${TOKENS.colors.accent.blue}`,
            }}
          >
            Only fields you change will be applied. Leave fields blank to keep current values.
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Category */}
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  marginBottom: 6,
                }}
              >
                Category
              </label>
              <select
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory | "" })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${TOKENS.colors.border.default}`,
                  backgroundColor: TOKENS.colors.bg.primary,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  color: TOKENS.colors.text.primary,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">-- No change --</option>
                {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, abbr }]) => (
                  <option key={key} value={key}>
                    [{abbr}] {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  marginBottom: 6,
                }}
              >
                Designation
              </label>
              <select
                value={formData.designation || ""}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value as ResourceDesignation | "" })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${TOKENS.colors.border.default}`,
                  backgroundColor: TOKENS.colors.bg.primary,
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  color: TOKENS.colors.text.primary,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">-- No change --</option>
                {Object.entries(RESOURCE_DESIGNATIONS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company */}
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  marginBottom: 6,
                }}
              >
                Company
              </label>
              {!hasUploadedLogos ? (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: `1px dashed ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.secondary,
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      color: TOKENS.colors.text.secondary,
                      margin: "0 0 8px",
                    }}
                  >
                    No companies configured yet
                  </p>
                  {onOpenLogoLibrary && (
                    <button
                      onClick={onOpenLogoLibrary}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: TOKENS.colors.accent.blue,
                        color: TOKENS.colors.text.inverse,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.xs,
                        fontWeight: TOKENS.typography.weight.semibold,
                        cursor: "pointer",
                      }}
                    >
                      Upload Company Logo
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.primary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    color: TOKENS.colors.text.primary,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">-- No change --</option>
                  {parentCompanyNames.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {subCompanies.map(sc => (
                    <option key={sc.id} value={sc.name}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Reports To - Searchable Dropdown */}
            <div ref={reportsToRef}>
              <label
                style={{
                  display: "block",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                  marginBottom: 6,
                }}
              >
                Reports To
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={formData.managerResourceId === null ? "No manager (root)" : selectedManagerName || "Search to select manager..."}
                  value={reportsToSearch}
                  onChange={(e) => {
                    setReportsToSearch(e.target.value);
                    setShowReportsToDropdown(true);
                  }}
                  onFocus={() => setShowReportsToDropdown(true)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.primary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    color: TOKENS.colors.text.primary,
                    outline: "none",
                  }}
                />
                {showReportsToDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      maxHeight: 200,
                      overflow: "auto",
                      backgroundColor: TOKENS.colors.bg.primary,
                      borderRadius: 8,
                      border: `1px solid ${TOKENS.colors.border.default}`,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      zIndex: 100,
                    }}
                  >
                    {/* No change option */}
                    <button
                      onClick={() => {
                        setFormData({ ...formData, managerResourceId: "" });
                        setReportsToSearch("");
                        setShowReportsToDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                        backgroundColor: formData.managerResourceId === "" ? "rgba(0, 122, 255, 0.08)" : "transparent",
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: TOKENS.colors.text.secondary,
                        cursor: "pointer",
                        textAlign: "left",
                        fontStyle: "italic",
                      }}
                    >
                      -- No change --
                    </button>
                    {/* Make root option */}
                    <button
                      onClick={() => {
                        setFormData({ ...formData, managerResourceId: null });
                        setReportsToSearch("");
                        setShowReportsToDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                        backgroundColor: formData.managerResourceId === null ? "rgba(0, 122, 255, 0.08)" : "transparent",
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: TOKENS.colors.text.primary,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      🌳 No Manager (Make Root)
                    </button>
                    {filteredManagers.map(r => {
                      const cat = RESOURCE_CATEGORIES[r.category] || RESOURCE_CATEGORIES.other;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setFormData({ ...formData, managerResourceId: r.id });
                            setReportsToSearch("");
                            setShowReportsToDropdown(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "none",
                            borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                            backgroundColor: formData.managerResourceId === r.id ? "rgba(0, 122, 255, 0.08)" : "transparent",
                            fontFamily: TOKENS.typography.family,
                            fontSize: TOKENS.typography.size.sm,
                            color: TOKENS.colors.text.primary,
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: cat.color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ flex: 1 }}>{r.name}</span>
                          <span
                            style={{
                              fontSize: TOKENS.typography.size.xs,
                              color: TOKENS.colors.text.tertiary,
                            }}
                          >
                            {RESOURCE_DESIGNATIONS[r.designation] || r.designation}
                          </span>
                        </button>
                      );
                    })}
                    {filteredManagers.length === 0 && reportsToSearch && (
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.sm,
                          color: TOKENS.colors.text.tertiary,
                        }}
                      >
                        No matching resources
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options Section */}
            <div
              style={{
                borderTop: `1px solid ${TOKENS.colors.border.default}`,
                paddingTop: 16,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.secondary,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Advanced Options
              </div>

              {/* Location */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    fontWeight: TOKENS.typography.weight.semibold,
                    color: TOKENS.colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Leave blank for no change"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.primary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    color: TOKENS.colors.text.primary,
                    outline: "none",
                  }}
                />
              </div>

              {/* Assignment Level */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    fontWeight: TOKENS.typography.weight.semibold,
                    color: TOKENS.colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Assignment Level
                </label>
                <select
                  value={formData.assignmentLevel || ""}
                  onChange={(e) => setFormData({ ...formData, assignmentLevel: e.target.value as "phase" | "task" | "both" | "" })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.primary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    color: TOKENS.colors.text.primary,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="">-- No change --</option>
                  <option value="phase">Phase Level Only</option>
                  <option value="task">Task Level Only</option>
                  <option value="both">Phase & Task Levels</option>
                </select>
              </div>

              {/* Billable Toggle */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    fontWeight: TOKENS.typography.weight.semibold,
                    color: TOKENS.colors.text.primary,
                    marginBottom: 6,
                  }}
                >
                  Billable Status
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setFormData({ ...formData, isBillable: null })}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${formData.isBillable === null || formData.isBillable === undefined ? TOKENS.colors.accent.blue : TOKENS.colors.border.default}`,
                      backgroundColor: formData.isBillable === null || formData.isBillable === undefined ? "rgba(0, 122, 255, 0.08)" : "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: TOKENS.typography.weight.medium,
                      color: TOKENS.colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    No change
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isBillable: true })}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${formData.isBillable === true ? TOKENS.colors.accent.green : TOKENS.colors.border.default}`,
                      backgroundColor: formData.isBillable === true ? "rgba(52, 199, 89, 0.1)" : "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: TOKENS.typography.weight.medium,
                      color: formData.isBillable === true ? TOKENS.colors.accent.green : TOKENS.colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    Billable
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isBillable: false })}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${formData.isBillable === false ? TOKENS.colors.text.secondary : TOKENS.colors.border.default}`,
                      backgroundColor: formData.isBillable === false ? TOKENS.colors.bg.secondary : "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: TOKENS.typography.weight.medium,
                      color: TOKENS.colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    Non-billable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: "transparent",
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: TOKENS.colors.text.primary,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: TOKENS.colors.accent.blue,
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: TOKENS.colors.text.inverse,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isSubmitting && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="20 10" />
              </svg>
            )}
            Apply to {selectedResourceIds.size} Resources
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Group Edit Modal Component
// ============================================================================

interface GroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ResourceGroup | null;
  resources: Resource[];
  allGroups: ResourceGroup[];
  onSave: (group: ResourceGroup) => Promise<void>;
  onDelete?: (groupId: string) => Promise<void>;
}

function GroupEditModal({
  isOpen,
  onClose,
  group,
  resources,
  allGroups,
  onSave,
  onDelete,
}: GroupEditModalProps) {
  const [name, setName] = useState("");
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(new Set());
  const [leadResourceId, setLeadResourceId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<"expanded" | "collapsed" | "leads-only">("expanded");
  const [visibleResourceIds, setVisibleResourceIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");

  const isEditMode = group !== null;

  useEffect(() => {
    if (isOpen) {
      if (group) {
        setName(group.name);
        setSelectedResourceIds(new Set(group.resourceIds));
        setLeadResourceId(group.leadResourceId || null);
        setDisplayMode(group.displayMode);
        setVisibleResourceIds(new Set(group.visibleResourceIds || group.resourceIds));
      } else {
        setName("");
        setSelectedResourceIds(new Set());
        setLeadResourceId(null);
        setDisplayMode("expanded");
        setVisibleResourceIds(new Set());
      }
      setResourceSearch("");
    }
  }, [isOpen, group]);

  // Build a map of resourceId -> group name for resources already in OTHER groups
  // When editing an existing group, exclude that group from the lookup
  const resourceToGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    const currentGroupId = group?.id;

    allGroups.forEach(g => {
      // Skip the current group being edited
      if (g.id === currentGroupId) return;

      g.resourceIds.forEach(resourceId => {
        map.set(resourceId, { groupId: g.id, groupName: g.name });
      });
    });

    return map;
  }, [allGroups, group?.id]);

  const filteredResources = useMemo(() => {
    if (!resourceSearch) return resources;
    const search = resourceSearch.toLowerCase();
    return resources.filter(r =>
      r.name.toLowerCase().includes(search) ||
      r.category.toLowerCase().includes(search)
    );
  }, [resources, resourceSearch]);

  const handleToggleResource = (id: string) => {
    setSelectedResourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (leadResourceId === id) setLeadResourceId(null);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleVisible = (id: string) => {
    setVisibleResourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || selectedResourceIds.size === 0) return;

    setIsSubmitting(true);
    try {
      const groupData: ResourceGroup = {
        id: group?.id || `group-${Date.now()}`,
        name: name.trim(),
        resourceIds: Array.from(selectedResourceIds),
        leadResourceId: leadResourceId,
        displayMode,
        visibleResourceIds: displayMode === "leads-only" ? Array.from(visibleResourceIds) : undefined,
        createdAt: group?.createdAt || new Date().toISOString(),
      };
      await onSave(groupData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!group || !onDelete) return;
    if (!window.confirm(`Delete group "${group.name}"? Resources will not be deleted.`)) return;

    setIsSubmitting(true);
    try {
      await onDelete(group.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedResources = resources.filter(r => selectedResourceIds.has(r.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: TOKENS.colors.bg.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={TOKENS.spring.default}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          backgroundColor: TOKENS.colors.bg.primary,
          borderRadius: 16,
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.lg,
              fontWeight: TOKENS.typography.weight.bold,
              color: TOKENS.colors.text.primary,
              margin: 0,
            }}
          >
            {isEditMode ? "Edit Group" : "Create Group"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "none",
              backgroundColor: TOKENS.colors.bg.secondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Group Name */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                marginBottom: 6,
              }}
            >
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technical Team, SAP Functional"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: TOKENS.colors.bg.primary,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                color: TOKENS.colors.text.primary,
                outline: "none",
              }}
            />
          </div>

          {/* Display Mode */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                marginBottom: 6,
              }}
            >
              Display Mode
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["expanded", "collapsed", "leads-only"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDisplayMode(mode)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${displayMode === mode ? TOKENS.colors.accent.blue : TOKENS.colors.border.default}`,
                    backgroundColor: displayMode === mode ? "rgba(0, 122, 255, 0.08)" : "transparent",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    fontWeight: TOKENS.typography.weight.medium,
                    color: displayMode === mode ? TOKENS.colors.accent.blue : TOKENS.colors.text.primary,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {mode === "expanded" ? "Show All" : mode === "collapsed" ? "Collapsed" : "Leads Only"}
                </button>
              ))}
            </div>
            <p
              style={{
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.xs,
                color: TOKENS.colors.text.tertiary,
                marginTop: 6,
              }}
            >
              {displayMode === "expanded" && "All members shown individually in the canvas"}
              {displayMode === "collapsed" && "Group shown as single card with member count"}
              {displayMode === "leads-only" && "Only selected members shown, others counted"}
            </p>
          </div>

          {/* Member Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label
                style={{
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.primary,
                }}
              >
                Members ({selectedResourceIds.size} selected)
                {resourceToGroupMap.size > 0 && (
                  <span
                    style={{
                      fontWeight: TOKENS.typography.weight.regular,
                      color: TOKENS.colors.text.tertiary,
                      marginLeft: 4,
                    }}
                  >
                    ({resourceToGroupMap.size} in other groups)
                  </span>
                )}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    // Only select resources that are not in other groups
                    const availableIds = resources
                      .filter(r => !resourceToGroupMap.has(r.id))
                      .map(r => r.id);
                    setSelectedResourceIds(new Set(availableIds));
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: "transparent",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    fontWeight: TOKENS.typography.weight.medium,
                    color: TOKENS.colors.text.secondary,
                    cursor: "pointer",
                  }}
                >
                  Select Available
                </button>
                <button
                  onClick={() => {
                    setSelectedResourceIds(new Set());
                    setLeadResourceId(null);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: "transparent",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    fontWeight: TOKENS.typography.weight.medium,
                    color: TOKENS.colors.text.secondary,
                    cursor: "pointer",
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <input
              type="text"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder="Search resources..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: TOKENS.colors.bg.secondary,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                color: TOKENS.colors.text.primary,
                outline: "none",
                marginBottom: 8,
              }}
            />

            <div
              style={{
                maxHeight: 320,
                overflow: "auto",
                border: `1px solid ${TOKENS.colors.border.default}`,
                borderRadius: 8,
              }}
            >
              {filteredResources.map(resource => {
                const category = RESOURCE_CATEGORIES[resource.category] || RESOURCE_CATEGORIES.other;
                const isSelected = selectedResourceIds.has(resource.id);
                const isVisible = visibleResourceIds.has(resource.id);
                const isLead = leadResourceId === resource.id;
                const existingGroup = resourceToGroupMap.get(resource.id);
                const isUnavailable = !!existingGroup;

                return (
                  <div
                    key={resource.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                      backgroundColor: isUnavailable
                        ? TOKENS.colors.bg.secondary
                        : isSelected
                        ? "rgba(0, 122, 255, 0.04)"
                        : "transparent",
                      opacity: isUnavailable ? 0.6 : 1,
                      cursor: isUnavailable ? "not-allowed" : "default",
                    }}
                    title={isUnavailable ? `Already assigned to "${existingGroup.groupName}"` : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isUnavailable && handleToggleResource(resource.id)}
                      disabled={isUnavailable}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: TOKENS.colors.accent.blue,
                        cursor: isUnavailable ? "not-allowed" : "pointer",
                      }}
                    />
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: category.color,
                        flexShrink: 0,
                        opacity: isUnavailable ? 0.5 : 1,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: isUnavailable ? TOKENS.colors.text.tertiary : TOKENS.colors.text.primary,
                      }}
                    >
                      {resource.name}
                    </span>

                    {/* Show which group this resource is already assigned to */}
                    {isUnavailable && (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: "rgba(142, 142, 147, 0.12)",
                          fontFamily: TOKENS.typography.family,
                          fontSize: 10,
                          fontWeight: TOKENS.typography.weight.medium,
                          color: TOKENS.colors.text.tertiary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 120,
                        }}
                        title={existingGroup.groupName}
                      >
                        {existingGroup.groupName}
                      </span>
                    )}

                    {isSelected && !isUnavailable && (
                      <>
                        {/* Lead toggle */}
                        <button
                          onClick={() => setLeadResourceId(isLead ? null : resource.id)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            border: `1px solid ${isLead ? TOKENS.colors.accent.green : TOKENS.colors.border.default}`,
                            backgroundColor: isLead ? "rgba(52, 199, 89, 0.1)" : "transparent",
                            fontFamily: TOKENS.typography.family,
                            fontSize: 10,
                            fontWeight: TOKENS.typography.weight.semibold,
                            color: isLead ? TOKENS.colors.accent.green : TOKENS.colors.text.tertiary,
                            cursor: "pointer",
                          }}
                        >
                          Lead
                        </button>

                        {/* Visible toggle (only for leads-only mode) */}
                        {displayMode === "leads-only" && (
                          <button
                            onClick={() => handleToggleVisible(resource.id)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 4,
                              border: `1px solid ${isVisible ? TOKENS.colors.accent.blue : TOKENS.colors.border.default}`,
                              backgroundColor: isVisible ? "rgba(0, 122, 255, 0.1)" : "transparent",
                              fontFamily: TOKENS.typography.family,
                              fontSize: 10,
                              fontWeight: TOKENS.typography.weight.semibold,
                              color: isVisible ? TOKENS.colors.accent.blue : TOKENS.colors.text.tertiary,
                              cursor: "pointer",
                            }}
                          >
                            Show
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {filteredResources.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    color: TOKENS.colors.text.tertiary,
                  }}
                >
                  No resources found
                </div>
              )}
            </div>
          </div>

          {/* Selected Members Preview */}
          {selectedResources.length > 0 && (
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.xs,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.text.secondary,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Selected Members
              </label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: 12,
                  backgroundColor: TOKENS.colors.bg.secondary,
                  borderRadius: 8,
                }}
              >
                {selectedResources.map(r => (
                  <span
                    key={r.id}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      backgroundColor: TOKENS.colors.bg.primary,
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.xs,
                      color: TOKENS.colors.text.primary,
                      border: `1px solid ${leadResourceId === r.id ? TOKENS.colors.accent.green : TOKENS.colors.border.default}`,
                    }}
                  >
                    {r.name}
                    {leadResourceId === r.id && (
                      <span style={{ marginLeft: 4, color: TOKENS.colors.accent.green, fontWeight: 600 }}>
                        (Lead)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            {isEditMode && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `1px solid ${TOKENS.colors.accent.red}`,
                  backgroundColor: "transparent",
                  fontFamily: TOKENS.typography.family,
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.semibold,
                  color: TOKENS.colors.accent.red,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                Delete Group
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: "transparent",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim() || selectedResourceIds.size === 0}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: TOKENS.colors.accent.blue,
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.inverse,
                cursor: isSubmitting || !name.trim() || selectedResourceIds.size === 0 ? "not-allowed" : "pointer",
                opacity: isSubmitting || !name.trim() || selectedResourceIds.size === 0 ? 0.5 : 1,
              }}
            >
              {isEditMode ? "Save Changes" : "Create Group"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface OrgChartProProps {
  onClose: () => void;
  project?: GanttProject | null;
  isFullPage?: boolean;
  onOpenLogoLibrary?: () => void;
  /** Controls visibility of Advanced Options in resource modals - requires financial access */
  hasFinancialAccess?: boolean;
}

export function OrgChartPro({ onClose, project, isFullPage = false, onOpenLogoLibrary, hasFinancialAccess = false }: OrgChartProProps) {
  const deviceType = useDeviceType();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentProject: storeProject,
    updateResource,
    deleteResource,
    addResource,
    addResourceGroup,
    updateResourceGroup,
    deleteResourceGroup,
    getResourceGroups,
  } = useGanttToolStoreV2();

  const currentProject = project ?? storeProject;
  const resources = currentProject?.resources || [];
  // Only use logos that are uploaded in the project's Logo Library
  const companyLogos = currentProject?.orgChartPro?.companyLogos || {};
  const subCompanies = currentProject?.orgChartPro?.subCompanies || [];
  // Resource groups for canvas display
  const groups = currentProject?.orgChartPro?.groups || [];

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModalMode, setEditModalMode] = useState<"add" | "edit">("add");
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [defaultManagerId, setDefaultManagerId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showResourcePanel, setShowResourcePanel] = useState(true); // Resource list panel
  const [resourceSearch, setResourceSearch] = useState("");
  // Multi-select state for bulk edit
  const [checkedResourceIds, setCheckedResourceIds] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  // Group management state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [listViewMode, setListViewMode] = useState<"resources" | "groups">("resources");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false); // Mobile resource list drawer

  // Free-form canvas state
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [dragPositions, setDragPositions] = useState<Map<string, NodePosition>>(new Map());
  // Multi-select state for canvas operations (Ctrl+Click)
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());

  // Connection line drawing state
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ resourceId: string; anchor: ConnectionAnchor } | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [connectionLabel, setConnectionLabel] = useState("");

  // Get stored card positions, group positions, and connections from project
  const storedCardPositions = currentProject?.orgChartPro?.cardPositions || [];
  const storedGroupPositions = currentProject?.orgChartPro?.groupCardPositions || [];
  const storedConnections: OrgChartConnection[] = currentProject?.orgChartPro?.connections || [];

  // Zoom/Pan - start with reasonable defaults
  // Min zoom 0.4 ensures text stays readable even with 40+ resources
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 2;
  const scale = useMotionValue(0.8);
  const x = useMotionValue(100);
  const y = useMotionValue(50);
  // Faster, snappier springs for more responsive feel
  const smoothScale = useSpring(scale, { stiffness: 300, damping: 30 });
  const smoothX = useSpring(x, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(y, { stiffness: 300, damping: 30 });

  // Free-form positions: use stored positions or calculate default grid layout
  const positions = useMemo(() => {
    const posMap = new Map<string, NodePosition>();

    // First, apply stored positions
    storedCardPositions.forEach(stored => {
      posMap.set(stored.resourceId, { x: stored.x, y: stored.y });
    });

    // For resources without stored positions, calculate grid positions
    let gridIndex = 0;
    const cols = 4;
    const startX = TOKENS.card.padding;
    const startY = TOKENS.card.padding;

    resources.forEach(resource => {
      if (!posMap.has(resource.id)) {
        const col = gridIndex % cols;
        const row = Math.floor(gridIndex / cols);
        posMap.set(resource.id, {
          x: startX + col * (TOKENS.card.width + TOKENS.card.gap),
          y: startY + row * (TOKENS.card.height + TOKENS.card.levelGap),
        });
        gridIndex++;
      }
    });

    return posMap;
  }, [resources, storedCardPositions]);

  // Live positions for line rendering (merges stored + drag positions)
  const livePositions = useMemo(() => {
    const merged = new Map(positions);
    dragPositions.forEach((pos, id) => {
      merged.set(id, pos);
    });
    return merged;
  }, [positions, dragPositions]);

  // Calculate bounds from actual positions
  const bounds = useMemo(() => {
    if (positions.size === 0) {
      return { width: 800, height: 600, minX: 0, minY: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + TOKENS.card.width);
      maxY = Math.max(maxY, pos.y + TOKENS.card.height);
    });

    return {
      width: maxX - minX + TOKENS.card.padding * 2,
      height: maxY - minY + TOKENS.card.padding * 2,
      minX: minX - TOKENS.card.padding,
      minY: minY - TOKENS.card.padding,
    };
  }, [positions]);

  // Compute which resources are hidden due to collapsed groups
  // Also compute bounding boxes for expanded groups to render visual boundaries
  const { hiddenResourceIds, collapsedGroups, groupPositions, expandedGroupBounds } = useMemo(() => {
    const hiddenIds = new Set<string>();
    const collapsed: ResourceGroup[] = [];
    const expandedBounds = new Map<string, { x: number; y: number; width: number; height: number; group: ResourceGroup }>();

    groups.forEach(group => {
      if (group.displayMode === "collapsed") {
        // All members hidden, show group card
        group.resourceIds.forEach(id => hiddenIds.add(id));
        collapsed.push(group);
      } else if (group.displayMode === "leads-only") {
        // Hide members not in visibleResourceIds
        const visibleSet = new Set(group.visibleResourceIds || []);
        group.resourceIds.forEach(id => {
          if (!visibleSet.has(id)) {
            hiddenIds.add(id);
          }
        });
        // Calculate bounding box for visible resources
        const visibleIds = group.visibleResourceIds || [];
        if (visibleIds.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          visibleIds.forEach(id => {
            const pos = positions.get(id);
            if (pos) {
              minX = Math.min(minX, pos.x);
              minY = Math.min(minY, pos.y);
              maxX = Math.max(maxX, pos.x + TOKENS.card.width);
              maxY = Math.max(maxY, pos.y + TOKENS.card.height);
            }
          });
          if (minX !== Infinity) {
            const padding = 20;
            expandedBounds.set(group.id, {
              x: minX - padding,
              y: minY - padding - 30, // Extra space for header
              width: maxX - minX + padding * 2,
              height: maxY - minY + padding * 2 + 30,
              group,
            });
          }
        }
      } else {
        // "expanded" mode: all resources shown normally
        // Calculate bounding box for all resources in the group
        if (group.resourceIds.length > 0) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          group.resourceIds.forEach(id => {
            const pos = positions.get(id);
            if (pos) {
              minX = Math.min(minX, pos.x);
              minY = Math.min(minY, pos.y);
              maxX = Math.max(maxX, pos.x + TOKENS.card.width);
              maxY = Math.max(maxY, pos.y + TOKENS.card.height);
            }
          });
          if (minX !== Infinity) {
            const padding = 20;
            expandedBounds.set(group.id, {
              x: minX - padding,
              y: minY - padding - 30, // Extra space for header
              width: maxX - minX + padding * 2,
              height: maxY - minY + padding * 2 + 30,
              group,
            });
          }
        }
      }
    });

    // Calculate positions for collapsed groups
    // Use stored position if available, otherwise calculate from member positions
    const groupPos = new Map<string, NodePosition>();
    collapsed.forEach(group => {
      // Check if we have a stored position for this group
      const storedPos = storedGroupPositions.find(p => p.groupId === group.id);
      if (storedPos) {
        groupPos.set(group.id, { x: storedPos.x, y: storedPos.y });
      } else {
        // Fallback: calculate from member positions
        let avgX = 0, avgY = 0, count = 0;
        group.resourceIds.forEach(id => {
          const pos = positions.get(id);
          if (pos) {
            avgX += pos.x;
            avgY += pos.y;
            count++;
          }
        });
        if (count > 0) {
          groupPos.set(group.id, { x: avgX / count, y: avgY / count });
        } else {
          groupPos.set(group.id, { x: TOKENS.card.padding, y: TOKENS.card.padding });
        }
      }
    });

    return { hiddenResourceIds: hiddenIds, collapsedGroups: collapsed, groupPositions: groupPos, expandedGroupBounds: expandedBounds };
  }, [groups, positions, storedGroupPositions]);

  // Combined positions for connection drawing (includes both resources and groups)
  const allPositionsForConnections = useMemo(() => {
    const combined = new Map(livePositions);
    groupPositions.forEach((pos, groupId) => {
      combined.set(groupId, pos);
    });
    return combined;
  }, [livePositions, groupPositions]);

  // Viewport tracking for minimap
  const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setViewportRect({
      x: -x.get() / scale.get() + bounds.minX,
      y: -y.get() / scale.get() + bounds.minY,
      width: rect.width / scale.get(),
      height: rect.height / scale.get(),
    });
  }, [x, y, scale, bounds]);

  // Auto-fit on mount and when bounds change
  useEffect(() => {
    if (!containerRef.current || positions.size === 0) return;

    const fitToView = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      // Calculate scale to fit content with padding
      const padding = 40;
      const availableWidth = rect.width - padding * 2;
      const availableHeight = rect.height - padding * 2;

      const scaleX = availableWidth / bounds.width;
      const scaleY = availableHeight / bounds.height;
      // Clamp to MIN_ZOOM so content stays readable even with many resources
      const fitScale = Math.max(Math.min(scaleX, scaleY, 1), MIN_ZOOM);

      // Center the content
      const scaledWidth = bounds.width * fitScale;
      const scaledHeight = bounds.height * fitScale;
      const offsetX = (rect.width - scaledWidth) / 2;
      const offsetY = (rect.height - scaledHeight) / 2;

      scale.set(fitScale);
      x.set(offsetX);
      y.set(offsetY);
    };

    // Run immediately and after a short delay (for layout stabilization)
    fitToView();
    const timer = setTimeout(fitToView, 150);

    return () => clearTimeout(timer);
  }, [positions.size, bounds.width, bounds.height, scale, x, y, MIN_ZOOM]);

  // Handlers
  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEdit = useCallback((id: string) => {
    setEditingResourceId(id);
    setEditModalMode("edit");
    setShowAddModal(true);
    setSelectedId(id);
  }, []);

  const handleAdd = useCallback((managerId?: string | null) => {
    setEditingResourceId(null);
    setDefaultManagerId(managerId || null);
    setEditModalMode("add");
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingResourceId(null);
    setDefaultManagerId(null);
  }, []);

  // Get updateOrgChartCanvas from store
  const { updateOrgChartCanvas } = useGanttToolStoreV2();

  // Handler for updating card position (free-form drag) - called on drag END
  const handlePositionChange = useCallback((resourceId: string, newX: number, newY: number) => {
    const currentPositions = [...storedCardPositions];
    const existingIndex = currentPositions.findIndex(p => p.resourceId === resourceId);

    if (existingIndex >= 0) {
      currentPositions[existingIndex] = { resourceId, x: newX, y: newY };
    } else {
      currentPositions.push({ resourceId, x: newX, y: newY });
    }

    updateOrgChartCanvas({ cardPositions: currentPositions });
    setDragPositions(new Map());
  }, [storedCardPositions, updateOrgChartCanvas]);

  // Handler for live position updates during drag (for line following)
  const handleDragMove = useCallback((resourceId: string, visualX: number, visualY: number) => {
    setDragPositions(prev => {
      const next = new Map(prev);
      next.set(resourceId, { x: visualX, y: visualY });
      return next;
    });
  }, []);

  // Handler for multi-card position change (Ctrl+Click multi-select drag)
  const handleMultiPositionChange = useCallback((updates: Array<{ id: string; x: number; y: number }>) => {
    const currentPositions = [...storedCardPositions];

    updates.forEach(({ id, x, y }) => {
      const existingIndex = currentPositions.findIndex(p => p.resourceId === id);
      if (existingIndex >= 0) {
        currentPositions[existingIndex] = { resourceId: id, x, y };
      } else {
        currentPositions.push({ resourceId: id, x, y });
      }
    });

    updateOrgChartCanvas({ cardPositions: currentPositions });
    setDragPositions(new Map());
    // Clear multi-selection after drag completes
    setMultiSelectedIds(new Set());
  }, [storedCardPositions, updateOrgChartCanvas]);

  // Helper to get position for a resource by id
  const getPositionForId = useCallback((id: string): NodePosition | undefined => {
    return positions.get(id);
  }, [positions]);

  // Handle Ctrl+Click multi-selection
  const handleCardSelect = useCallback((e: React.MouseEvent, resourceId: string) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select mode: toggle the card in selection
      setMultiSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(resourceId)) {
          next.delete(resourceId);
        } else {
          next.add(resourceId);
        }
        return next;
      });
      // Keep primary selection on the clicked card
      setSelectedId(resourceId);
    } else {
      // Single select: clear multi-selection and select this card
      setMultiSelectedIds(new Set());
      setSelectedId(resourceId);
    }
    setSelectedGroupId(null);
  }, []);

  // Handler for updating group position (free-form drag)
  const handleGroupPositionChange = useCallback((groupId: string, newX: number, newY: number) => {
    const currentPositions = [...storedGroupPositions];
    const existingIndex = currentPositions.findIndex(p => p.groupId === groupId);

    if (existingIndex >= 0) {
      currentPositions[existingIndex] = { groupId, x: newX, y: newY };
    } else {
      currentPositions.push({ groupId, x: newX, y: newY });
    }

    updateOrgChartCanvas({ groupCardPositions: currentPositions });
  }, [storedGroupPositions, updateOrgChartCanvas]);

  // ============================================================================
  // Connection Line Management
  // ============================================================================

  // Calculate anchor point position on a card face
  const getAnchorPoint = useCallback((
    cardPos: NodePosition,
    anchor: ConnectionAnchor,
    nodeHeight: number = TOKENS.card.height
  ): { x: number; y: number } => {
    const cardWidth = TOKENS.card.width;

    switch (anchor) {
      case "top":
        return { x: cardPos.x + cardWidth / 2, y: cardPos.y };
      case "bottom":
        return { x: cardPos.x + cardWidth / 2, y: cardPos.y + nodeHeight };
      case "left":
        return { x: cardPos.x, y: cardPos.y + nodeHeight / 2 };
      case "right":
        return { x: cardPos.x + cardWidth, y: cardPos.y + nodeHeight / 2 };
    }
  }, []);

  // Determine optimal anchors based on card positions (for auto-routing)
  const calculateOptimalAnchors = useCallback((
    fromPos: NodePosition,
    toPos: NodePosition,
    fromHeight: number = TOKENS.card.height,
    toHeight: number = TOKENS.card.height
  ): { fromAnchor: ConnectionAnchor; toAnchor: ConnectionAnchor } => {
    const fromCenterX = fromPos.x + TOKENS.card.width / 2;
    const fromCenterY = fromPos.y + fromHeight / 2;
    const toCenterX = toPos.x + TOKENS.card.width / 2;
    const toCenterY = toPos.y + toHeight / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal dominant
      if (dx > 0) {
        return { fromAnchor: "right", toAnchor: "left" };
      } else {
        return { fromAnchor: "left", toAnchor: "right" };
      }
    } else {
      // Vertical dominant
      if (dy > 0) {
        return { fromAnchor: "bottom", toAnchor: "top" };
      } else {
        return { fromAnchor: "top", toAnchor: "bottom" };
      }
    }
  }, []);

  // Generate SVG path for a connection with orthogonal routing
  const generateConnectionPath = useCallback((
    fromPos: NodePosition,
    toPos: NodePosition,
    fromAnchor: ConnectionAnchor,
    toAnchor: ConnectionAnchor,
    fromHeight: number = TOKENS.card.height,
    toHeight: number = TOKENS.card.height
  ): string => {
    const start = getAnchorPoint(fromPos, fromAnchor, fromHeight);
    const end = getAnchorPoint(toPos, toAnchor, toHeight);

    // Use cubic bezier for smooth curves
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Calculate control points based on anchor directions
    let cp1x = start.x;
    let cp1y = start.y;
    let cp2x = end.x;
    let cp2y = end.y;

    const curveOffset = Math.min(Math.abs(dx), Math.abs(dy), 60) + 30;

    switch (fromAnchor) {
      case "top": cp1y = start.y - curveOffset; break;
      case "bottom": cp1y = start.y + curveOffset; break;
      case "left": cp1x = start.x - curveOffset; break;
      case "right": cp1x = start.x + curveOffset; break;
    }

    switch (toAnchor) {
      case "top": cp2y = end.y - curveOffset; break;
      case "bottom": cp2y = end.y + curveOffset; break;
      case "left": cp2x = end.x - curveOffset; break;
      case "right": cp2x = end.x + curveOffset; break;
    }

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }, [getAnchorPoint]);

  // Add a new connection
  const handleAddConnection = useCallback((
    fromResourceId: string,
    toResourceId: string,
    fromAnchor?: ConnectionAnchor,
    toAnchor?: ConnectionAnchor,
    lineType: "solid" | "dashed" | "dotted" = "solid"
  ) => {
    // Prevent duplicate connections
    const exists = storedConnections.some(
      c => (c.fromResourceId === fromResourceId && c.toResourceId === toResourceId) ||
           (c.fromResourceId === toResourceId && c.toResourceId === fromResourceId)
    );
    if (exists) return;

    const newConnection: OrgChartConnection = {
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromResourceId,
      toResourceId,
      fromAnchor,
      toAnchor,
      lineType,
      arrowHead: "end",
      createdAt: new Date().toISOString(),
    };

    updateOrgChartCanvas({ connections: [...storedConnections, newConnection] });
  }, [storedConnections, updateOrgChartCanvas]);

  // Update a connection
  const handleUpdateConnection = useCallback((
    connectionId: string,
    updates: Partial<OrgChartConnection>
  ) => {
    const updated = storedConnections.map(c =>
      c.id === connectionId ? { ...c, ...updates } : c
    );
    updateOrgChartCanvas({ connections: updated });
  }, [storedConnections, updateOrgChartCanvas]);

  // Delete a connection
  const handleDeleteConnection = useCallback((connectionId: string) => {
    const filtered = storedConnections.filter(c => c.id !== connectionId);
    updateOrgChartCanvas({ connections: filtered });
    setSelectedConnectionId(null);
    setEditingConnectionId(null);
  }, [storedConnections, updateOrgChartCanvas]);

  // Handle connection mode mouse move for preview line
  const handleConnectionMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isConnectionMode || !connectionStart || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentScale = scale.get();
    const panX = x.get();
    const panY = y.get();

    // Convert screen coordinates to canvas coordinates
    const canvasX = (e.clientX - rect.left - panX) / currentScale;
    const canvasY = (e.clientY - rect.top - panY) / currentScale;

    setConnectionPreview({ x: canvasX, y: canvasY });
  }, [isConnectionMode, connectionStart, scale, x, y]);

  // Handle click on card anchor point to start/complete connection
  const handleAnchorClick = useCallback((resourceId: string, anchor: ConnectionAnchor) => {
    if (!isConnectionMode) return;

    if (!connectionStart) {
      // Start drawing
      setConnectionStart({ resourceId, anchor });
    } else if (connectionStart.resourceId !== resourceId) {
      // Complete connection
      handleAddConnection(
        connectionStart.resourceId,
        resourceId,
        connectionStart.anchor,
        anchor
      );
      setConnectionStart(null);
      setConnectionPreview(null);
    }
  }, [isConnectionMode, connectionStart, handleAddConnection]);

  // Cancel connection drawing
  const handleCancelConnection = useCallback(() => {
    setConnectionStart(null);
    setConnectionPreview(null);
  }, []);

  // Toggle connection mode
  const toggleConnectionMode = useCallback(() => {
    setIsConnectionMode(prev => {
      if (prev) {
        // Exiting connection mode - clean up
        setConnectionStart(null);
        setConnectionPreview(null);
      }
      return !prev;
    });
  }, []);

  // Layout constants - use larger gaps when connections exist for cleaner line routing
  const hasConnections = storedConnections.length > 0;
  const GAP = hasConnections ? 96 : 48; // Larger gap for connection routing
  const EFFECTIVE_CARD_HEIGHT = 160; // Account for group card content

  // Get saved hierarchy from project
  const savedHierarchy = currentProject?.orgChartPro?.savedHierarchy;

  // Save current layout as the preferred hierarchy structure
  const handleSaveHierarchy = useCallback(() => {
    // Get all current positions (cards + groups)
    const allPositions: Array<{ id: string; x: number; y: number; isGroup: boolean }> = [];

    storedCardPositions.forEach(pos => {
      allPositions.push({ id: pos.resourceId, x: pos.x, y: pos.y, isGroup: false });
    });
    storedGroupPositions.forEach(pos => {
      allPositions.push({ id: pos.groupId, x: pos.x, y: pos.y, isGroup: true });
    });

    if (allPositions.length === 0) return;

    // Group items by Y position (same row = same Y within tolerance)
    const ROW_TOLERANCE = EFFECTIVE_CARD_HEIGHT / 2;
    const rowMap = new Map<number, string[]>();

    // Sort by Y first to identify rows
    allPositions.sort((a, b) => a.y - b.y);

    let currentRowY = allPositions[0]?.y ?? 0;
    let currentRowItems: Array<{ id: string; x: number }> = [];

    allPositions.forEach(pos => {
      if (Math.abs(pos.y - currentRowY) <= ROW_TOLERANCE) {
        currentRowItems.push({ id: pos.id, x: pos.x });
      } else {
        // Save current row and start new one
        if (currentRowItems.length > 0) {
          currentRowItems.sort((a, b) => a.x - b.x);
          rowMap.set(currentRowY, currentRowItems.map(item => item.id));
        }
        currentRowY = pos.y;
        currentRowItems = [{ id: pos.id, x: pos.x }];
      }
    });
    // Don't forget last row
    if (currentRowItems.length > 0) {
      currentRowItems.sort((a, b) => a.x - b.x);
      rowMap.set(currentRowY, currentRowItems.map(item => item.id));
    }

    // Convert to array format sorted by Y
    const sortedRowYs = Array.from(rowMap.keys()).sort((a, b) => a - b);
    const rows = sortedRowYs.map((y, idx) => ({
      rowIndex: idx,
      itemIds: rowMap.get(y)!,
    }));

    updateOrgChartCanvas({
      savedHierarchy: {
        rows,
        savedAt: new Date().toISOString(),
      },
    });
  }, [storedCardPositions, storedGroupPositions, updateOrgChartCanvas]);

  // Auto-arrange: uses saved hierarchy if available, otherwise uses current positions to create one
  const handleAutoArrange = useCallback(() => {
    let newCardPositions: OrgChartCardPosition[] = [];
    let newGroupPositions: { groupId: string; x: number; y: number }[] = [];

    const allResourceIds = new Set(resources.map(r => r.id));
    const allGroupIds = new Set(groups.map(g => g.id));
    const groupedResourceIds = new Set<string>();
    groups.forEach(g => g.resourceIds.forEach(id => groupedResourceIds.add(id)));

    // Determine hierarchy to use: saved OR derive from current positions OR default
    let hierarchyToUse: Array<{ rowIndex: number; itemIds: string[] }> | null = null;

    if (savedHierarchy && savedHierarchy.rows.length > 0) {
      // Use explicitly saved hierarchy
      hierarchyToUse = savedHierarchy.rows;
    } else if (storedCardPositions.length > 0 || storedGroupPositions.length > 0) {
      // Derive hierarchy from current positions (auto-save behavior)
      const allPositions: Array<{ id: string; x: number; y: number }> = [];
      storedCardPositions.forEach(pos => {
        if (!groupedResourceIds.has(pos.resourceId)) {
          allPositions.push({ id: pos.resourceId, x: pos.x, y: pos.y });
        }
      });
      storedGroupPositions.forEach(pos => {
        allPositions.push({ id: pos.groupId, x: pos.x, y: pos.y });
      });

      if (allPositions.length > 0) {
        allPositions.sort((a, b) => a.y - b.y);
        const ROW_TOLERANCE = EFFECTIVE_CARD_HEIGHT / 2;
        const rowMap = new Map<number, Array<{ id: string; x: number }>>();

        let currentRowY = allPositions[0].y;
        let currentRowItems: Array<{ id: string; x: number }> = [];

        allPositions.forEach(pos => {
          if (Math.abs(pos.y - currentRowY) <= ROW_TOLERANCE) {
            currentRowItems.push({ id: pos.id, x: pos.x });
          } else {
            if (currentRowItems.length > 0) {
              rowMap.set(currentRowY, [...currentRowItems]);
            }
            currentRowY = pos.y;
            currentRowItems = [{ id: pos.id, x: pos.x }];
          }
        });
        if (currentRowItems.length > 0) {
          rowMap.set(currentRowY, currentRowItems);
        }

        const sortedRowYs = Array.from(rowMap.keys()).sort((a, b) => a - b);
        hierarchyToUse = sortedRowYs.map((y, idx) => {
          const items = rowMap.get(y)!;
          items.sort((a, b) => a.x - b.x);
          return { rowIndex: idx, itemIds: items.map(i => i.id) };
        });
      }
    }

    if (hierarchyToUse && hierarchyToUse.length > 0) {
      // Calculate max row width for centering all rows consistently
      const rowWidths = hierarchyToUse.map(row => {
        const validItems = row.itemIds.filter(id => allResourceIds.has(id) || allGroupIds.has(id));
        return validItems.length * TOKENS.card.width + Math.max(0, validItems.length - 1) * GAP;
      });
      const maxRowWidth = Math.max(...rowWidths, TOKENS.card.width);

      hierarchyToUse.forEach((row, rowIndex) => {
        const y = TOKENS.card.padding + rowIndex * (EFFECTIVE_CARD_HEIGHT + GAP);
        const validItems = row.itemIds.filter(id =>
          (allResourceIds.has(id) && !groupedResourceIds.has(id)) || allGroupIds.has(id)
        );

        if (validItems.length === 0) return;

        // Center this row
        const rowWidth = validItems.length * TOKENS.card.width + (validItems.length - 1) * GAP;
        const startX = TOKENS.card.padding + Math.round((maxRowWidth - rowWidth) / 2);

        validItems.forEach((id, colIndex) => {
          const x = startX + colIndex * (TOKENS.card.width + GAP);

          if (allGroupIds.has(id)) {
            newGroupPositions.push({ groupId: id, x, y });
          } else {
            newCardPositions.push({ resourceId: id, x, y });
          }
        });
      });

      // Add any new items not in hierarchy at the bottom
      const placedIds = new Set([
        ...newCardPositions.map(p => p.resourceId),
        ...newGroupPositions.map(p => p.groupId),
      ]);

      const unplacedResources = resources.filter(r =>
        !placedIds.has(r.id) && !groupedResourceIds.has(r.id)
      );
      const unplacedGroups = groups.filter(g => !placedIds.has(g.id));

      if (unplacedResources.length > 0 || unplacedGroups.length > 0) {
        const lastRowY = newCardPositions.length > 0 || newGroupPositions.length > 0
          ? Math.max(...newCardPositions.map(p => p.y), ...newGroupPositions.map(p => p.y), 0)
            + EFFECTIVE_CARD_HEIGHT + GAP
          : TOKENS.card.padding;

        let currentX = TOKENS.card.padding;
        unplacedGroups.forEach(g => {
          newGroupPositions.push({ groupId: g.id, x: currentX, y: lastRowY });
          currentX += TOKENS.card.width + GAP;
        });
        unplacedResources.forEach(r => {
          newCardPositions.push({ resourceId: r.id, x: currentX, y: lastRowY });
          currentX += TOKENS.card.width + GAP;
        });
      }
    } else {
      // Fallback: use default category-based algorithm
      const { resourcePositions, groupPositions } = calculateHierarchicalPositions(
        resources,
        groups,
        {
          cardWidth: TOKENS.card.width,
          cardHeight: EFFECTIVE_CARD_HEIGHT,
          horizontalGap: GAP,
          rowGap: GAP,
          padding: TOKENS.card.padding,
        }
      );

      newCardPositions = resourcePositions.map(pos => ({
        resourceId: pos.resourceId,
        x: pos.x,
        y: pos.y,
      }));

      newGroupPositions = groupPositions.map(pos => ({
        groupId: pos.groupId,
        x: pos.x,
        y: pos.y,
      }));
    }

    updateOrgChartCanvas({
      cardPositions: newCardPositions,
      groupCardPositions: newGroupPositions,
    });

    // Fit to view after positions update
    setTimeout(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      newCardPositions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + TOKENS.card.width);
        maxY = Math.max(maxY, pos.y + EFFECTIVE_CARD_HEIGHT);
      });
      newGroupPositions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + TOKENS.card.width);
        maxY = Math.max(maxY, pos.y + EFFECTIVE_CARD_HEIGHT);
      });

      if (minX === Infinity) return;

      const contentWidth = maxX - minX + TOKENS.card.padding * 2;
      const contentHeight = maxY - minY + TOKENS.card.padding * 2;

      const viewPadding = 60;
      const availableWidth = rect.width - viewPadding * 2;
      const availableHeight = rect.height - viewPadding * 2;

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      const fitScale = Math.max(Math.min(scaleX, scaleY, 1), MIN_ZOOM);

      const scaledWidth = contentWidth * fitScale;
      const scaledHeight = contentHeight * fitScale;
      const offsetX = (rect.width - scaledWidth) / 2 - (minX - TOKENS.card.padding) * fitScale;
      const offsetY = (rect.height - scaledHeight) / 2 - (minY - TOKENS.card.padding) * fitScale;

      scale.set(fitScale);
      x.set(offsetX);
      y.set(offsetY);
    }, 50);
  }, [resources, groups, savedHierarchy, storedCardPositions, storedGroupPositions, updateOrgChartCanvas, scale, x, y, MIN_ZOOM]);

  // Checkbox selection handlers for bulk edit
  const handleToggleResourceCheck = useCallback((resourceId: string) => {
    setCheckedResourceIds(prev => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  }, []);

  const handleSelectAllResources = useCallback((resourceIds: string[]) => {
    const allSelected = resourceIds.every(id => checkedResourceIds.has(id));
    if (allSelected) {
      // Deselect all
      setCheckedResourceIds(new Set());
    } else {
      // Select all
      setCheckedResourceIds(new Set(resourceIds));
    }
  }, [checkedResourceIds]);

  const handleClearChecked = useCallback(() => {
    setCheckedResourceIds(new Set());
  }, []);

  // Bulk update handler - applies updates to all selected resources
  const handleBulkUpdate = useCallback(async (updates: Partial<Resource>) => {
    const resourceIds = Array.from(checkedResourceIds);

    // Update all selected resources sequentially to avoid race conditions
    for (const resourceId of resourceIds) {
      await updateResource(resourceId, updates);
    }

    // Clear selection after successful update
    setCheckedResourceIds(new Set());
  }, [checkedResourceIds, updateResource]);

  // Get visible/filtered resource IDs for "Select All"
  const filteredResources = useMemo(() => {
    return resources.filter(r =>
      resourceSearch === "" ||
      r.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(resourceSearch.toLowerCase()))
    );
  }, [resources, resourceSearch]);

  const filteredResourceIds = useMemo(() => filteredResources.map(r => r.id), [filteredResources]);
  const allFilteredChecked = filteredResourceIds.length > 0 && filteredResourceIds.every(id => checkedResourceIds.has(id));
  const someFilteredChecked = filteredResourceIds.some(id => checkedResourceIds.has(id));

  const handleDelete = useCallback(async (id: string) => {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    if (window.confirm(`Delete "${resource.name}"?`)) {
      await deleteResource(id);
      if (selectedId === id) setSelectedId(null);
    }
  }, [resources, deleteResource, selectedId]);

  const handleNavigate = useCallback((targetX: number, targetY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(-(targetX - bounds.minX - rect.width / 2 / scale.get()) * scale.get());
    y.set(-(targetY - bounds.minY - rect.height / 2 / scale.get()) * scale.get());
  }, [x, y, scale, bounds]);

  // Keyboard navigation - simplified without hierarchy collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!selectedId) {
        // Select first node if none selected
        if (resources.length > 0 && e.key === "Tab") {
          e.preventDefault();
          setSelectedId(resources[0].id);
        }
        return;
      }

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          handleEdit(selectedId);
          break;
        }
        case "Delete":
        case "Backspace": {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleDelete(selectedId);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          // Cancel connection mode first if active
          if (isConnectionMode) {
            handleCancelConnection();
            setIsConnectionMode(false);
          } else if (selectedConnectionId) {
            setSelectedConnectionId(null);
          } else {
            setSelectedId(null);
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resources, selectedId, handleEdit, handleDelete, isConnectionMode, handleCancelConnection, selectedConnectionId]);

  // Zoom controls
  const handleZoomIn = useCallback(() => scale.set(Math.min(scale.get() * 1.2, MAX_ZOOM)), [scale, MAX_ZOOM]);
  const handleZoomOut = useCallback(() => scale.set(Math.max(scale.get() / 1.2, MIN_ZOOM)), [scale, MIN_ZOOM]);
  const handleZoomReset = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const padding = 40;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    // Clamp to MIN_ZOOM so content stays readable
    const fitScale = Math.max(Math.min(scaleX, scaleY, 1), MIN_ZOOM);

    const scaledWidth = bounds.width * fitScale;
    const scaledHeight = bounds.height * fitScale;
    const offsetX = (rect.width - scaledWidth) / 2;
    const offsetY = (rect.height - scaledHeight) / 2;

    scale.set(fitScale);
    x.set(offsetX);
    y.set(offsetY);
  }, [bounds.width, bounds.height, scale, x, y, MIN_ZOOM]);

  // Mouse wheel zoom - zoom towards cursor position
  // Normalized for consistent behavior across different mice/trackpads
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Get mouse position relative to container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Current values
    const currentScale = scale.get();
    const currentX = x.get();
    const currentY = y.get();

    // Normalize deltaY for consistent zoom across devices
    // Most trackpads: deltaY ~1-4, most mice: deltaY ~100-120
    // We normalize to a consistent zoom step
    const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 50);
    const zoomIntensity = 0.002; // Lower = slower zoom
    const zoomFactor = 1 - normalizedDelta * zoomIntensity;

    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentScale * zoomFactor));

    // If scale didn't change (hit limits), don't update position
    if (newScale === currentScale) return;

    // Calculate the point in content space that's under the mouse
    const contentX = (mouseX - currentX) / currentScale;
    const contentY = (mouseY - currentY) / currentScale;

    // Calculate new position to keep the same content point under the mouse
    const newX = mouseX - contentX * newScale;
    const newY = mouseY - contentY * newScale;

    scale.set(newScale);
    x.set(newX);
    y.set(newY);
  }, [scale, x, y, MIN_ZOOM, MAX_ZOOM]);

  // Prevent body scroll on mobile
  useEffect(() => {
    if (deviceType === "mobile" && !isFullPage) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [deviceType, isFullPage]);

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: TOKENS.colors.bg.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: deviceType === "mobile" ? "12px 16px" : "16px 24px",
          borderBottom: `1px solid ${TOKENS.colors.border.default}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TOKENS.typography.family,
              fontSize: deviceType === "mobile" ? TOKENS.typography.size.lg : TOKENS.typography.size.xl,
              fontWeight: TOKENS.typography.weight.bold,
              color: TOKENS.colors.text.primary,
              margin: 0,
            }}
          >
            Organization Chart
          </h2>
          <p
            style={{
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.xs,
              color: TOKENS.colors.text.secondary,
              margin: "4px 0 0",
            }}
          >
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
            {deviceType !== "mobile" && " • Drag cards to move"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Zoom Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: TOKENS.colors.bg.secondary,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <button
              onClick={handleZoomOut}
              aria-label="Zoom out"
              style={{
                width: 40,
                height: 40,
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div
              style={{
                padding: "0 12px",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                borderLeft: `1px solid ${TOKENS.colors.border.default}`,
                borderRight: `1px solid ${TOKENS.colors.border.default}`,
                minWidth: 50,
                textAlign: "center",
              }}
            >
              {Math.round(smoothScale.get() * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              aria-label="Zoom in"
              style={{
                width: 40,
                height: 40,
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleZoomReset}
            aria-label="Fit to screen"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: "transparent",
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: TOKENS.colors.text.secondary,
              cursor: "pointer",
            }}
          >
            Fit
          </button>

          {/* Save Hierarchy Button */}
          <button
            onClick={handleSaveHierarchy}
            aria-label="Save current layout as hierarchy"
            title={savedHierarchy ? `Hierarchy saved: ${new Date(savedHierarchy.savedAt).toLocaleDateString()}` : "Save current layout"}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${savedHierarchy ? TOKENS.colors.accent.green : TOKENS.colors.border.default}`,
              backgroundColor: savedHierarchy ? "rgba(52, 199, 89, 0.1)" : "transparent",
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: savedHierarchy ? TOKENS.colors.accent.green : TOKENS.colors.text.primary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 1H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4l-2-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 13V8H5v5M5 1v3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {savedHierarchy ? "Saved" : "Save Layout"}
          </button>

          {/* Connect Mode Button */}
          <button
            onClick={toggleConnectionMode}
            aria-label={isConnectionMode ? "Exit connection mode" : "Draw connections"}
            title={isConnectionMode ? "Press Escape to cancel" : "Draw lines between cards"}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: isConnectionMode ? "none" : `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: isConnectionMode ? TOKENS.colors.accent.green : "transparent",
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: isConnectionMode ? TOKENS.colors.text.inverse : TOKENS.colors.text.primary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="3" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {isConnectionMode ? "Drawing..." : "Connect"}
          </button>

          {/* Auto-Arrange Button */}
          <button
            onClick={handleAutoArrange}
            aria-label={savedHierarchy ? "Arrange using saved hierarchy" : "Auto-arrange cards"}
            title={
              savedHierarchy
                ? "Uses your saved layout"
                : hasConnections
                  ? "Arrange with wider gaps for connection lines"
                  : "Arrange by category and designation"
            }
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: TOKENS.colors.accent.blue,
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: TOKENS.colors.text.inverse,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Auto-Arrange{hasConnections ? " (Wide)" : ""}
          </button>

          {/* Export Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              onBlur={() => setTimeout(() => setShowExportMenu(false), 150)}
              aria-label="Export options"
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: "transparent",
                fontFamily: TOKENS.typography.family,
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Export Menu Dropdown */}
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    backgroundColor: TOKENS.colors.bg.primary,
                    borderRadius: 12,
                    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: 180,
                  }}
                >
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      if (currentProject) exportOrgChartToPNG(currentProject.name, "org-chart-canvas");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      backgroundColor: "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      color: TOKENS.colors.text.primary,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="2" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" />
                      <circle cx="5" cy="11" r="1" fill={TOKENS.colors.text.secondary} />
                      <path d="M4 7l3-2 2 1.5 3-2.5" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Export as PNG
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      if (currentProject) exportOrgChartToPDF(currentProject.name, "org-chart-canvas");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      borderTop: `1px solid ${TOKENS.colors.border.subtle}`,
                      backgroundColor: "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      color: TOKENS.colors.text.primary,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 2h5l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" />
                      <path d="M9 2v3h3" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 9h6M5 12h4" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      if (currentProject) exportOrgChartToPPT(currentProject.name, "org-chart-canvas");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      borderTop: `1px solid ${TOKENS.colors.border.subtle}`,
                      backgroundColor: "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      color: TOKENS.colors.text.primary,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="10" rx="1" stroke="#D35230" strokeWidth="1.5" />
                      <path d="M5 7h2v2H5zM8 7h3M8 10h2" stroke="#D35230" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    <span>Export as <strong style={{ color: "#D35230" }}>PPT</strong></span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isFullPage && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {/* Toggle Resource Panel Button - Opens drawer on mobile */}
          <button
            onClick={() => {
              if (deviceType === "mobile") {
                setShowMobileDrawer(true);
              } else {
                setShowResourcePanel(!showResourcePanel);
              }
            }}
            aria-label={showResourcePanel ? "Hide resource panel" : "Show resource panel"}
            style={{
              height: 44,
              padding: "0 14px",
              borderRadius: 10,
              border: `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: (showResourcePanel || showMobileDrawer) ? TOKENS.colors.bg.secondary : "transparent",
              fontFamily: TOKENS.typography.family,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.semibold,
              color: TOKENS.colors.text.primary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3h10M2 7h10M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {deviceType !== "mobile" && "List"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Resource List Panel */}
        {showResourcePanel && deviceType !== "mobile" && (
          <div
            style={{
              width: 320,
              borderRight: `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: TOKENS.colors.bg.primary,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${TOKENS.colors.border.default}`,
              }}
            >
              {/* View Toggle: Resources / Groups */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: 4,
                  backgroundColor: TOKENS.colors.bg.secondary,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <button
                  onClick={() => setListViewMode("resources")}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: listViewMode === "resources" ? TOKENS.colors.bg.primary : "transparent",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    fontWeight: listViewMode === "resources" ? TOKENS.typography.weight.semibold : TOKENS.typography.weight.medium,
                    color: listViewMode === "resources" ? TOKENS.colors.text.primary : TOKENS.colors.text.secondary,
                    cursor: "pointer",
                    boxShadow: listViewMode === "resources" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Resources ({resources.length})
                </button>
                <button
                  onClick={() => setListViewMode("groups")}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: listViewMode === "groups" ? TOKENS.colors.bg.primary : "transparent",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    fontWeight: listViewMode === "groups" ? TOKENS.typography.weight.semibold : TOKENS.typography.weight.medium,
                    color: listViewMode === "groups" ? TOKENS.colors.text.primary : TOKENS.colors.text.secondary,
                    cursor: "pointer",
                    boxShadow: listViewMode === "groups" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  Groups ({groups.length})
                </button>
              </div>

              {/* Search and Add row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  placeholder={listViewMode === "resources" ? "Search resources..." : "Search groups..."}
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.secondary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    if (listViewMode === "resources") {
                      handleAdd(null);
                    } else {
                      setEditingGroupId(null);
                      setShowGroupModal(true);
                    }
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: TOKENS.colors.accent.blue,
                    color: TOKENS.colors.text.inverse,
                    fontSize: 20,
                    fontWeight: 300,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={listViewMode === "resources" ? "Add resource" : "Create group"}
                >
                  +
                </button>
              </div>

              {/* Select All / Bulk Edit row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${TOKENS.colors.border.subtle}`,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.xs,
                    color: TOKENS.colors.text.secondary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredChecked && !allFilteredChecked;
                    }}
                    onChange={() => handleSelectAllResources(filteredResourceIds)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: TOKENS.colors.accent.blue,
                      cursor: "pointer",
                    }}
                  />
                  Select All ({filteredResources.length})
                </label>

                {checkedResourceIds.size > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.xs,
                        color: TOKENS.colors.accent.blue,
                        fontWeight: TOKENS.typography.weight.semibold,
                      }}
                    >
                      {checkedResourceIds.size} selected
                    </span>
                    <button
                      onClick={() => setShowBulkEditModal(true)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: TOKENS.colors.accent.blue,
                        color: TOKENS.colors.text.inverse,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.xs,
                        fontWeight: TOKENS.typography.weight.semibold,
                        cursor: "pointer",
                      }}
                    >
                      Bulk Edit
                    </button>
                    <button
                      onClick={handleClearChecked}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${TOKENS.colors.border.default}`,
                        backgroundColor: "transparent",
                        color: TOKENS.colors.text.secondary,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.xs,
                        cursor: "pointer",
                      }}
                      title="Clear selection"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Resource List or Groups List */}
            <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
              {listViewMode === "groups" ? (
                // Groups List
                <>
                  {groups
                    .filter(g =>
                      resourceSearch === "" ||
                      g.name.toLowerCase().includes(resourceSearch.toLowerCase())
                    )
                    .map(group => {
                      const memberCount = group.resourceIds.length;
                      const leadResource = group.leadResourceId
                        ? resources.find(r => r.id === group.leadResourceId)
                        : null;
                      const visibleCount = group.displayMode === "leads-only"
                        ? (group.visibleResourceIds?.length || 0)
                        : memberCount;

                      return (
                        <div
                          key={group.id}
                          onClick={() => {
                            setEditingGroupId(group.id);
                            setShowGroupModal(true);
                          }}
                          style={{
                            padding: "12px 16px",
                            margin: "0 8px 6px",
                            borderRadius: 8,
                            backgroundColor: TOKENS.colors.bg.primary,
                            border: `1px solid ${TOKENS.colors.border.default}`,
                            cursor: "pointer",
                            transition: "all 100ms ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = TOKENS.colors.accent.blue;
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = TOKENS.colors.border.default;
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span
                              style={{
                                fontFamily: TOKENS.typography.family,
                                fontSize: TOKENS.typography.size.sm,
                                fontWeight: TOKENS.typography.weight.semibold,
                                color: TOKENS.colors.text.primary,
                              }}
                            >
                              {group.name}
                            </span>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                backgroundColor: TOKENS.colors.bg.secondary,
                                fontFamily: TOKENS.typography.family,
                                fontSize: 10,
                                fontWeight: TOKENS.typography.weight.semibold,
                                color: TOKENS.colors.text.secondary,
                              }}
                            >
                              {memberCount} {memberCount === 1 ? "member" : "members"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                backgroundColor:
                                  group.displayMode === "expanded"
                                    ? "rgba(52, 199, 89, 0.1)"
                                    : group.displayMode === "collapsed"
                                      ? "rgba(255, 149, 0, 0.1)"
                                      : "rgba(0, 122, 255, 0.1)",
                                fontFamily: TOKENS.typography.family,
                                fontSize: 10,
                                fontWeight: TOKENS.typography.weight.medium,
                                color:
                                  group.displayMode === "expanded"
                                    ? TOKENS.colors.accent.green
                                    : group.displayMode === "collapsed"
                                      ? TOKENS.colors.accent.orange
                                      : TOKENS.colors.accent.blue,
                              }}
                            >
                              {group.displayMode === "expanded" ? "Show All" : group.displayMode === "collapsed" ? "Collapsed" : `${visibleCount} Visible`}
                            </span>
                            {leadResource && (
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: TOKENS.typography.size.xs,
                                  color: TOKENS.colors.text.tertiary,
                                }}
                              >
                                Lead: {leadResource.name}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {groups.length === 0 && (
                    <div
                      style={{
                        padding: "40px 16px",
                        textAlign: "center",
                        color: TOKENS.colors.text.tertiary,
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                      }}
                    >
                      No groups yet.
                      <br />
                      <span style={{ fontSize: TOKENS.typography.size.xs, color: TOKENS.colors.text.tertiary }}>
                        Groups help organize large teams for cleaner presentations.
                      </span>
                      <br />
                      <button
                        onClick={() => {
                          setEditingGroupId(null);
                          setShowGroupModal(true);
                        }}
                        style={{
                          marginTop: 12,
                          padding: "8px 16px",
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: TOKENS.colors.accent.blue,
                          color: TOKENS.colors.text.inverse,
                          fontFamily: TOKENS.typography.family,
                          fontSize: TOKENS.typography.size.sm,
                          fontWeight: TOKENS.typography.weight.semibold,
                          cursor: "pointer",
                        }}
                      >
                        Create First Group
                      </button>
                    </div>
                  )}
                </>
              ) : (
              // Resources List
              <>
              {filteredResources
                .sort((a, b) => {
                  // 1. Root resources (no manager) come first
                  const aIsRoot = !a.managerResourceId ? 0 : 1;
                  const bIsRoot = !b.managerResourceId ? 0 : 1;
                  if (aIsRoot !== bIsRoot) return aIsRoot - bIsRoot;

                  // 2. Sort by category priority order
                  const aCategoryOrder = CATEGORY_SORT_ORDER[a.category] ?? 8;
                  const bCategoryOrder = CATEGORY_SORT_ORDER[b.category] ?? 8;
                  if (aCategoryOrder !== bCategoryOrder) return aCategoryOrder - bCategoryOrder;

                  // 3. Within same category, sort alphabetically
                  return a.name.localeCompare(b.name);
                })
                .map(resource => {
                  const category = RESOURCE_CATEGORIES[resource.category] || RESOURCE_CATEGORIES.other;
                  const manager = resources.find(r => r.id === resource.managerResourceId);
                  const isActive = selectedId === resource.id;
                  const isChecked = checkedResourceIds.has(resource.id);
                  // Check if this resource's company is a sub-company
                  const resourceSubCompany = resource.companyName
                    ? subCompanies.find(sc => sc.name === resource.companyName)
                    : undefined;
                  // If it's a sub-company, use parent's logo; otherwise use direct company logo
                  const logo = resource.companyName
                    ? (resourceSubCompany ? companyLogos[resourceSubCompany.parentCompany] : companyLogos[resource.companyName])
                    : undefined;
                  const listIndicatorColor = resourceSubCompany?.indicatorColor;

                  return (
                    <div
                      key={resource.id}
                      onClick={() => setSelectedId(resource.id)}
                      onDoubleClick={() => handleEdit(resource.id)}
                      style={{
                        padding: "10px 16px",
                        margin: "0 8px 4px",
                        borderRadius: 8,
                        backgroundColor: isChecked
                          ? "rgba(0, 122, 255, 0.08)"
                          : isActive
                            ? "rgba(0, 122, 255, 0.1)"
                            : "transparent",
                        border: isActive ? `1px solid ${TOKENS.colors.accent.blue}` : "1px solid transparent",
                        cursor: "pointer",
                        transition: "all 100ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive && !isChecked) e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !isChecked) e.currentTarget.style.backgroundColor = "transparent";
                        else if (isChecked && !isActive) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.08)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Checkbox for multi-select */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleResourceCheck(resource.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: TOKENS.colors.accent.blue,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        />
                        {/* Company Logo or Category dot with sub-company indicator */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {logo ? (
                            <img
                              src={logo}
                              alt={resource.companyName}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                objectFit: "contain",
                                backgroundColor: "#fff",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: category.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#fff",
                              }}
                            >
                              {resource.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Sub-company indicator dot */}
                          {listIndicatorColor && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: listIndicatorColor,
                                border: "1.5px solid white",
                              }}
                            />
                          )}
                        </div>
                        {/* Name & Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: TOKENS.typography.family,
                                fontSize: TOKENS.typography.size.sm,
                                fontWeight: TOKENS.typography.weight.semibold,
                                color: TOKENS.colors.text.primary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {resource.name}
                            </span>
                            {/* Root indicator badge */}
                            {!resource.managerResourceId && (
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  backgroundColor: "rgba(52, 199, 89, 0.12)",
                                  color: TOKENS.colors.accent.green,
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: 9,
                                  fontWeight: TOKENS.typography.weight.semibold,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.3,
                                  flexShrink: 0,
                                }}
                              >
                                Root
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontFamily: TOKENS.typography.family,
                              fontSize: TOKENS.typography.size.xs,
                              color: TOKENS.colors.text.secondary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginTop: 2,
                            }}
                          >
                            {category.label}
                          </div>
                          {/* Reports To indicator - separate line for clarity */}
                          {manager && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 4,
                                padding: "3px 0",
                              }}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                style={{ flexShrink: 0, opacity: 0.6 }}
                              >
                                <path
                                  d="M5 2V6M5 6L3 4M5 6L7 4M2 8H8"
                                  stroke={TOKENS.colors.text.tertiary}
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span
                                style={{
                                  fontFamily: TOKENS.typography.family,
                                  fontSize: 10,
                                  color: TOKENS.colors.text.tertiary,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                Reports to{" "}
                                <span style={{ color: TOKENS.colors.text.secondary, fontWeight: 500 }}>
                                  {manager.name}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Quick Actions */}
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(resource.id); }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "none",
                              backgroundColor: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: 0.6,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.backgroundColor = TOKENS.colors.bg.secondary; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.backgroundColor = "transparent"; }}
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {resources.length === 0 && (
                <div
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: TOKENS.colors.text.tertiary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.sm,
                  }}
                >
                  No resources yet.
                  <br />
                  <button
                    onClick={() => handleAdd(null)}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: TOKENS.colors.accent.blue,
                      color: TOKENS.colors.text.inverse,
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: TOKENS.typography.weight.semibold,
                      cursor: "pointer",
                    }}
                  >
                    Add First Resource
                  </button>
                </div>
              )}
              </>
            )}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          id="org-chart-canvas"
          ref={containerRef}
          onWheel={handleWheel}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundColor: TOKENS.colors.bg.secondary,
            cursor: isCardDragging ? "default" : "grab",
          }}
          onClick={() => {
            setSelectedId(null);
            setSelectedGroupId(null);
            setSelectedConnectionId(null);
          }}
        >
        {resources.length === 0 ? (
          <EmptyState onAdd={() => handleAdd(null)} />
        ) : (
          <>
            <motion.div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: bounds.width + 500,
                height: bounds.height + 500,
                transformOrigin: "0 0",
                scale: smoothScale,
                x: smoothX,
                y: smoothY,
                cursor: isCardDragging ? "default" : "grab",
              }}
              drag={!isCardDragging}
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => {
                if (containerRef.current) containerRef.current.style.cursor = "grabbing";
              }}
              onDragEnd={() => {
                if (containerRef.current) containerRef.current.style.cursor = "grab";
              }}
            >
              {/* Connection Lines SVG - renders hierarchy lines from managers to reports */}
              {/* Extra padding for bezier curve control points that extend beyond card edges */}
              {(() => {
                const connectionPadding = 100;
                return (
              <svg
                style={{
                  position: "absolute",
                  top: -connectionPadding,
                  left: -connectionPadding,
                  width: bounds.width + 500 + connectionPadding * 2,
                  height: bounds.height + 500 + connectionPadding * 2,
                  pointerEvents: storedConnections.length > 0 ? "auto" : "none",
                  zIndex: 0,
                  overflow: "visible",
                }}
              >
                <defs>
                  <marker
                    id="hierarchy-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M0,0 L0,8 L8,4 z"
                      fill="#C7C7CC"
                    />
                  </marker>
                </defs>
                {resources.map(resource => {
                  if (!resource.managerResourceId) return null;
                  if (hiddenResourceIds.has(resource.id)) return null;
                  if (hiddenResourceIds.has(resource.managerResourceId)) return null;

                  const childPos = livePositions.get(resource.id);
                  const parentPos = livePositions.get(resource.managerResourceId);
                  if (!childPos || !parentPos) return null;

                  const childX = childPos.x - bounds.minX + TOKENS.card.width / 2 + connectionPadding;
                  const childY = childPos.y - bounds.minY + connectionPadding;
                  const parentX = parentPos.x - bounds.minX + TOKENS.card.width / 2 + connectionPadding;
                  const parentY = parentPos.y - bounds.minY + TOKENS.card.height + connectionPadding;

                  const controlPointOffset = Math.abs(childY - parentY) * 0.4;
                  const pathD = `M ${parentX} ${parentY} C ${parentX} ${parentY + controlPointOffset}, ${childX} ${childY - controlPointOffset}, ${childX} ${childY}`;

                  return (
                    <path
                      key={`line-${resource.managerResourceId}-${resource.id}`}
                      d={pathD}
                      fill="none"
                      stroke="#C7C7CC"
                      strokeWidth="2"
                      strokeLinecap="round"
                      markerEnd="url(#hierarchy-arrow)"
                      style={{
                        transition: "d 200ms ease",
                      }}
                    />
                  );
                })}

                {/* User-drawn connections */}
                {storedConnections.map(conn => {
                  const fromPos = allPositionsForConnections.get(conn.fromResourceId);
                  const toPos = allPositionsForConnections.get(conn.toResourceId);
                  if (!fromPos || !toPos) return null;
                  // Only check hiddenResourceIds for resources (not groups)
                  if (hiddenResourceIds.has(conn.fromResourceId) || hiddenResourceIds.has(conn.toResourceId)) return null;

                  // Determine heights based on node type (groups use standard card height)
                  const fromHeight = TOKENS.card.height;
                  const toHeight = TOKENS.card.height;

                  // Calculate optimal anchors if not explicitly set
                  const anchors = conn.fromAnchor && conn.toAnchor
                    ? { fromAnchor: conn.fromAnchor, toAnchor: conn.toAnchor }
                    : calculateOptimalAnchors(fromPos, toPos, fromHeight, toHeight);

                  const pathD = generateConnectionPath(
                    { x: fromPos.x - bounds.minX + connectionPadding, y: fromPos.y - bounds.minY + connectionPadding },
                    { x: toPos.x - bounds.minX + connectionPadding, y: toPos.y - bounds.minY + connectionPadding },
                    anchors.fromAnchor as ConnectionAnchor,
                    anchors.toAnchor as ConnectionAnchor,
                    fromHeight,
                    toHeight
                  );

                  const isSelected = selectedConnectionId === conn.id;
                  const lineColor = conn.lineColor || "#6B7280";
                  const strokeDasharray = conn.lineType === "dashed" ? "8,4" : conn.lineType === "dotted" ? "3,3" : "none";

                  // Calculate label position (midpoint of path)
                  const fromAnchorPt = getAnchorPoint(
                    { x: fromPos.x - bounds.minX + connectionPadding, y: fromPos.y - bounds.minY + connectionPadding },
                    anchors.fromAnchor as ConnectionAnchor,
                    fromHeight
                  );
                  const toAnchorPt = getAnchorPoint(
                    { x: toPos.x - bounds.minX + connectionPadding, y: toPos.y - bounds.minY + connectionPadding },
                    anchors.toAnchor as ConnectionAnchor,
                    toHeight
                  );
                  const labelX = (fromAnchorPt.x + toAnchorPt.x) / 2;
                  const labelY = (fromAnchorPt.y + toAnchorPt.y) / 2;

                  return (
                    <g key={conn.id}>
                      {/* Invisible wider hit area for easier selection */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="16"
                        style={{ cursor: "pointer", pointerEvents: "stroke" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConnectionId(conn.id);
                        }}
                      />
                      {/* Visible connection line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isSelected ? TOKENS.colors.accent.blue : lineColor}
                        strokeWidth={isSelected ? 3 : 2}
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        markerEnd={conn.arrowHead !== "none" && conn.arrowHead !== "start" ? `url(#conn-arrow-${conn.id})` : undefined}
                        markerStart={conn.arrowHead === "start" || conn.arrowHead === "both" ? `url(#conn-arrow-start-${conn.id})` : undefined}
                        style={{
                          transition: "stroke 150ms, stroke-width 150ms",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Arrow markers for this connection */}
                      <defs>
                        <marker
                          id={`conn-arrow-${conn.id}`}
                          markerWidth="8"
                          markerHeight="8"
                          refX="6"
                          refY="4"
                          orient="auto"
                          markerUnits="strokeWidth"
                        >
                          <path d="M0,0 L0,8 L8,4 z" fill={isSelected ? TOKENS.colors.accent.blue : lineColor} />
                        </marker>
                        <marker
                          id={`conn-arrow-start-${conn.id}`}
                          markerWidth="8"
                          markerHeight="8"
                          refX="2"
                          refY="4"
                          orient="auto-start-reverse"
                          markerUnits="strokeWidth"
                        >
                          <path d="M8,0 L8,8 L0,4 z" fill={isSelected ? TOKENS.colors.accent.blue : lineColor} />
                        </marker>
                      </defs>
                      {/* Connection label */}
                      {conn.label && (
                        <g>
                          <rect
                            x={labelX - 40}
                            y={labelY - 10}
                            width="80"
                            height="20"
                            rx="4"
                            fill={TOKENS.colors.bg.primary}
                            stroke={isSelected ? TOKENS.colors.accent.blue : TOKENS.colors.border.default}
                            strokeWidth="1"
                          />
                          <text
                            x={labelX}
                            y={labelY + 4}
                            textAnchor="middle"
                            style={{
                              fontSize: 11,
                              fontFamily: TOKENS.typography.family,
                              fill: TOKENS.colors.text.secondary,
                              pointerEvents: "none",
                            }}
                          >
                            {conn.label.length > 12 ? conn.label.slice(0, 12) + "..." : conn.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Connection preview line while drawing */}
                {isConnectionMode && connectionStart && connectionPreview && (() => {
                  const fromPos = allPositionsForConnections.get(connectionStart.resourceId);
                  if (!fromPos) return null;

                  // Use standard card height for preview line
                  const fromHeight = TOKENS.card.height;

                  const startPt = getAnchorPoint(
                    { x: fromPos.x - bounds.minX + connectionPadding, y: fromPos.y - bounds.minY + connectionPadding },
                    connectionStart.anchor,
                    fromHeight
                  );

                  return (
                    <path
                      d={`M ${startPt.x} ${startPt.y} L ${connectionPreview.x - bounds.minX + connectionPadding} ${connectionPreview.y - bounds.minY + connectionPadding}`}
                      fill="none"
                      stroke={TOKENS.colors.accent.blue}
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      strokeLinecap="round"
                      style={{ pointerEvents: "none" }}
                    />
                  );
                })()}
              </svg>
                );
              })()}

              {/* Render expanded/leads-only group boundaries (behind resource cards) */}
              {Array.from(expandedGroupBounds.entries()).map(([groupId, boundData]) => {
                const { x, y, width, height, group } = boundData;
                const isSelected = selectedGroupId === groupId;
                const memberCount = group.resourceIds.length;
                const visibleCount = group.displayMode === "leads-only"
                  ? (group.visibleResourceIds?.length || 0)
                  : memberCount;

                return (
                  <div
                    key={`group-boundary-${groupId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupId(groupId);
                      setSelectedId(null);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingGroupId(groupId);
                      setShowGroupModal(true);
                    }}
                    style={{
                      position: "absolute",
                      left: x - bounds.minX,
                      top: y - bounds.minY,
                      width,
                      height,
                      borderRadius: 16,
                      border: `2px ${isSelected ? "solid" : "dashed"} ${isSelected ? TOKENS.colors.accent.purple : "rgba(175, 82, 222, 0.4)"}`,
                      backgroundColor: isSelected ? "rgba(175, 82, 222, 0.04)" : "rgba(175, 82, 222, 0.02)",
                      pointerEvents: "all",
                      cursor: "pointer",
                      transition: "all 200ms ease",
                      zIndex: 0,
                    }}
                  >
                    {/* Group Header */}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 12,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pointerEvents: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 10,
                            backgroundColor: TOKENS.colors.accent.purple,
                            fontFamily: TOKENS.typography.family,
                            fontSize: 10,
                            fontWeight: TOKENS.typography.weight.bold,
                            color: TOKENS.colors.text.inverse,
                            letterSpacing: "0.5px",
                          }}
                        >
                          GROUP
                        </span>
                        <span
                          style={{
                            fontFamily: TOKENS.typography.family,
                            fontSize: TOKENS.typography.size.sm,
                            fontWeight: TOKENS.typography.weight.semibold,
                            color: TOKENS.colors.text.primary,
                          }}
                        >
                          {group.name}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          backgroundColor: group.displayMode === "expanded"
                            ? "rgba(52, 199, 89, 0.1)"
                            : "rgba(0, 122, 255, 0.1)",
                          fontFamily: TOKENS.typography.family,
                          fontSize: 10,
                          fontWeight: TOKENS.typography.weight.medium,
                          color: group.displayMode === "expanded"
                            ? TOKENS.colors.accent.green
                            : TOKENS.colors.accent.blue,
                        }}
                      >
                        {group.displayMode === "expanded"
                          ? `${memberCount} members`
                          : `${visibleCount}/${memberCount} visible`}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Render individual resources (excluding hidden ones from collapsed groups) */}
              {resources.map(resource => {
                const position = positions.get(resource.id);
                if (!position) return null;

                // Don't render resources hidden by collapsed groups
                if (hiddenResourceIds.has(resource.id)) {
                  return null;
                }

                return (
                  <OrgNode
                    key={resource.id}
                    resource={resource}
                    position={{ x: position.x - bounds.minX, y: position.y - bounds.minY }}
                    actualPosition={position}
                    isSelected={selectedId === resource.id}
                    isMultiSelected={multiSelectedIds.has(resource.id)}
                    companyLogos={companyLogos}
                    subCompanies={subCompanies}
                    deviceType={deviceType}
                    isDragging={isCardDragging}
                    scale={scale.get()}
                    onSelect={(e: React.MouseEvent) => handleCardSelect(e, resource.id)}
                    onEdit={() => handleEdit(resource.id)}
                    onDelete={() => handleDelete(resource.id)}
                    onPositionChange={handlePositionChange}
                    onMultiPositionChange={handleMultiPositionChange}
                    onDragStart={() => setIsCardDragging(true)}
                    onDragEnd={() => setIsCardDragging(false)}
                    onDragMove={handleDragMove}
                    multiSelectedIds={multiSelectedIds}
                    getPositionForId={getPositionForId}
                    isConnectionMode={isConnectionMode}
                    isConnectionSource={connectionStart?.resourceId === resource.id}
                    onAnchorClick={handleAnchorClick}
                  />
                );
              })}

              {/* Render collapsed group cards */}
              {collapsedGroups.map(group => {
                const position = groupPositions.get(group.id);
                if (!position) return null;

                const members = resources.filter(r => group.resourceIds.includes(r.id));

                return (
                  <GroupNode
                    key={`group-${group.id}`}
                    group={group}
                    members={members}
                    position={{ x: position.x - bounds.minX, y: position.y - bounds.minY }}
                    actualPosition={position}
                    isSelected={selectedGroupId === group.id}
                    companyLogos={companyLogos}
                    subCompanies={subCompanies}
                    deviceType={deviceType}
                    isDragging={isCardDragging}
                    scale={scale.get()}
                    onSelect={() => { setSelectedGroupId(group.id); setSelectedId(null); }}
                    onEdit={() => {
                      setEditingGroupId(group.id);
                      setShowGroupModal(true);
                    }}
                    onDelete={async () => {
                      if (!window.confirm(`Delete group "${group.name}"? Resources will not be deleted.`)) return;
                      await deleteResourceGroup(group.id);
                      setSelectedGroupId(null);
                    }}
                    onPositionChange={handleGroupPositionChange}
                    onDragStart={() => setIsCardDragging(true)}
                    onDragEnd={() => setIsCardDragging(false)}
                    isConnectionMode={isConnectionMode}
                    isConnectionSource={connectionStart?.resourceId === group.id}
                    onAnchorClick={handleAnchorClick}
                  />
                );
              })}
            </motion.div>

            {/* Minimap */}
            <Minimap
              bounds={bounds}
              positions={positions}
              viewportRect={viewportRect}
              onNavigate={handleNavigate}
            />

            {/* Bottom toolbar with hints and controls */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Multi-select indicator */}
              {multiSelectedIds.size > 1 && (
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: TOKENS.colors.accent.purple,
                    color: "#fff",
                    fontFamily: TOKENS.typography.family,
                    fontSize: 11,
                    fontWeight: TOKENS.typography.weight.semibold,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{multiSelectedIds.size} cards selected</span>
                  <button
                    onClick={() => setMultiSelectedIds(new Set())}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: "0 4px",
                      fontSize: 14,
                      lineHeight: 1,
                      opacity: 0.8,
                    }}
                    title="Clear selection"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Connection mode hint */}
              {isConnectionMode && (
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: TOKENS.colors.accent.green,
                    color: "#fff",
                    fontFamily: TOKENS.typography.family,
                    fontSize: 11,
                    fontWeight: TOKENS.typography.weight.semibold,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Click anchor points on cards to draw connections</span>
                  <button
                    onClick={handleCancelConnection}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: 4,
                      color: "#fff",
                      cursor: "pointer",
                      padding: "2px 8px",
                      fontSize: 10,
                    }}
                  >
                    Cancel (Esc)
                  </button>
                </div>
              )}

              {/* Selected connection editor */}
              {selectedConnectionId && !isConnectionMode && (() => {
                const conn = storedConnections.find(c => c.id === selectedConnectionId);
                if (!conn) return null;
                // Look up both resources and groups for connection endpoints
                const fromResource = resources.find(r => r.id === conn.fromResourceId);
                const fromGroup = groups.find(g => g.id === conn.fromResourceId);
                const toResource = resources.find(r => r.id === conn.toResourceId);
                const toGroup = groups.find(g => g.id === conn.toResourceId);
                const fromName = fromResource?.name || fromGroup?.name || "?";
                const toName = toResource?.name || toGroup?.name || "?";
                const isMobileDevice = deviceType === "mobile";

                return (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      padding: isMobileDevice ? "10px 12px" : "8px 12px",
                      borderRadius: 8,
                      backgroundColor: TOKENS.colors.bg.primary,
                      border: `1px solid ${TOKENS.colors.accent.blue}`,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      fontFamily: TOKENS.typography.family,
                      fontSize: 11,
                      display: "flex",
                      flexDirection: isMobileDevice ? "column" : "row",
                      alignItems: isMobileDevice ? "stretch" : "center",
                      gap: isMobileDevice ? 8 : 12,
                      maxWidth: isMobileDevice ? "90vw" : "none",
                    }}
                  >
                    {/* Header row with connection name and close button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: isMobileDevice ? "100%" : "auto" }}>
                      <span style={{ color: TOKENS.colors.text.secondary, fontWeight: 500 }}>
                        {fromName} → {toName}
                      </span>
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedConnectionId(null)}
                        style={{
                          background: "none",
                          border: "none",
                          color: TOKENS.colors.text.tertiary,
                          cursor: "pointer",
                          fontSize: 16,
                          lineHeight: 1,
                          padding: "0 4px",
                          marginLeft: 8,
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Controls row */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      {/* Line type selector */}
                      <select
                        value={conn.lineType}
                        onChange={(e) => handleUpdateConnection(conn.id, { lineType: e.target.value as "solid" | "dashed" | "dotted" })}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: `1px solid ${TOKENS.colors.border.default}`,
                          backgroundColor: TOKENS.colors.bg.primary,
                          fontSize: 11,
                          fontFamily: TOKENS.typography.family,
                          cursor: "pointer",
                          flex: isMobileDevice ? "1 1 45%" : "0 0 auto",
                        }}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>

                      {/* Arrow direction */}
                      <select
                        value={conn.arrowHead || "end"}
                        onChange={(e) => handleUpdateConnection(conn.id, { arrowHead: e.target.value as "none" | "end" | "start" | "both" })}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: `1px solid ${TOKENS.colors.border.default}`,
                          backgroundColor: TOKENS.colors.bg.primary,
                          fontSize: 11,
                          fontFamily: TOKENS.typography.family,
                          cursor: "pointer",
                          flex: isMobileDevice ? "1 1 45%" : "0 0 auto",
                        }}
                      >
                        <option value="none">No Arrow</option>
                        <option value="end">Arrow →</option>
                        <option value="start">Arrow ←</option>
                        <option value="both">Both ↔</option>
                      </select>

                      {/* Label input */}
                      <input
                        type="text"
                        placeholder="Label..."
                        value={conn.label || ""}
                        onChange={(e) => handleUpdateConnection(conn.id, { label: e.target.value || undefined })}
                        style={{
                          width: isMobileDevice ? "100%" : 80,
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: `1px solid ${TOKENS.colors.border.default}`,
                          backgroundColor: TOKENS.colors.bg.primary,
                          fontSize: 11,
                          fontFamily: TOKENS.typography.family,
                          flex: isMobileDevice ? "1 1 100%" : "0 0 auto",
                        }}
                      />

                      {/* Color and Delete row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: isMobileDevice ? "1 1 100%" : "0 0 auto", justifyContent: isMobileDevice ? "space-between" : "flex-start" }}>
                        {/* Color picker */}
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: TOKENS.colors.text.tertiary }}>Color:</span>
                          <input
                            type="color"
                            value={conn.lineColor || "#6B7280"}
                            onChange={(e) => handleUpdateConnection(conn.id, { lineColor: e.target.value })}
                            style={{
                              width: 24,
                              height: 24,
                              padding: 0,
                              border: `1px solid ${TOKENS.colors.border.default}`,
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            title="Line color"
                          />
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteConnection(conn.id)}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 4,
                            border: "none",
                            backgroundColor: TOKENS.colors.accent.red,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Hint text */}
              {!isConnectionMode && !selectedConnectionId && (
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    fontFamily: TOKENS.typography.family,
                    fontSize: 11,
                    fontWeight: TOKENS.typography.weight.medium,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    pointerEvents: "none",
                    opacity: 0.8,
                  }}
                >
                  <span>Scroll to zoom</span>
                  <span>Drag cards to move</span>
                  <span>Ctrl+Click to multi-select</span>
                </div>
              )}

              {/* Auto-arrange button */}
              <button
                onClick={handleAutoArrange}
                title={
                  hasConnections
                    ? "Arrange with wider gaps for connection lines"
                    : "Arrange by category and designation"
                }
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${TOKENS.colors.border.default}`,
                  backgroundColor: TOKENS.colors.bg.primary,
                  color: TOKENS.colors.text.primary,
                  fontFamily: TOKENS.typography.family,
                  fontSize: 11,
                  fontWeight: TOKENS.typography.weight.medium,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Auto-arrange{hasConnections ? " (Wide)" : ""}
              </button>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Mobile Resource Drawer */}
      <AnimatePresence>
        {showMobileDrawer && deviceType === "mobile" && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDrawer(false)}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 200,
              }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "85%",
                maxWidth: 360,
                backgroundColor: TOKENS.colors.bg.primary,
                boxShadow: "4px 0 24px rgba(0, 0, 0, 0.15)",
                zIndex: 201,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${TOKENS.colors.border.default}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  style={{
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.lg,
                    fontWeight: TOKENS.typography.weight.semibold,
                    color: TOKENS.colors.text.primary,
                    margin: 0,
                  }}
                >
                  Resources
                </h3>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  aria-label="Close drawer"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: TOKENS.colors.bg.secondary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke={TOKENS.colors.text.secondary} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* View Toggle */}
              <div style={{ padding: "12px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    padding: 4,
                    backgroundColor: TOKENS.colors.bg.secondary,
                    borderRadius: 8,
                  }}
                >
                  <button
                    onClick={() => setListViewMode("resources")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: listViewMode === "resources" ? TOKENS.colors.bg.primary : "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: listViewMode === "resources" ? TOKENS.typography.weight.semibold : TOKENS.typography.weight.medium,
                      color: listViewMode === "resources" ? TOKENS.colors.text.primary : TOKENS.colors.text.secondary,
                      cursor: "pointer",
                      boxShadow: listViewMode === "resources" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    Resources ({resources.length})
                  </button>
                  <button
                    onClick={() => setListViewMode("groups")}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: listViewMode === "groups" ? TOKENS.colors.bg.primary : "transparent",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.sm,
                      fontWeight: listViewMode === "groups" ? TOKENS.typography.weight.semibold : TOKENS.typography.weight.medium,
                      color: listViewMode === "groups" ? TOKENS.colors.text.primary : TOKENS.colors.text.secondary,
                      cursor: "pointer",
                      boxShadow: listViewMode === "groups" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    Groups ({groups.length})
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ padding: "0 20px 12px" }}>
                <input
                  type="text"
                  placeholder={listViewMode === "resources" ? "Search resources..." : "Search groups..."}
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${TOKENS.colors.border.default}`,
                    backgroundColor: TOKENS.colors.bg.secondary,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.md,
                    outline: "none",
                  }}
                />
              </div>

              {/* Resource List */}
              <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
                {filteredResources.map(resource => (
                  <div
                    key={resource.id}
                    onClick={() => {
                      setSelectedId(resource.id);
                      setShowMobileDrawer(false);
                    }}
                    style={{
                      padding: "14px 16px",
                      marginBottom: 8,
                      borderRadius: 10,
                      backgroundColor: selectedId === resource.id ? "rgba(0, 122, 255, 0.08)" : TOKENS.colors.bg.secondary,
                      border: `1px solid ${selectedId === resource.id ? TOKENS.colors.accent.blue : TOKENS.colors.border.subtle}`,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.md,
                        fontWeight: TOKENS.typography.weight.semibold,
                        color: TOKENS.colors.text.primary,
                        marginBottom: 4,
                      }}
                    >
                      {resource.name}
                    </div>
                    <div
                      style={{
                        fontFamily: TOKENS.typography.family,
                        fontSize: TOKENS.typography.size.sm,
                        color: TOKENS.colors.text.secondary,
                      }}
                    >
                      {RESOURCE_DESIGNATIONS[resource.designation]?.label || resource.designation}
                    </div>
                  </div>
                ))}
                {filteredResources.length === 0 && (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      fontFamily: TOKENS.typography.family,
                      fontSize: TOKENS.typography.size.md,
                      color: TOKENS.colors.text.tertiary,
                    }}
                  >
                    No resources found
                  </div>
                )}
              </div>

              {/* Add Button */}
              <div style={{ padding: "16px 20px", borderTop: `1px solid ${TOKENS.colors.border.default}` }}>
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    handleAdd(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: TOKENS.colors.accent.blue,
                    fontFamily: TOKENS.typography.family,
                    fontSize: TOKENS.typography.size.md,
                    fontWeight: TOKENS.typography.weight.semibold,
                    color: TOKENS.colors.text.inverse,
                    cursor: "pointer",
                  }}
                >
                  Add Resource
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleAdd(null)}
        aria-label="Add resource"
        style={{
          position: "absolute",
          bottom: deviceType === "mobile" ? 24 : 32,
          right: deviceType === "mobile" ? 24 : 32,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          backgroundColor: TOKENS.colors.accent.blue,
          color: TOKENS.colors.text.inverse,
          fontSize: 28,
          fontWeight: 300,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0, 122, 255, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        +
      </motion.button>

      {/* Resource Edit Modal */}
      <ResourceEditModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        resourceId={editingResourceId}
        defaultManagerId={defaultManagerId}
        mode={editModalMode}
        onOpenLogoLibrary={onOpenLogoLibrary}
        showAdvancedOptions={hasFinancialAccess}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedResourceIds={checkedResourceIds}
        resources={resources}
        companyLogos={companyLogos}
        subCompanies={subCompanies}
        onBulkUpdate={handleBulkUpdate}
        onOpenLogoLibrary={onOpenLogoLibrary}
      />

      {/* Group Edit Modal */}
      <GroupEditModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroupId(null);
        }}
        group={editingGroupId ? groups.find(g => g.id === editingGroupId) || null : null}
        resources={resources}
        allGroups={groups}
        onSave={async (group) => {
          if (editingGroupId) {
            await updateResourceGroup(editingGroupId, group);
          } else {
            await addResourceGroup(group);
          }
        }}
        onDelete={deleteResourceGroup}
      />
    </div>
  );

  // Modal or full-page rendering
  if (isFullPage) {
    return <div style={{ height: "100vh" }}>{content}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: TOKENS.colors.bg.overlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: deviceType === "mobile" ? 0 : 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={TOKENS.spring.default}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: deviceType === "mobile" ? "100%" : "95%",
          maxWidth: 1600,
          height: deviceType === "mobile" ? "100%" : "90vh",
          borderRadius: deviceType === "mobile" ? 0 : 20,
          overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.25)",
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

export default OrgChartPro;

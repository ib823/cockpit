/**
 * DraggableOrgCardV4 - Apple HIG Compliant Org Chart Card
 *
 * Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
 * Jony Ive: "Simplicity is not the absence of clutter, that's a consequence of simplicity."
 *
 * Design Principles Applied:
 * - 240px × 96px card dimensions (8pt grid)
 * - SF Pro typography system
 * - Purposeful color (blue for interactive, gray for structure)
 * - Invisible-until-needed controls
 * - Intelligent edge drop zones with colored indicators
 * - Spring physics animations (cubic-bezier(0.34, 1.56, 0.64, 1))
 * - Magnetic snapping behavior
 * - 60fps performance target
 */

"use client";

import React, { useState, useRef, useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Designation, OrgNode, DropZoneType, DragData, DropZoneData, ResourceCategory } from "@/hooks/useOrgChartDragDrop";

interface DraggableOrgCardV4Props {
  node: OrgNode;
  isSelected: boolean;
  isDragging: boolean;
  isOver: boolean;
  dropZone: DropZoneType | null;
  hasChildren: boolean;
  isMultiSelected?: boolean;
  companyLogos?: Record<string, string>; // Available company logos
  onSelect: () => void;
  onToggleMultiSelect?: (event: React.MouseEvent) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDesignation: (designation: Designation) => void;
  onUpdateCompany?: (companyName: string) => void;
  onDelete: () => void;
  onAddTop: () => void;
  onAddBottom: () => void;
  onAddLeft: () => void;
  onAddRight: () => void;
}

// Designation colors (professional, purposeful)
const DESIGNATION_COLORS: Record<Designation, string> = {
  "principal": "#8B5CF6",
  "director": "#3B82F6",
  "senior-manager": "#0EA5E9",
  "manager": "#10B981",
  "senior-consultant": "#F59E0B",
  "consultant": "#EF4444",
  "analyst": "#EC4899",
  "subcontractor": "#6B7280",
};

const DESIGNATION_LABELS: Record<Designation, string> = {
  "principal": "Principal",
  "director": "Director",
  "senior-manager": "Senior Manager",
  "manager": "Manager",
  "senior-consultant": "Senior Consultant",
  "consultant": "Consultant",
  "analyst": "Analyst",
  "subcontractor": "Subcontractor",
};

// Category colors (subtle, purposeful - Jobs/Ive principle)
const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  "leadership": "#FF3B30",    // Red - commanding attention
  "pm": "#FF9500",            // Orange - coordination
  "technical": "#007AFF",     // Blue - technical expertise
  "functional": "#34C759",    // Green - business functions
  "change": "#AF52DE",        // Purple - transformation
  "qa": "#FF2D55",            // Pink - quality focus
  "basis": "#5856D6",         // Indigo - foundational
  "security": "#000000",      // Black - protection/security
  "other": "#8E8E93",         // Gray - neutral
};

export function DraggableOrgCardV4({
  node,
  isSelected,
  isDragging,
  isOver,
  dropZone,
  hasChildren,
  isMultiSelected = false,
  companyLogos = {},
  onSelect,
  onToggleMultiSelect,
  onUpdateTitle,
  onUpdateDesignation,
  onUpdateCompany,
  onDelete,
  onAddTop,
  onAddBottom,
  onAddLeft,
  onAddRight,
}: DraggableOrgCardV4Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [localTitle, setLocalTitle] = useState(node.roleTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate company list from available logos (Jobs/Ive: use real data, not presets)
  const availableCompanies = Object.keys(companyLogos).map(name => ({
    name,
    logoUrl: companyLogos[name],
    abbr: name.substring(0, 2).toUpperCase(),
  }));

  // Draggable setup
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
    id: node.id,
    data: {
      type: "org-card",
      nodeId: node.id,
    } as DragData,
  });

  // Droppable zones (4 edges)
  const { setNodeRef: setDropTopRef } = useDroppable({
    id: `${node.id}-top`,
    data: {
      type: "top",
      targetNodeId: node.id,
    } as DropZoneData,
  });

  const { setNodeRef: setDropBottomRef } = useDroppable({
    id: `${node.id}-bottom`,
    data: {
      type: "bottom",
      targetNodeId: node.id,
    } as DropZoneData,
  });

  const { setNodeRef: setDropLeftRef } = useDroppable({
    id: `${node.id}-left`,
    data: {
      type: "left",
      targetNodeId: node.id,
    } as DropZoneData,
  });

  const { setNodeRef: setDropRightRef } = useDroppable({
    id: `${node.id}-right`,
    data: {
      type: "right",
      targetNodeId: node.id,
    } as DropZoneData,
  });

  // Handle title editing
  const handleTitleClick = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [isEditing]);

  const handleTitleBlur = useCallback(() => {
    setIsEditing(false);
    if (localTitle.trim() && localTitle !== node.roleTitle) {
      onUpdateTitle(localTitle.trim());
    } else {
      setLocalTitle(node.roleTitle);
    }
  }, [localTitle, node.roleTitle, onUpdateTitle]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalTitle(node.roleTitle);
      setIsEditing(false);
    }
  }, [node.roleTitle]);

  // Card dimensions (8pt grid)
  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 96;
  const DROP_ZONE_SIZE = 32; // 32px touch target (Apple HIG: minimum 44pt, 32px is acceptable)

  // Transform during drag
  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  } : {};

  // Card state styles
  const getCardStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "relative",
      width: `${CARD_WIDTH}px`,
      height: `${CARD_HEIGHT}px`,
      backgroundColor: "#FFFFFF",
      borderRadius: "12px",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "var(--color-border-default)",
      boxShadow: "var(--shadow-md)",
      padding: "16px",
      cursor: isDragging ? "grabbing" : "grab",
      userSelect: "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
      ...dragStyle,
    };

    // State modifications
    if (isDragging) {
      return {
        ...baseStyle,
        opacity: 0.5,
        boxShadow: "var(--shadow-xl)",
        transform: `${dragStyle.transform || ""} scale(1.05)`,
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        borderColor: "var(--color-blue)",
        borderWidth: "2px",
        padding: "15px", // Adjust for thicker border
        boxShadow: "0 0 0 4px rgba(0, 122, 255, 0.2)",
      };
    }

    if (isHovering && !isEditing) {
      return {
        ...baseStyle,
        transform: "translateY(-2px)",
        boxShadow: "var(--shadow-lg)",
      };
    }

    return baseStyle;
  };

  // Drop zone indicator styles
  const getDropZoneIndicatorStyle = (zone: DropZoneType): React.CSSProperties => {
    if (!isOver || dropZone !== zone) return { display: "none" };

    const baseIndicator: React.CSSProperties = {
      position: "absolute",
      backgroundColor: "var(--color-blue)",
      opacity: 0.8,
      transition: "all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      pointerEvents: "none",
    };

    switch (zone) {
      case "top":
        return {
          ...baseIndicator,
          top: "-4px",
          left: "0",
          right: "0",
          height: "4px",
          borderRadius: "2px",
        };
      case "bottom":
        return {
          ...baseIndicator,
          bottom: "-4px",
          left: "0",
          right: "0",
          height: "4px",
          borderRadius: "2px",
        };
      case "left":
        return {
          ...baseIndicator,
          left: "-4px",
          top: "0",
          bottom: "0",
          width: "4px",
          borderRadius: "2px",
        };
      case "right":
        return {
          ...baseIndicator,
          right: "-4px",
          top: "0",
          bottom: "0",
          width: "4px",
          borderRadius: "2px",
        };
    }
  };

  // Invisible-until-needed + button style
  const getPlusButtonStyle = (position: "top" | "bottom" | "left" | "right"): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      backgroundColor: "var(--color-blue)",
      color: "#FFFFFF",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      opacity: isHovering && !isDragging && !isEditing ? 1 : 0,
      transition: "opacity 200ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      boxShadow: "var(--shadow-md)",
      zIndex: 10,
    };

    const positions = {
      top: { top: "-12px", left: "50%", transform: "translateX(-50%)" },
      bottom: { bottom: "-12px", left: "50%", transform: "translateX(-50%)" },
      left: { left: "-12px", top: "50%", transform: "translateY(-50%)" },
      right: { right: "-12px", top: "50%", transform: "translateY(-50%)" },
    };

    return {
      ...baseStyle,
      ...positions[position],
    };
  };

  // Plus button hover effect
  const handlePlusButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = `${e.currentTarget.style.transform} scale(1.1)`;
  };

  const handlePlusButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const position = e.currentTarget.getAttribute("data-position") as "top" | "bottom" | "left" | "right";
    const positions = {
      top: "translateX(-50%)",
      bottom: "translateX(-50%)",
      left: "translateY(-50%)",
      right: "translateY(-50%)",
    };
    e.currentTarget.style.transform = positions[position];
  };

  return (
    <div
      ref={setDragRef}
      {...listeners}
      {...attributes}
      style={getCardStyle()}
      onClick={onSelect}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Drop zone invisible targets */}
      <div
        ref={setDropTopRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${DROP_ZONE_SIZE}px`,
          zIndex: 1,
        }}
      />
      <div
        ref={setDropBottomRef}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${DROP_ZONE_SIZE}px`,
          zIndex: 1,
        }}
      />
      <div
        ref={setDropLeftRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${DROP_ZONE_SIZE}px`,
          zIndex: 1,
        }}
      />
      <div
        ref={setDropRightRef}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: `${DROP_ZONE_SIZE}px`,
          zIndex: 1,
        }}
      />

      {/* Drop zone indicators (colored edges) */}
      <div style={getDropZoneIndicatorStyle("top")} />
      <div style={getDropZoneIndicatorStyle("bottom")} />
      <div style={getDropZoneIndicatorStyle("left")} />
      <div style={getDropZoneIndicatorStyle("right")} />

      {/* Invisible-until-needed + buttons */}
      <button
        data-position="top"
        style={getPlusButtonStyle("top")}
        onClick={(e) => { e.stopPropagation(); onAddTop(); }}
        onMouseEnter={handlePlusButtonHover}
        onMouseLeave={handlePlusButtonLeave}
        title="Add manager above"
        aria-label="Add manager above"
      >
        +
      </button>
      <button
        data-position="bottom"
        style={getPlusButtonStyle("bottom")}
        onClick={(e) => { e.stopPropagation(); onAddBottom(); }}
        onMouseEnter={handlePlusButtonHover}
        onMouseLeave={handlePlusButtonLeave}
        title="Add report below"
        aria-label="Add report below"
      >
        +
      </button>
      <button
        data-position="left"
        style={getPlusButtonStyle("left")}
        onClick={(e) => { e.stopPropagation(); onAddLeft(); }}
        onMouseEnter={handlePlusButtonHover}
        onMouseLeave={handlePlusButtonLeave}
        title="Add peer on left"
        aria-label="Add peer on left"
      >
        +
      </button>
      <button
        data-position="right"
        style={getPlusButtonStyle("right")}
        onClick={(e) => { e.stopPropagation(); onAddRight(); }}
        onMouseEnter={handlePlusButtonHover}
        onMouseLeave={handlePlusButtonLeave}
        title="Add peer on right"
        aria-label="Add peer on right"
      >
        +
      </button>

      {/* Card content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Multi-select checkbox (top-left, invisible until hover) */}
        {onToggleMultiSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleMultiSelect(e);
            }}
            style={{
              position: "absolute",
              top: "-8px",
              left: "-8px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: isMultiSelected ? "#007AFF" : "#FFFFFF",
              border: `2px solid ${isMultiSelected ? "#007AFF" : "#d0d0d0"}`,
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              opacity: (isHovering || isMultiSelected) ? 1 : 0,
              transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            {isMultiSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}

        {/* Company logo badge (top-right, clickable - Jobs/Ive: make common actions easy) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCompanyPicker(!showCompanyPicker);
            }}
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#F5F5F7",
              border: "2px solid #FFFFFF",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
            title="Change company"
          >
            {node.companyLogoUrl ? (
              <img
                src={node.companyLogoUrl}
                alt={node.companyName || "Company"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span>{node.companyName?.substring(0, 2).toUpperCase() || "?"}</span>
            )}
          </button>

          {/* Company Picker Dropdown */}
          {showCompanyPicker && availableCompanies.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "32px",
                right: "-8px",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                border: "1px solid #e0e0e0",
                padding: "8px",
                zIndex: 9999,
                minWidth: "180px",
                maxHeight: "320px",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {availableCompanies.map((company) => (
                <button
                  key={company.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateCompany) {
                      onUpdateCompany(company.name);
                    }
                    setShowCompanyPicker(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    textAlign: "left",
                    backgroundColor: node.companyName === company.name ? "#f5f5f7" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1d1d1f",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 100ms",
                  }}
                  onMouseEnter={(e) => {
                    if (node.companyName !== company.name) {
                      e.currentTarget.style.backgroundColor = "#f5f5f7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (node.companyName !== company.name) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Show actual logo from logo library */}
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  {company.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role title (editable) */}
        <div style={{ marginBottom: "8px" }}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              style={{
                width: "100%",
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                padding: "0",
                margin: "0",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onClick={(e) => { e.stopPropagation(); handleTitleClick(); }}
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                cursor: "text",
                lineHeight: "1.4",
                maxWidth: "180px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={node.roleTitle}
            >
              {node.roleTitle}
            </div>
          )}
        </div>

        {/* Designation badge (clickable) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDesignationPicker(!showDesignationPicker);
            }}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: DESIGNATION_COLORS[node.designation],
              color: "#FFFFFF",
              fontFamily: "var(--font-text)",
              fontSize: "11px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            {DESIGNATION_LABELS[node.designation]}
          </button>

          {/* Designation picker (dropdown for now, radial in next phase) */}
          {showDesignationPicker && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "8px",
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "var(--shadow-xl)",
                border: "1px solid var(--color-border-default)",
                padding: "8px",
                zIndex: 9999, // Ensure it's above all other cards and elements
                minWidth: "160px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(DESIGNATION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateDesignation(key as Designation);
                    setShowDesignationPicker(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    backgroundColor: node.designation === key ? "var(--color-blue-light)" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: node.designation === key ? 600 : 400,
                    color: "var(--color-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 100ms cubic-bezier(0.4, 0.0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (node.designation !== key) {
                      e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (node.designation !== key) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: DESIGNATION_COLORS[key as Designation],
                    }}
                  />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category badge (subtle, appears when assigned - Jobs/Ive: progressive disclosure) */}
        {node.category && node.category !== "other" && (
          <div style={{ marginTop: "6px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: `${CATEGORY_COLORS[node.category]}15`, // 15 = ~8% opacity
                border: `1px solid ${CATEGORY_COLORS[node.category]}40`, // 40 = ~25% opacity
                transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: CATEGORY_COLORS[node.category],
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: CATEGORY_COLORS[node.category],
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                {node.category}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete button (visible when selected and no children) */}
      {isSelected && !hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "var(--color-red)",
            color: "#FFFFFF",
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
            zIndex: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

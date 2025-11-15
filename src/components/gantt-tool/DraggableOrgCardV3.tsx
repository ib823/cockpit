/**
 * Draggable Org Card V3 - Professional Design
 *
 * Features:
 * - Edge-based drop zones (top/bottom/left/right)
 * - Hover-triggered + buttons on all 4 edges
 * - Designation levels instead of company tags
 * - Company logo badges (circular)
 * - Clean, professional design (no emojis)
 */

"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { OrgNode, DropZoneType, Designation } from "@/hooks/useOrgChartDragDrop";
import { Trash2, GripVertical } from "lucide-react";
import { useState } from "react";

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

const DESIGNATION_COLORS: Record<Designation, string> = {
  "principal": "#8B5CF6", // Purple
  "director": "#3B82F6", // Blue
  "senior-manager": "#0EA5E9", // Sky
  "manager": "#10B981", // Green
  "senior-consultant": "#F59E0B", // Amber
  "consultant": "#EF4444", // Red
  "analyst": "#EC4899", // Pink
  "subcontractor": "#6B7280", // Gray
};

interface DraggableOrgCardV3Props {
  node: OrgNode;
  isSelected: boolean;
  isEditing: boolean;
  editingTitle: string;
  editingDesignation: Designation;
  isDragging: boolean;
  isDropTarget: boolean;
  activeDropZone: DropZoneType | null;
  hierarchyLevel: number;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDesignation: (designation: Designation) => void;
  onAddTop: () => void;
  onAddBottom: () => void;
  onAddLeft: () => void;
  onAddRight: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function DraggableOrgCardV3({
  node,
  isSelected,
  isEditing,
  editingTitle,
  editingDesignation,
  isDragging,
  isDropTarget,
  activeDropZone,
  hierarchyLevel,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onUpdateTitle,
  onUpdateDesignation,
  onAddTop,
  onAddBottom,
  onAddLeft,
  onAddRight,
  onDelete,
  canDelete,
}: DraggableOrgCardV3Props) {
  const [isHovering, setIsHovering] = useState(false);
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);

  // Calculate scale based on hierarchy level
  const scale = hierarchyLevel === 0 ? 1.1 : hierarchyLevel === 1 ? 1.05 : 1;
  const baseWidth = 220;
  const baseHeight = 110;

  // Draggable setup
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
    id: node.id,
    data: {
      type: "org-card",
      nodeId: node.id,
      currentParent: node.reportsTo,
    },
  });

  // Drop zones for all 4 edges
  const { setNodeRef: setTopDropRef, isOver: isOverTop } = useDroppable({
    id: `${node.id}-drop-top`,
    data: { type: "top" as DropZoneType, targetNodeId: node.id },
    disabled: isDragging,
  });

  const { setNodeRef: setBottomDropRef, isOver: isOverBottom } = useDroppable({
    id: `${node.id}-drop-bottom`,
    data: { type: "bottom" as DropZoneType, targetNodeId: node.id },
    disabled: isDragging,
  });

  const { setNodeRef: setLeftDropRef, isOver: isOverLeft } = useDroppable({
    id: `${node.id}-drop-left`,
    data: { type: "left" as DropZoneType, targetNodeId: node.id },
    disabled: isDragging,
  });

  const { setNodeRef: setRightDropRef, isOver: isOverRight } = useDroppable({
    id: `${node.id}-drop-right`,
    data: { type: "right" as DropZoneType, targetNodeId: node.id },
    disabled: isDragging,
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    opacity: isCurrentlyDragging ? 0.5 : 1,
  };

  const designationColor = DESIGNATION_COLORS[node.designation];

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top Drop Zone */}
      <div
        ref={setTopDropRef}
        style={{
          position: "absolute",
          top: `-12px`,
          left: "0",
          right: "0",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: (isOverTop || activeDropZone === "top") && isDropTarget ? 1 : 0,
          transition: "opacity 0.2s",
          zIndex: 2,
        }}
      >
        {(isOverTop || (activeDropZone === "top" && isDropTarget)) && (
          <div
            style={{
              fontSize: "10px",
              color: "#007AFF",
              fontWeight: 600,
              backgroundColor: "#E8F4FF",
              padding: "3px 10px",
              borderRadius: "4px",
              border: "1px solid #007AFF",
            }}
          >
            Add as Manager
          </div>
        )}
      </div>

      {/* Left Drop Zone */}
      <div
        ref={setLeftDropRef}
        style={{
          position: "absolute",
          left: `-12px`,
          top: "0",
          bottom: "0",
          width: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: (isOverLeft || activeDropZone === "left") && isDropTarget ? 1 : 0,
          transition: "opacity 0.2s",
          zIndex: 2,
        }}
      >
        {(isOverLeft || (activeDropZone === "left" && isDropTarget)) && (
          <div
            style={{
              fontSize: "10px",
              color: "#FF9500",
              fontWeight: 600,
              backgroundColor: "#FFF4E5",
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid #FF9500",
              transform: "rotate(-90deg)",
              whiteSpace: "nowrap",
            }}
          >
            Same Level
          </div>
        )}
      </div>

      {/* Right Drop Zone */}
      <div
        ref={setRightDropRef}
        style={{
          position: "absolute",
          right: `-12px`,
          top: "0",
          bottom: "0",
          width: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: (isOverRight || activeDropZone === "right") && isDropTarget ? 1 : 0,
          transition: "opacity 0.2s",
          zIndex: 2,
        }}
      >
        {(isOverRight || (activeDropZone === "right" && isDropTarget)) && (
          <div
            style={{
              fontSize: "10px",
              color: "#FF9500",
              fontWeight: 600,
              backgroundColor: "#FFF4E5",
              padding: "3px 8px",
              borderRadius: "4px",
              border: "1px solid #FF9500",
              transform: "rotate(90deg)",
              whiteSpace: "nowrap",
            }}
          >
            Same Level
          </div>
        )}
      </div>

      {/* Main Card */}
      <div
        ref={setDragRef}
        onClick={onSelect}
        style={{
          ...dragStyle,
          position: "relative",
          width: `${baseWidth * scale}px`,
          minHeight: `${baseHeight * scale}px`,
          backgroundColor: isSelected ? "#F9FAFB" : "#FFFFFF",
          border: `2px solid ${isSelected ? designationColor : "#E5E7EB"}`,
          borderRadius: "8px",
          padding: "16px",
          cursor: isCurrentlyDragging ? "grabbing" : "pointer",
          boxShadow: isSelected
            ? `0 4px 12px rgba(0,0,0,0.08)`
            : isCurrentlyDragging
            ? "0 8px 24px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.04)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            cursor: "grab",
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          className="drag-handle"
        >
          <GripVertical className="w-4 h-4" style={{ color: "#9CA3AF" }} />
        </div>

        {/* Company Logo Badge */}
        <div
          style={{
            position: "absolute",
            top: "-12px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#F3F4F6",
            border: "2px solid #FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          {node.companyLogoUrl ? (
            <img
              src={node.companyLogoUrl}
              alt={node.companyName || "Company"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ fontSize: "10px", color: "#6B7280", fontWeight: 600 }}>
              {node.companyName?.charAt(0) || "?"}
            </div>
          )}
        </div>

        {/* Role Title */}
        <div style={{ marginTop: "4px", marginBottom: "8px" }}>
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => onUpdateTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onSaveEdit();
              }}
              autoFocus
              placeholder="Role title"
              style={{
                width: "100%",
                fontSize: "14px",
                fontWeight: 600,
                border: "1px solid #3B82F6",
                borderRadius: "4px",
                padding: "6px 8px",
                outline: "none",
              }}
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              style={{
                fontSize: `${14 * scale}px`,
                fontWeight: 600,
                color: "#111827",
                cursor: "text",
                minHeight: "20px",
              }}
            >
              {node.roleTitle}
            </div>
          )}
        </div>

        {/* Designation Badge */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing) setShowDesignationPicker(!showDesignationPicker);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: designationColor + "15",
            color: designationColor,
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: "4px",
            cursor: isEditing ? "default" : "pointer",
            border: `1px solid ${designationColor}30`,
          }}
        >
          {DESIGNATION_LABELS[node.designation]}
        </div>

        {/* Designation Picker */}
        {showDesignationPicker && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: "16px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 10,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {(Object.keys(DESIGNATION_LABELS) as Designation[]).map((designation) => (
              <button
                key={designation}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateDesignation(designation);
                  setShowDesignationPicker(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  width: "100%",
                  backgroundColor: node.designation === designation ? "#F3F4F6" : "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: node.designation === designation ? 600 : 400,
                  color: "#111827",
                  textAlign: "left",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (node.designation !== designation) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (node.designation !== designation) {
                    e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    backgroundColor: DESIGNATION_COLORS[designation],
                  }}
                />
                {DESIGNATION_LABELS[designation]}
              </button>
            ))}
          </div>
        )}

        {/* Delete Button (always visible when card is selected) */}
        {isSelected && canDelete && !isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "4px",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Delete role"
          >
            <Trash2 className="w-3 h-3" style={{ color: "#DC2626" }} />
          </button>
        )}

        {/* Save Button (when editing) */}
        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveEdit();
            }}
            style={{
              width: "100%",
              padding: "6px",
              fontSize: "12px",
              backgroundColor: "#3B82F6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "12px",
              fontWeight: 500,
            }}
          >
            Save
          </button>
        )}
      </div>

      {/* Hover-triggered + buttons on all 4 edges */}
      {isHovering && !isDragging && !isEditing && (
        <>
          {/* Top + Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTop();
            }}
            style={{
              position: "absolute",
              top: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#007AFF",
              border: "2px solid #FFFFFF",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              zIndex: 3,
            }}
            title="Add manager above"
          >
            +
          </button>

          {/* Bottom + Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddBottom();
            }}
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#34C759",
              border: "2px solid #FFFFFF",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              zIndex: 3,
            }}
            title="Add report below"
          >
            +
          </button>

          {/* Left + Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddLeft();
            }}
            style={{
              position: "absolute",
              left: "-8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#FF9500",
              border: "2px solid #FFFFFF",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              zIndex: 3,
            }}
            title="Add peer (same level)"
          >
            +
          </button>

          {/* Right + Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddRight();
            }}
            style={{
              position: "absolute",
              right: "-8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#FF9500",
              border: "2px solid #FFFFFF",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              zIndex: 3,
            }}
            title="Add peer (same level)"
          >
            +
          </button>
        </>
      )}

      {/* Bottom Drop Zone */}
      <div
        ref={setBottomDropRef}
        style={{
          position: "absolute",
          bottom: `-12px`,
          left: "0",
          right: "0",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: (isOverBottom || activeDropZone === "bottom") && isDropTarget ? 1 : 0,
          transition: "opacity 0.2s",
          zIndex: 2,
        }}
      >
        {(isOverBottom || (activeDropZone === "bottom" && isDropTarget)) && (
          <div
            style={{
              fontSize: "10px",
              color: "#34C759",
              fontWeight: 600,
              backgroundColor: "#E8F8EE",
              padding: "3px 10px",
              borderRadius: "4px",
              border: "1px solid #34C759",
            }}
          >
            Add as Report
          </div>
        )}
      </div>
    </div>
  );
}

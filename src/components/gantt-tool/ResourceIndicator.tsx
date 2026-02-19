/**
 * Resource Indicator - Apple HIG Philosophy
 *
 * "Simplicity is the ultimate sophistication" - Steve Jobs
 *
 * Design Principles:
 * 1. Show ONLY what needs attention (overallocated resources)
 * 2. Normal resources: subtle icon + count
 * 3. Click to reveal details (progressive disclosure)
 * 4. Color = meaning (red = problem, gray = normal)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Users, AlertCircle, Settings2, Trash2 } from "lucide-react";

// Display type for resource assignments with joined resource data
interface ResourceAssignmentDisplay {
  resourceId: string;
  name: string;
  allocationPercent: number;
  id?: string;
  assignmentNotes?: string;
  assignedAt?: string;
}

interface ResourceIndicatorProps {
  resources: ResourceAssignmentDisplay[];
  taskName: string;
  taskStartDate?: string;
  taskEndDate?: string;
  taskHolidays?: unknown[];
  onManageResources?: () => void;
  onUpdateAllocation?: (resourceId: string, percentage: number) => void;
  onRemoveResource?: (resourceId: string) => void;
}

export function ResourceIndicator({
  resources,
  taskName,
  taskStartDate,
  taskEndDate,
  taskHolidays = [],
  onManageResources,
  onUpdateAllocation,
  onRemoveResource,
}: ResourceIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate task working days
  const taskWorkingDays = taskStartDate && taskEndDate
    ? (() => {
        const { calculateWorkingDaysInclusive } = require("@/lib/gantt-tool/working-days");
        return calculateWorkingDaysInclusive(taskStartDate, taskEndDate, taskHolidays);
      })()
    : 0;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!resources || resources.length === 0) {
    return null;
  }

  // Calculate total allocation
  const totalAllocation = resources.reduce((sum, r) => sum + (r.allocationPercent || 0), 0);
  const isOverallocated = totalAllocation > 100;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Indicator Button */}
      <button
        type="button"
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onManageResources) {
            onManageResources();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        title={`${resources.length} ${resources.length === 1 ? "resource" : "resources"} - Click to manage`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          backgroundColor: isOverallocated ? "rgba(255, 59, 48, 0.08)" : "rgba(0, 122, 255, 0.08)",
          border: `1px solid ${isOverallocated ? "rgba(255, 59, 48, 0.3)" : "rgba(0, 122, 255, 0.3)"}`,
          borderRadius: "8px",
          fontFamily: "var(--font-text)",
          fontSize: "12px",
          fontWeight: 500,
          color: isOverallocated ? "#FF3B30" : "#007AFF",
          cursor: "pointer",
          transition: "all 0.15s ease",
          maxWidth: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isOverallocated
            ? "rgba(255, 59, 48, 0.12)"
            : "rgba(0, 122, 255, 0.12)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOverallocated
            ? "rgba(255, 59, 48, 0.08)"
            : "rgba(0, 122, 255, 0.08)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Users className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, flexShrink: 0 }}>{resources.length}</span>
      </button>

      {/* Popover - Progressive Disclosure */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
            left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
            width: "480px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid var(--color-gray-4)",
            overflow: "hidden",
            zIndex: 1000,
            animation: "slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-gray-4)",
              backgroundColor: "var(--color-gray-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#000",
                  marginBottom: "2px",
                }}
              >
                Resources
              </div>
              <div
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "11px",
                  color: "var(--color-gray-2)",
                }}
              >
                {taskName}
              </div>
            </div>
            {onManageResources && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onManageResources();
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  backgroundColor: "#007AFF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#0051D5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#007AFF";
                }}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Manage
              </button>
            )}
          </div>

          {/* Resource List - Steve Jobs: Show WHAT MATTERS */}
          <div style={{ padding: "12px 16px", maxHeight: "400px", overflowY: "auto" }}>
            {resources.map((resource) => {
              const allocation = resource.allocationPercent || 0;
              const isOver = allocation > 100;
              const isEditing = editingResourceId === resource.resourceId;

              // Calculate working days for this resource
              const resourceWorkingDays = taskWorkingDays > 0
                ? Math.round((taskWorkingDays * allocation) / 100)
                : 0;

              return (
                <div
                  key={resource.resourceId}
                  onClick={() => {
                    if (onUpdateAllocation) {
                      setEditingResourceId(isEditing ? null : resource.resourceId);
                    }
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    backgroundColor: isOver ? "rgba(255, 59, 48, 0.08)" : "rgba(0, 122, 255, 0.04)",
                    border: isOver ? "1px solid rgba(255, 59, 48, 0.2)" : "1px solid rgba(0, 122, 255, 0.1)",
                    cursor: onUpdateAllocation ? "pointer" : "default",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (onUpdateAllocation) {
                      e.currentTarget.style.transform = "scale(1.01)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (onUpdateAllocation) {
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                >
                  {/* Resource Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "2px",
                        }}
                      >
                        {resource.name}
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <div
                          style={{
                            fontFamily: "SF Mono, Monaco, Consolas, monospace",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: isOver ? "#FF3B30" : "#007AFF",
                          }}
                        >
                          {allocation}%
                        </div>
                        {taskWorkingDays > 0 && (
                          <div
                            style={{
                              fontFamily: "var(--font-text)",
                              fontSize: "12px",
                              color: "var(--color-gray-2)",
                            }}
                          >
                            {resourceWorkingDays}d of {taskWorkingDays}d
                          </div>
                        )}
                      </div>
                    </div>
                    {onRemoveResource && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveResource(resource.resourceId);
                        }}
                        style={{
                          padding: "6px",
                          backgroundColor: "transparent",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          color: "var(--color-gray-2)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 59, 48, 0.1)";
                          e.currentTarget.style.color = "#FF3B30";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--color-gray-2)";
                        }}
                        title="Remove resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Inline Edit Slider */}
                  {isEditing && onUpdateAllocation && (
                    <div style={{ marginTop: "8px" }}>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={allocation}
                        onChange={(e) => {
                          onUpdateAllocation(resource.resourceId, Number(e.target.value));
                        }}
                        style={{
                          width: "100%",
                          height: "4px",
                          borderRadius: "2px",
                          background: `linear-gradient(to right, ${isOver ? "#FF3B30" : "#007AFF"} 0%, ${isOver ? "#FF3B30" : "#007AFF"} ${allocation}%, #E5E7EB ${allocation}%, #E5E7EB 100%)`,
                          cursor: "pointer",
                          appearance: "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Allocation Footer (only if overallocated) */}
          {isOverallocated && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--color-gray-4)",
                backgroundColor: "rgba(255, 59, 48, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle className="w-4 h-4" style={{ color: "var(--color-red)" }} />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-red)",
                    }}
                  >
                    Overallocated: {totalAllocation}%
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "11px",
                      color: "var(--color-gray-2)",
                    }}
                  >
                    Total allocation exceeds 100%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

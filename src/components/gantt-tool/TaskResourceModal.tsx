/**
 * Task Resource Assignment Modal
 *
 * Jobs/Ive Design: Simple, Clear, Beautiful
 * Purpose: Assign people to this task
 */

"use client";

import { useState } from "react";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";

interface TaskResourceModalProps {
  taskId: string;
  phaseId: string;
  onClose: () => void;
}

export function TaskResourceModal({ taskId, phaseId, onClose }: TaskResourceModalProps) {
  const { currentProject, updateTask } = useGanttToolStoreV2();

  const [showAddMenu, setShowAddMenu] = useState(false);

  if (!currentProject) return null;

  const phase = currentProject.phases.find(p => p.id === phaseId);
  const task = phase?.tasks.find(t => t.id === taskId);

  if (!task) return null;

  const currentAssignments = task.resourceAssignments || [];
  const availableResources = (currentProject.resources || []).filter(
    r => !currentAssignments.find(a => a.resourceId === r.id)
  );

  const handleAddResource = async (resourceId: string) => {
    await updateTask(taskId, phaseId, {
      resourceAssignments: [
        ...currentAssignments,
        {
          resourceId,
          allocationPercent: 100,
          role: 'assigned',
          assignmentNotes: '',
        }
      ]
    });
    setShowAddMenu(false);
  };

  const handleRemoveResource = async (resourceId: string) => {
    await updateTask(taskId, phaseId, {
      resourceAssignments: currentAssignments.filter(a => a.resourceId !== resourceId)
    });
  };

  const handleUpdateAllocation = async (resourceId: string, percent: number) => {
    await updateTask(taskId, phaseId, {
      resourceAssignments: currentAssignments.map(a =>
        a.resourceId === resourceId
          ? { ...a, allocationPercent: percent }
          : a
      )
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid var(--color-gray-4)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "4px",
              }}>
                Assign People
              </h2>
              <p style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                color: "#666",
              }}>
                {task.name}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-6)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <X className="w-5 h-5" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px",
        }}>
          {/* Current Assignments */}
          {currentAssignments.length > 0 ? (
            <div style={{ marginBottom: "24px" }}>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}>
                Assigned ({currentAssignments.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentAssignments.map((assignment) => {
                  const resource = currentProject.resources?.find(r => r.id === assignment.resourceId);
                  if (!resource) return null;

                  return (
                    <div
                      key={assignment.resourceId}
                      style={{
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-gray-4)",
                        backgroundColor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#fff",
                        flexShrink: 0,
                      }}>
                        {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#000",
                          marginBottom: "2px",
                        }}>
                          {resource.name}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "12px",
                          color: "#666",
                        }}>
                          {resource.designation}
                        </div>
                      </div>

                      {/* Allocation Slider */}
                      <div style={{ width: "120px" }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={assignment.allocationPercent || 100}
                          onChange={(e) => handleUpdateAllocation(resource.id, parseInt(e.target.value))}
                          style={{
                            width: "100%",
                            marginBottom: "4px",
                          }}
                        />
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-blue)",
                          textAlign: "center",
                        }}>
                          {assignment.allocationPercent || 100}%
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveResource(resource.id)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.15s ease",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#FEE";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Remove person"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: "#FF3B30" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              padding: "32px",
              textAlign: "center",
              color: "#999",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              marginBottom: "24px",
            }}>
              No one assigned yet
            </div>
          )}

          {/* Add Button */}
          {availableResources.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "2px dashed var(--color-gray-4)",
                  backgroundColor: showAddMenu ? "var(--color-blue-light)" : "transparent",
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--color-blue)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!showAddMenu) e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
                }}
                onMouseLeave={(e) => {
                  if (!showAddMenu) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Plus className="w-5 h-5" />
                Add Person
              </button>

              {/* Dropdown Menu */}
              {showAddMenu && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid var(--color-gray-4)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                  maxHeight: "240px",
                  overflow: "auto",
                  zIndex: 10,
                }}>
                  {availableResources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => handleAddResource(resource.id)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        backgroundColor: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-gray-6)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#fff",
                        flexShrink: 0,
                      }}>
                        {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#000",
                        }}>
                          {resource.name}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "12px",
                          color: "#666",
                        }}>
                          {resource.designation}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

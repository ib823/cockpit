/**
 * Task Resource Assignment Modal
 *
 * Apple HIG Design: Simple, Clear, Beautiful
 * Purpose: Assign people to this task
 * Refactored to use BaseModal for consistent UX
 */

"use client";

import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { nanoid } from "nanoid";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";

interface TaskResourceModalProps {
  isOpen: boolean;
  taskId: string;
  phaseId: string;
  onClose: () => void;
}

export function TaskResourceModal({ isOpen, taskId, phaseId, onClose }: TaskResourceModalProps) {
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
          id: nanoid(),
          resourceId,
          allocationPercentage: 100,
          assignmentNotes: '',
          assignedAt: new Date().toISOString(),
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
          ? { ...a, allocationPercentage: percent }
          : a
      )
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign People"
      subtitle={task.name}
      icon={<Users className="w-5 h-5" />}
      size="medium"
      footer={
        <ModalButton variant="primary" onClick={onClose}>
          Done
        </ModalButton>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Current Assignments */}
        {currentAssignments.length > 0 ? (
          <div>
            <div style={{
              fontFamily: "var(--font-text)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#86868B",
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
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      backgroundColor: "#FFFFFF",
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
                      backgroundColor: "#007AFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#FFFFFF",
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
                        color: "#1D1D1F",
                        marginBottom: "2px",
                      }}>
                        {resource.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        color: "#86868B",
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
                        value={assignment.allocationPercentage || 100}
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
                        color: "#007AFF",
                        textAlign: "center",
                      }}>
                        {assignment.allocationPercentage || 100}%
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
            color: "#86868B",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
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
                border: "2px dashed rgba(0, 0, 0, 0.12)",
                backgroundColor: showAddMenu ? "rgba(0, 122, 255, 0.08)" : "transparent",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#007AFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!showAddMenu) e.currentTarget.style.backgroundColor = "#F5F5F7";
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
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
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
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F5F5F7"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#007AFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-text)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#FFFFFF",
                      flexShrink: 0,
                    }}>
                      {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {resource.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        color: "#86868B",
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
    </BaseModal>
  );
}

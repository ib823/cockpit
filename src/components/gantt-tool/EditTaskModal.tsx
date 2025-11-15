/**
 * EditTaskModal - Apple Minimalist Design System
 *
 * Features:
 * - AppleMinimalistModal integration with unified UX
 * - Full feature parity with AddTaskModal
 * - Description, deliverables, AMS configuration
 * - Working days calculation
 * - Real-time validation with impact preview
 * - Strategic Planning fields
 * - RACI editor integration
 * - Delete functionality with impact modal
 * - Keyboard shortcuts
 *
 * Migration: Converted from BaseModal to AppleMinimalistModal (2025-11-15)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Calendar, AlertCircle, Edit3, DollarSign, Trash2, Users, ChevronDown, TrendingUp } from "lucide-react";
import { AppleMinimalistModal, type FormField } from "@/components/ui/AppleMinimalistModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import type { TaskFormData, Task, Phase, ResourceCategory } from "@/types/gantt-tool";
import { TaskDeletionImpactModal } from "./TaskDeletionImpactModal";
import { RACIEditorModal } from "./RACIEditorModal";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task; // The task being edited
  taskId: string;
  phaseId: string;
}

export function EditTaskModal({ isOpen, onClose, task, taskId, phaseId }: EditTaskModalProps) {
  const { currentProject, updateTask, deleteTask } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [impactWarning, setImpactWarning] = useState<string | null>(null);
  const [showAMSConfig, setShowAMSConfig] = useState(task.isAMS || false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRACIModal, setShowRACIModal] = useState(false);
  const [showStrategicFields, setShowStrategicFields] = useState(false);

  // Get the phase this task belongs to
  const phase = currentProject?.phases.find(p => p.id === phaseId);

  // Form state - pre-populated with current task data
  const [formData, setFormData] = useState<TaskFormData>({
    name: task.name,
    description: task.description || "",
    deliverables: task.deliverables || "",
    startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(task.endDate), "yyyy-MM-dd"),
    phaseId: phaseId,
    // AMS fields
    isAMS: task.isAMS || false,
    amsRateType: task.amsConfig?.rateType || "daily",
    amsFixedRate: task.amsConfig?.fixedRate || 0,
    amsMinimumDuration: task.amsConfig?.minimumDuration || 12,
    amsNotes: task.amsConfig?.notes || "",
    // Strategic planning fields
    priority: task.priority,
    isCritical: task.isCritical || false,
    estimatedEffort: task.estimatedEffort,
    requiredSkillCategories: task.requiredSkillCategories || [],
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Update form data when task changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: task.name,
        description: task.description || "",
        deliverables: task.deliverables || "",
        startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(task.endDate), "yyyy-MM-dd"),
        phaseId: phaseId,
        isAMS: task.isAMS || false,
        amsRateType: task.amsConfig?.rateType || "daily",
        amsFixedRate: task.amsConfig?.fixedRate || 0,
        amsMinimumDuration: task.amsConfig?.minimumDuration || 12,
        amsNotes: task.amsConfig?.notes || "",
        priority: task.priority,
        isCritical: task.isCritical || false,
        estimatedEffort: task.estimatedEffort,
        requiredSkillCategories: task.requiredSkillCategories || [],
      });
      setShowAMSConfig(task.isAMS || false);
      setShowStrategicFields(!!(task.priority !== undefined || task.isCritical || task.estimatedEffort !== undefined || (task.requiredSkillCategories && task.requiredSkillCategories.length > 0)));
      setErrors({});
      setImpactWarning(null);

      // Focus name field
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, task, phaseId]);

  // Calculate impact when dates change
  useEffect(() => {
    if (!currentProject || !formData.startDate || !formData.endDate) return;

    const newStart = new Date(formData.startDate);
    const newEnd = new Date(formData.endDate);
    const oldStart = new Date(task.startDate);
    const oldEnd = new Date(task.endDate);

    // Check if dates are changing significantly
    if (newStart.getTime() !== oldStart.getTime() || newEnd.getTime() !== oldEnd.getTime()) {
      const assignmentCount = task.resourceAssignments?.length || 0;
      if (assignmentCount > 0) {
        const workingDays = calculateWorkingDaysInclusive(newStart, newEnd, currentProject.holidays || []);
        setImpactWarning(
          `⚠️ ${assignmentCount} resource${assignmentCount > 1 ? 's' : ''} (${workingDays} working days) will be affected`
        );
      } else {
        setImpactWarning(null);
      }
    } else {
      setImpactWarning(null);
    }
  }, [formData.startDate, formData.endDate, task, currentProject]);

  // Calculate working days
  const workingDays = currentProject && formData.startDate && formData.endDate
    ? calculateWorkingDaysInclusive(
        new Date(formData.startDate),
        new Date(formData.endDate),
        currentProject.holidays || []
      )
    : 0;

  // Validation
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Task name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }

      // Validate phase boundaries
      if (phase) {
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        if (start < phaseStart || end > phaseEnd) {
          newErrors.startDate = "Task dates must fall within phase boundaries";
          newErrors.endDate = `Phase: ${format(phaseStart, "MMM d")} - ${format(phaseEnd, "MMM d, yyyy")}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await updateTask(taskId, phaseId, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
      setErrors({ name: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof TaskFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, formData]);


  // Form fields for AppleMinimalistModal
  const fields: FormField[] = [
    {
      id: "name",
      type: "text",
      label: "Task Name",
      placeholder: "e.g., Create Business Requirements Document",
      required: true,
      error: errors.name,
    },
    {
      id: "description",
      type: "textarea",
      label: "Description",
      placeholder: "What needs to be done?",
      helperText: "Optional - describe the task",
    },
    {
      id: "deliverables",
      type: "textarea",
      label: "Deliverables",
      placeholder: "Expected outputs",
      helperText: "Optional - list the key deliverables",
    },
    {
      id: "startDate",
      type: "date",
      label: "Start Date",
      required: true,
      error: errors.startDate,
      minDate: phase ? format(new Date(phase.startDate), "yyyy-MM-dd") : undefined,
      maxDate: phase ? format(new Date(phase.endDate), "yyyy-MM-dd") : undefined,
      region: currentProject?.orgChartPro?.location || "ABMY",    },
    {
      id: "endDate",
      type: "date",
      label: "End Date",
      required: true,
      error: errors.endDate,
      minDate: phase ? format(new Date(phase.startDate), "yyyy-MM-dd") : undefined,
      maxDate: phase ? format(new Date(phase.endDate), "yyyy-MM-dd") : undefined,
      region: currentProject?.orgChartPro?.location || "ABMY",    },
  ];

  // Custom content for impact warning, working days, AMS, strategic planning, and RACI
  const customContent = (
    <>
      {/* Impact Warning */}
        {impactWarning && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(255, 149, 0, 0.1)",
            border: "1px solid rgba(255, 149, 0, 0.3)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <AlertCircle className="w-5 h-5" style={{ color: "#FF9500", flexShrink: 0, marginTop: "2px" }} />
            <div style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#1D1D1F",
              lineHeight: "1.5",
            }}>
              {impactWarning}
            </div>
          </div>
        )}

      {/* Working Days Display */}
        {workingDays > 0 && (
          <div style={{
            padding: "16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <Calendar className="w-4 h-4" style={{ color: "#007AFF" }} />
            <span style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#1D1D1F",
            }}>
              <strong>{workingDays}</strong> working days (excluding weekends & holidays)
            </span>
          </div>
        )}

        {/* AMS Configuration Section */}
        <div style={{
          padding: "16px",
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: showAMSConfig ? "16px" : 0 }}>
            <input
              id="edit-task-is-ams"
              type="checkbox"
              checked={formData.isAMS}
              onChange={(e) => {
                const checked = e.target.checked;
                handleChange("isAMS", checked);
                setShowAMSConfig(checked);
              }}
              style={{
                width: "18px",
                height: "18px",
                accentColor: "#007AFF",
              }}
            />
            <label
              htmlFor="edit-task-is-ams"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1D1D1F",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <DollarSign className="w-4 h-4" style={{ color: "#34C759" }} />
              Application Maintenance & Support (AMS)
            </label>
          </div>

          {showAMSConfig && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "30px" }}>
              {/* Rate Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                    marginBottom: "6px",
                  }}>
                    Rate Type
                  </label>
                  <select
                    value={formData.amsRateType}
                    onChange={(e) => handleChange("amsRateType", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      backgroundColor: "#FFFFFF",
                      border: "2px solid transparent",
                      borderRadius: "6px",
                      outline: "none",
                    }}
                  >
                    <option value="daily">Daily Rate</option>
                    <option value="manda">Man/Day Rate</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                    marginBottom: "6px",
                  }}>
                    Fixed Rate
                  </label>
                  <input
                    type="number"
                    value={formData.amsFixedRate}
                    onChange={(e) => handleChange("amsFixedRate", parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      backgroundColor: "#FFFFFF",
                      border: "2px solid transparent",
                      borderRadius: "6px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Min Duration */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1D1D1F",
                  marginBottom: "6px",
                }}>
                  Minimum Duration (months)
                </label>
                <input
                  type="number"
                  value={formData.amsMinimumDuration}
                  onChange={(e) => handleChange("amsMinimumDuration", parseInt(e.target.value) || 12)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                    border: "2px solid transparent",
                    borderRadius: "6px",
                    outline: "none",
                  }}
                />
              </div>

              {/* AMS Notes */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1D1D1F",
                  marginBottom: "6px",
                }}>
                  Notes
                </label>
                <textarea
                  value={formData.amsNotes}
                  onChange={(e) => handleChange("amsNotes", e.target.value)}
                  placeholder="Additional AMS details"
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                    border: "2px solid transparent",
                    borderRadius: "6px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Strategic Planning Section (Optional - Collapsible) */}
        <div style={{
          padding: "16px",
          backgroundColor: "#FAFAFA",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}>
          <button
            type="button"
            onClick={() => setShowStrategicFields(!showStrategicFields)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ChevronDown
              className="w-4 h-4"
              style={{
                color: "#86868B",
                transform: showStrategicFields ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1D1D1F",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <TrendingUp className="w-4 h-4" style={{ color: "#007AFF" }} />
                Strategic Planning <span style={{ color: "#86868B", fontWeight: 400 }}>(optional)</span>
              </div>
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "#86868B",
                marginTop: "2px",
              }}>
                Priority, criticality, effort estimation, and skill requirements
              </div>
            </div>
          </button>

          {showStrategicFields && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "30px" }}>

              {/* Priority Level - Segmented Control */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1D1D1F",
                  marginBottom: "8px",
                }}>
                  Priority Level
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["high", "medium", "low"] as const).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleChange("priority", level)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: formData.priority === level
                          ? (level === "high" ? "#FF3B30" : level === "medium" ? "#FF9500" : "#8E8E93")
                          : "#FFFFFF",
                        color: formData.priority === level ? "#FFFFFF" : "#1D1D1F",
                        border: `2px solid ${level === "high" ? "#FF3B30" : level === "medium" ? "#FF9500" : "#8E8E93"}`,
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "13px",
                        fontFamily: "var(--font-text)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (formData.priority !== level) {
                          const color = level === "high" ? "#FF3B30" : level === "medium" ? "#FF9500" : "#8E8E93";
                          e.currentTarget.style.backgroundColor = `${color}20`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.priority !== level) {
                          e.currentTarget.style.backgroundColor = "#FFFFFF";
                        }
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "11px",
                  color: "#86868B",
                  marginTop: "4px",
                }}>
                  How urgent is this task for the project timeline?
                </div>
              </div>

              {/* Critical Path Flag */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    id="edit-task-is-critical"
                    type="checkbox"
                    checked={formData.isCritical || false}
                    onChange={(e) => handleChange("isCritical", e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#FF9500",
                    }}
                  />
                  <label
                    htmlFor="edit-task-is-critical"
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1D1D1F",
                      cursor: "pointer",
                    }}
                  >
                    ⚠️ Critical Path Task
                  </label>
                </div>
                {formData.isCritical && (
                  <div style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    color: "#FF9500",
                    marginLeft: "30px",
                    marginTop: "4px",
                  }}>
                    Delays to this task will impact the go-live date
                  </div>
                )}
              </div>

              {/* Estimated Effort */}
              <div>
                <label
                  htmlFor="edit-task-estimated-effort"
                  style={{
                    display: "block",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                    marginBottom: "8px",
                  }}
                >
                  Estimated Effort (working days)
                </label>
                <input
                  id="edit-task-estimated-effort"
                  type="number"
                  value={formData.estimatedEffort || ""}
                  onChange={(e) => handleChange("estimatedEffort", e.target.value ? parseInt(e.target.value) as any : "" as any)}
                  placeholder="e.g., 15"
                  min="1"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                    border: "2px solid transparent",
                    borderRadius: "6px",
                    outline: "none",
                    transition: "all 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#007AFF";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "transparent";
                  }}
                />
                <div style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "11px",
                  color: "#86868B",
                  marginTop: "4px",
                }}>
                  Used for resource planning and cost estimation
                </div>
              </div>

              {/* Required Skills - Multi-select chips */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#1D1D1F",
                  marginBottom: "8px",
                }}>
                  Required Skills
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {(["technical", "functional", "pm", "qa", "change", "basis", "security", "leadership"] as ResourceCategory[]).map(skill => {
                    const isSelected = (formData.requiredSkillCategories || []).includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const current = formData.requiredSkillCategories || [];
                          const updated = current.includes(skill)
                            ? current.filter(s => s !== skill)
                            : [...current, skill];
                          handleChange("requiredSkillCategories", updated as any);
                        }}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: isSelected ? "#007AFF" : "#F5F5F7",
                          color: isSelected ? "#FFFFFF" : "#1D1D1F",
                          border: "none",
                          borderRadius: "16px",
                          fontSize: "13px",
                          fontWeight: 500,
                          fontFamily: "var(--font-text)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "#E5E5EA";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = "#F5F5F7";
                          }
                        }}
                      >
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                      </button>
                    );
                  })}
                </div>
                <div style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "11px",
                  color: "#86868B",
                  marginTop: "4px",
                }}>
                  Helps match tasks with qualified resources in RACI matrix
                </div>
              </div>

            </div>
          )}
        </div>

        {/* RACI Matrix Section */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#FAFAFA",
            borderRadius: "8px",
            border: "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1D1D1F",
                marginBottom: "4px",
              }}
            >
              RACI Matrix
            </div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "#86868B",
              }}
            >
              Define who is Responsible, Accountable, Consulted, and Informed
            </div>
          </div>

          {/* RACI Summary */}
          {task.raciAssignments && task.raciAssignments.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "12px",
                fontFamily: "var(--font-text)",
                fontSize: "12px",
              }}
            >
              <span>
                <strong style={{ color: "#007AFF" }}>
                  {task.raciAssignments.filter((a) => a.role === "responsible").length}
                </strong>{" "}
                Responsible
              </span>
              <span>
                <strong style={{ color: "#FF3B30" }}>
                  {task.raciAssignments.filter((a) => a.role === "accountable").length}
                </strong>{" "}
                Accountable
              </span>
              <span>
                <strong style={{ color: "#FF9500" }}>
                  {task.raciAssignments.filter((a) => a.role === "consulted").length}
                </strong>{" "}
                Consulted
              </span>
              <span>
                <strong style={{ color: "#8E8E93" }}>
                  {task.raciAssignments.filter((a) => a.role === "informed").length}
                </strong>{" "}
                Informed
              </span>
            </div>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                color: "#86868B",
                marginBottom: "12px",
              }}
            >
              No RACI assignments yet
            </div>
          )}

          {/* Edit RACI Button */}
          <button
            type="button"
            onClick={() => setShowRACIModal(true)}
            style={{
              width: "100%",
              padding: "10px 20px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "#FFFFFF",
              color: "#007AFF",
              border: "2px solid #007AFF",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#007AFF";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.color = "#007AFF";
            }}
          >
            <Users className="w-4 h-4" />
            Edit RACI Matrix
          </button>
        </div>
    </>
  );

  return (
    <>
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      subtitle={phase ? `Phase: ${phase.name}` : "Modify task details"}
      icon={<Edit3 className="w-5 h-5" />}
      size="large"
      formLayout="vertical"
      fields={fields}
      formValues={formData as any}
      onFieldChange={(fieldId, value) => handleChange(fieldId as keyof TaskFormData, value)}
      primaryAction={{
        label: isSubmitting ? "Saving..." : "Save Changes",
        onClick: () => { void handleSubmit(new Event('submit') as any); },
        loading: isSubmitting,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
      }}
      destructiveAction={{
        label: "Delete Task",
        onClick: () => setShowDeleteModal(true),
      }}
    >
      {customContent}
    </AppleMinimalistModal>

    {/* RACI Editor Modal */}
    {showRACIModal && (
      <RACIEditorModal
        isOpen={showRACIModal}
        onClose={() => setShowRACIModal(false)}
        item={task}
        itemType="task"
        phaseId={phaseId}
      />
    )}

    {/* Task Deletion Impact Modal */}
    {showDeleteModal && currentProject && phase && (
      <TaskDeletionImpactModal
        task={task}
        phase={phase}
        allTasks={phase.tasks || []}
        allResources={currentProject.resources || []}
        holidays={currentProject.holidays || []}
        onConfirm={async () => {
          await deleteTask(phaseId, taskId);
          setShowDeleteModal(false);
          onClose();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    )}
    </>
  );
}

export default EditTaskModal;

/**
 * AddTaskModal - Apple Minimalist Design System
 *
 * Features:
 * - AppleMinimalistModal integration with unified UX
 * - Phase selector with smart filtering
 * - Auto-fill dates based on selected phase
 * - Smart task naming (Task 1, Task 2, etc.)
 * - Real-time validation
 * - Keyboard shortcuts (Cmd+Enter to save)
 * - Working days calculation
 * - AMS configuration (full parity with EditTaskModal)
 *
 * Migration: Converted from AppleMinimalistModal to AppleMinimalistModal (2025-11-15)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { Calendar, PlusSquare, DollarSign } from "lucide-react";
import { AppleMinimalistModal } from "@/components/ui/AppleMinimalistModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import type { TaskFormData } from "@/types/gantt-tool";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPhaseId?: string; // Optionally pre-select a phase
}

export function AddTaskModal({ isOpen, onClose, preselectedPhaseId }: AddTaskModalProps) {
  const { currentProject, addTask } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [showAMSConfig, setShowAMSConfig] = useState(false);

  // Form state with smart defaults
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    deliverables: "",
    phaseId: preselectedPhaseId || "",
    startDate: "",
    endDate: "",
    assignee: "",
    dependencies: [],
    isAMS: false,
    amsRateType: "daily",
    amsFixedRate: 0,
    amsMinimumDuration: 12,
    amsNotes: "",
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Get the selected phase
  const selectedPhase = currentProject?.phases.find(p => p.id === formData.phaseId);

  // Initialize form with smart defaults
  useEffect(() => {
    if (isOpen && currentProject) {
      const selectedPhaseId = preselectedPhaseId || (currentProject.phases.length > 0 ? currentProject.phases[0].id : "");
      const phase = currentProject.phases.find(p => p.id === selectedPhaseId);

      if (phase) {
        const taskCount = phase.tasks.length;
        const suggestedName = `Task ${taskCount + 1}`;

        // Smart date defaults - use phase dates or suggest within phase
        let suggestedStartDate: string;
        let suggestedEndDate: string;

        if (taskCount > 0) {
          // Start after the last task
          const lastTask = phase.tasks[taskCount - 1];
          const lastEndDate = new Date(lastTask.endDate);
          const phaseEndDate = new Date(phase.endDate);

          suggestedStartDate = format(addDays(lastEndDate, 1), "yyyy-MM-dd");
          // Don't exceed phase end date
          const proposedEndDate = addDays(lastEndDate, 7);
          suggestedEndDate = format(proposedEndDate > phaseEndDate ? phaseEndDate : proposedEndDate, "yyyy-MM-dd");
        } else {
          // First task - use phase start date
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);
          suggestedStartDate = format(phaseStart, "yyyy-MM-dd");
          // Suggest 7 days or phase end date, whichever is earlier
          const proposedEndDate = addDays(phaseStart, 6);
          suggestedEndDate = format(proposedEndDate > phaseEnd ? phaseEnd : proposedEndDate, "yyyy-MM-dd");
        }

        setFormData({
          name: suggestedName,
          description: "",
          deliverables: "",
          phaseId: selectedPhaseId,
          startDate: suggestedStartDate,
          endDate: suggestedEndDate,
          assignee: "",
          dependencies: [],
          isAMS: false,
          amsRateType: "daily",
          amsFixedRate: 0,
          amsMinimumDuration: 12,
          amsNotes: "",
        });
      }

      setErrors({});
      setShowAMSConfig(false);

      // Focus name field after a brief delay
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select(); // Select the suggested name for easy replacement
      }, 100);
    }
  }, [isOpen, currentProject, preselectedPhaseId]);

  // Update dates when phase changes
  const handlePhaseChange = (newPhaseId: string) => {
    if (!currentProject) return;

    const newPhase = currentProject.phases.find(p => p.id === newPhaseId);
    if (!newPhase) return;

    const taskCount = newPhase.tasks.length;
    const suggestedName = `Task ${taskCount + 1}`;

    // Update dates based on new phase
    let suggestedStartDate: string;
    let suggestedEndDate: string;

    if (taskCount > 0) {
      const lastTask = newPhase.tasks[taskCount - 1];
      const lastEndDate = new Date(lastTask.endDate);
      const phaseEndDate = new Date(newPhase.endDate);

      suggestedStartDate = format(addDays(lastEndDate, 1), "yyyy-MM-dd");
      const proposedEndDate = addDays(lastEndDate, 7);
      suggestedEndDate = format(proposedEndDate > phaseEndDate ? phaseEndDate : proposedEndDate, "yyyy-MM-dd");
    } else {
      const phaseStart = new Date(newPhase.startDate);
      const phaseEnd = new Date(newPhase.endDate);
      suggestedStartDate = format(phaseStart, "yyyy-MM-dd");
      const proposedEndDate = addDays(phaseStart, 6);
      suggestedEndDate = format(proposedEndDate > phaseEnd ? phaseEnd : proposedEndDate, "yyyy-MM-dd");
    }

    setFormData({
      ...formData,
      name: suggestedName,
      phaseId: newPhaseId,
      startDate: suggestedStartDate,
      endDate: suggestedEndDate,
    });
  };

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

    if (!formData.phaseId) {
      newErrors.phaseId = "Please select a phase";
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

      // Validate task is within phase bounds
      if (currentProject && formData.phaseId) {
        const phase = currentProject.phases.find(p => p.id === formData.phaseId);
        if (phase) {
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);

          if (start < phaseStart || end > phaseEnd) {
            newErrors.startDate = "Task dates must fall within phase boundaries";
            newErrors.endDate = `Phase: ${format(phaseStart, "MMM d")} - ${format(phaseEnd, "MMM d, yyyy")}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addTask(formData);
      onClose();
    } catch (error) {
      console.error("Failed to add task:", error);
      setErrors({ name: "Failed to add task. Please try again." });
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
      minDate: selectedPhase ? format(new Date(selectedPhase.startDate), "yyyy-MM-dd") : undefined,
      maxDate: selectedPhase ? format(new Date(selectedPhase.endDate), "yyyy-MM-dd") : undefined,
      region: currentProject?.orgChartPro?.location || "ABMY",    },
    {
      id: "endDate",
      type: "date",
      label: "End Date",
      required: true,
      error: errors.endDate,
      minDate: selectedPhase ? format(new Date(selectedPhase.startDate), "yyyy-MM-dd") : undefined,
      maxDate: selectedPhase ? format(new Date(selectedPhase.endDate), "yyyy-MM-dd") : undefined,
      region: currentProject?.orgChartPro?.location || "ABMY",    },
  ];

  // Custom content for phase selector, working days, and AMS config
  const customContent = (
    <>
      {/* Phase Selector */}
      <div>
        <label
          htmlFor="task-phase"
          style={{
            display: "block",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            fontWeight: 500,
            color: "#1D1D1F",
            marginBottom: "8px",
          }}
        >
          Phase
        </label>
        <select
          id="task-phase"
          value={formData.phaseId}
          onChange={(e) => handlePhaseChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 20px",
            fontFamily: "var(--font-text)",
            fontSize: "15px",
            color: "#1D1D1F",
            backgroundColor: errors.phaseId ? "#FFF5F5" : "#F5F5F7",
            border: errors.phaseId ? "2px solid #FF3B30" : "2px solid transparent",
            borderRadius: "8px",
            outline: "none",
            transition: "all 0.15s ease",
            cursor: "pointer",
          }}
          onFocus={(e) => {
            if (!errors.phaseId) {
              e.target.style.backgroundColor = "#FFFFFF";
              e.target.style.borderColor = "#007AFF";
            }
          }}
          onBlur={(e) => {
            if (!errors.phaseId) {
              e.target.style.backgroundColor = "#F5F5F7";
              e.target.style.borderColor = "transparent";
            }
          }}
        >
          {!currentProject || currentProject.phases.length === 0 ? (
            <option value="">No phases available - create a phase first</option>
          ) : (
            <>
              <option value="">Select a phase...</option>
              {currentProject.phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name} ({format(new Date(phase.startDate), "MMM d")} - {format(new Date(phase.endDate), "MMM d, yyyy")})
                </option>
              ))}
            </>
          )}
        </select>
        {errors.phaseId && (
          <p style={{
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            color: "#FF3B30",
            marginTop: "6px",
          }}>
            {errors.phaseId}
          </p>
        )}
      </div>

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
              id="task-is-ams"
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
              htmlFor="task-is-ams"
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

    </>
  );

  return (
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Task"
      subtitle={selectedPhase ? `Phase: ${selectedPhase.name}` : "Create a new task within a phase"}
      icon={<PlusSquare className="w-5 h-5" />}
      size="large"
      formLayout="vertical"
      fields={fields}
      formValues={formData as any}
      onFieldChange={(fieldId, value) => handleChange(fieldId as keyof TaskFormData, value)}
      primaryAction={{
        label: isSubmitting ? "Creating..." : "Create Task",
        onClick: () => { void handleSubmit(new Event('submit') as any); },
        loading: isSubmitting,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
      }}
    >
      {customContent}
    </AppleMinimalistModal>
  );
}

/**
 * EditPhaseModal - Apple Minimalist Design System
 *
 * Full feature parity with AddPhaseModal:
 * - AppleMinimalistModal integration with unified UX
 * - Description, deliverables, color picker
 * - Working days calculation
 * - Real-time validation with impact preview
 * - Keyboard shortcuts
 * - Accessibility compliant
 *
 * Design Philosophy:
 * - Consistency: Mirrors create flow UX
 * - Intelligence: Shows impact of changes
 * - Safety: Validates against business rules
 * - Forgiveness: Clear error messages
 *
 * Migration: Converted from BaseModal to AppleMinimalistModal (2025-11-15)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Calendar, AlertCircle, Edit3, Trash2, Users } from "lucide-react";
import { AppleMinimalistModal } from "@/components/ui/AppleMinimalistModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { PHASE_COLOR_PRESETS } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import type { PhaseFormData, Phase } from "@/types/gantt-tool";
import { PhaseDeletionImpactModal } from "./PhaseDeletionImpactModal";
import { RACIEditorModal } from "./RACIEditorModal";

interface EditPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase: Phase; // The phase being edited
  phaseId: string;
}

export function EditPhaseModal({ isOpen, onClose, phase, phaseId }: EditPhaseModalProps) {
  const { currentProject, updatePhase, deletePhase } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PhaseFormData, string>>>({});
  const [impactWarning, setImpactWarning] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRACIModal, setShowRACIModal] = useState(false);

  // Form state - pre-populated with current phase data
  const [formData, setFormData] = useState<PhaseFormData>({
    name: phase.name,
    description: phase.description || "",
    deliverables: phase.deliverables || "",
    color: phase.color,
    startDate: format(new Date(phase.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(phase.endDate), "yyyy-MM-dd"),
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Update form data when phase changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: phase.name,
        description: phase.description || "",
        deliverables: phase.deliverables || "",
        color: phase.color,
        startDate: format(new Date(phase.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(phase.endDate), "yyyy-MM-dd"),
      });
      setErrors({});
      setImpactWarning(null);

      // Focus name field
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 100);
    }
  }, [isOpen, phase]);

  // Calculate impact when dates change
  useEffect(() => {
    if (!currentProject || !formData.startDate || !formData.endDate) return;

    const newStart = new Date(formData.startDate);
    const newEnd = new Date(formData.endDate);
    const oldStart = new Date(phase.startDate);
    const oldEnd = new Date(phase.endDate);

    // Check if dates are shrinking
    const isStartMovingForward = newStart > oldStart;
    const isEndMovingBackward = newEnd < oldEnd;

    if (isStartMovingForward || isEndMovingBackward) {
      // Count tasks that would fall outside new bounds
      const affectedTasks = phase.tasks?.filter(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        return taskStart < newStart || taskEnd > newEnd;
      }) || [];

      if (affectedTasks.length > 0) {
        setImpactWarning(
          `⚠️ ${affectedTasks.length} task${affectedTasks.length > 1 ? 's' : ''} will be adjusted to fit within new dates`
        );
      } else {
        setImpactWarning(null);
      }
    } else {
      setImpactWarning(null);
    }
  }, [formData.startDate, formData.endDate, phase, currentProject]);

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
    const newErrors: Partial<Record<keyof PhaseFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Phase name is required";
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
      await updatePhase(phaseId, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update phase:", error);
      setErrors({ name: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle field changes
  const handleChange = (field: keyof PhaseFormData, value: string) => {
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
  const fields = [
    {
      id: "name",
      type: "text" as const,
      label: "Phase Name",
      placeholder: "e.g., Requirements Gathering",
      value: formData.name,
      required: true,
      error: errors.name,
    },
    {
      id: "description",
      type: "textarea" as const,
      label: "Description",
      placeholder: "What happens during this phase?",
      value: formData.description,
      helperText: "Optional - describe the phase in detail",
    },
    {
      id: "deliverables",
      type: "textarea" as const,
      label: "Deliverables",
      placeholder: "Key outputs and artifacts",
      value: formData.deliverables,
      helperText: "Optional - list the key deliverables",
    },
    {
      id: "startDate",
      type: "date" as const,
      label: "Start Date",
      value: formData.startDate,
      required: true,
      error: errors.startDate,    },
    {
      id: "endDate",
      type: "date" as const,
      label: "End Date",
      value: formData.endDate,
      required: true,
      error: errors.endDate,    },
  ];

  // Render custom content for impact warning, working days, color picker, and RACI
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
          marginBottom: "16px",
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
          marginBottom: "16px",
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

      {/* Color Picker */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            fontWeight: 500,
            color: "#1D1D1F",
            marginBottom: "8px",
          }}
        >
          Phase Color
        </label>
        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          {PHASE_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleChange("color", color)}
              aria-label={`Select color ${color}`}
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: color,
                border: formData.color === color ? "3px solid #007AFF" : "2px solid transparent",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: formData.color === color ? "0 0 0 2px #FFFFFF, 0 0 0 5px #007AFF" : "none",
              }}
              onMouseEnter={(e) => {
                if (formData.color !== color) {
                  e.currentTarget.style.transform = "scale(1.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>
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
        {phase.raciAssignments && phase.raciAssignments.length > 0 ? (
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
                {phase.raciAssignments.filter((a) => a.role === "responsible").length}
              </strong>{" "}
              Responsible
            </span>
            <span>
              <strong style={{ color: "#FF3B30" }}>
                {phase.raciAssignments.filter((a) => a.role === "accountable").length}
              </strong>{" "}
              Accountable
            </span>
            <span>
              <strong style={{ color: "#FF9500" }}>
                {phase.raciAssignments.filter((a) => a.role === "consulted").length}
              </strong>{" "}
              Consulted
            </span>
            <span>
              <strong style={{ color: "#8E8E93" }}>
                {phase.raciAssignments.filter((a) => a.role === "informed").length}
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
      title="Edit Phase"
      subtitle="Modify phase details and settings"
      icon={<Edit3 className="w-5 h-5" />}
      size="medium"
      formLayout="vertical"
      fields={fields}
      formValues={formData}
      onFieldChange={(fieldId, value) => handleChange(fieldId as keyof PhaseFormData, value)}
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
        label: "Delete Phase",
        onClick: () => setShowDeleteModal(true),
        icon: <Trash2 className="w-4 h-4" />,
      }}
    >
      {customContent}
    </AppleMinimalistModal>

    {/* RACI Editor Modal */}
    {showRACIModal && (
      <RACIEditorModal
        isOpen={showRACIModal}
        onClose={() => setShowRACIModal(false)}
        item={phase}
        itemType="phase"
      />
    )}

    {/* Phase Deletion Impact Modal */}
    {showDeleteModal && currentProject && (
      <PhaseDeletionImpactModal
        phase={phase}
        allPhases={currentProject.phases}
        allResources={currentProject.resources || []}
        holidays={currentProject.holidays || []}
        onConfirm={async () => {
          await deletePhase(phaseId);
          setShowDeleteModal(false);
          onClose();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    )}
    </>
  );
}

export default EditPhaseModal;

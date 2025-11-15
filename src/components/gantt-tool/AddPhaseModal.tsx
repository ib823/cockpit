/**
 * AddPhaseModal - Apple Minimalist Design System
 *
 * Features:
 * - AppleMinimalistModal integration with unified UX
 * - Smart defaults (auto-fill dates, suggest phase name)
 * - Real-time validation with error display
 * - Keyboard shortcuts (Cmd+Enter to save)
 * - Working days calculation and display
 * - Color picker with presets
 * - EnhancedDatePickerWithMarkers support
 * - Full parity with EditPhaseModal design
 *
 * Migration: Converted from BaseModal to AppleMinimalistModal (2025-11-15)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { Calendar, PlusSquare } from "lucide-react";
import { AppleMinimalistModal } from "@/components/ui/AppleMinimalistModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { PHASE_COLOR_PRESETS } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import type { PhaseFormData } from "@/types/gantt-tool";

interface AddPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPhaseModal({ isOpen, onClose }: AddPhaseModalProps) {
  const { currentProject, addPhase } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PhaseFormData, string>>>({});

  // Form state with smart defaults
  const [formData, setFormData] = useState<PhaseFormData>({
    name: "",
    description: "",
    deliverables: "",
    color: PHASE_COLOR_PRESETS[0],
    startDate: "",
    endDate: "",
  });

  // Auto-focus on name field when modal opens
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with smart defaults
  useEffect(() => {
    if (isOpen && currentProject) {
      const phaseCount = currentProject.phases.length;
      const suggestedName = `Phase ${phaseCount + 1}`;

      // Smart date defaults
      let suggestedStartDate: string;
      let suggestedEndDate: string;

      if (phaseCount > 0) {
        // Start after the last phase
        const lastPhase = currentProject.phases[phaseCount - 1];
        const lastEndDate = new Date(lastPhase.endDate);
        suggestedStartDate = format(addDays(lastEndDate, 1), "yyyy-MM-dd");
        suggestedEndDate = format(addDays(lastEndDate, 30), "yyyy-MM-dd");
      } else {
        // First phase - use project start date
        const projectStart = new Date(currentProject.startDate);
        suggestedStartDate = format(projectStart, "yyyy-MM-dd");
        suggestedEndDate = format(addDays(projectStart, 30), "yyyy-MM-dd");
      }

      // Use next color in sequence
      const colorIndex = phaseCount % PHASE_COLOR_PRESETS.length;

      setFormData({
        name: suggestedName,
        description: "",
        deliverables: "",
        color: PHASE_COLOR_PRESETS[colorIndex],
        startDate: suggestedStartDate,
        endDate: suggestedEndDate,
      });

      setErrors({});

      // Focus name field after a brief delay
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select(); // Select the suggested name for easy replacement
      }, 100);
    }
  }, [isOpen, currentProject]);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addPhase(formData);
      onClose();
    } catch (error) {
      console.error("Failed to add phase:", error);
      setErrors({ name: "Failed to add phase. Please try again." });
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

  // Render custom content for color picker and working days
  const colorPickerContent = (
    <>
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
      <div>
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
    </>
  );

  return (
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Phase"
      subtitle="Create a new project phase with smart defaults"
      icon={<PlusSquare className="w-5 h-5" />}
      size="medium"
      formLayout="vertical"
      fields={fields}
      formValues={formData}
      onFieldChange={(fieldId, value) => handleChange(fieldId as keyof PhaseFormData, value)}
      primaryAction={{
        label: isSubmitting ? "Creating..." : "Create Phase",
        onClick: () => { void handleSubmit(new Event('submit') as any); },
        loading: isSubmitting,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
      }}
    >
      {colorPickerContent}
    </AppleMinimalistModal>
  );
}

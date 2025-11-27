/**
 * AddPhaseModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 * Source Pattern: /app/modal-design-showcase + AddTaskModal.tsx
 *
 * Features:
 * - Declarative form using FormExample
 * - Smart defaults (auto-fill dates, suggest phase name)
 * - Working days calculation
 * - Holiday-aware date picker
 * - Keyboard shortcuts (Cmd+Enter)
 * - Color picker with presets
 */

"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample, WorkingDaysIndicator } from "@/lib/design-system/showcase-helpers";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-system/tokens";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { PHASE_COLOR_PRESETS } from "@/types/gantt-tool";
import type { PhaseFormData } from "@/types/gantt-tool";

interface AddPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPhaseModal({ isOpen, onClose }: AddPhaseModalProps) {
  const { currentProject, addPhase } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state with smart defaults
  const [formData, setFormData] = useState<PhaseFormData>({
    name: "",
    description: "",
    deliverables: "",
    color: PHASE_COLOR_PRESETS[0],
    startDate: "",
    endDate: "",
    phaseType: "standard",
    amsDuration: 1,
  });

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

      setValidationErrors({});
    }
  }, [isOpen, currentProject]);

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Phase name is required";
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    // For standard phases, validate end date
    // For AMS phases, end date is auto-calculated, no validation needed
    if (formData.phaseType === "standard") {
      if (!formData.endDate) {
        errors.endDate = "End date is required";
      }

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end <= start) {
          errors.endDate = "End date must be after start date";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await addPhase(formData);
      onClose();
    } catch (error) {
      console.error("Failed to add phase:", error);
      alert("Failed to add phase. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, formData]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Phase"
      subtitle="Define a major project phase with timeline and visual identity"
      size="medium"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary" disabled={isSubmitting}>
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Phase"}
          </ModalButton>
        </>
      }
    >
      <FormExample
        fields={[
          {
            id: "name",
            label: "Phase Name",
            type: "text",
            value: formData.name,
            required: true,
            placeholder: formData.phaseType === "ams" ? "e.g., AMS Support Year 1" : "e.g., Discovery & Planning",
            error: validationErrors.name,
            helpText: "Clear, specific name for this phase",
          },
          {
            id: "description",
            label: "Description",
            type: "textarea",
            value: formData.description,
            placeholder: "What will be accomplished in this phase?",
            helpText: "Optional - describe the phase objectives",
          },
          {
            id: "deliverables",
            label: "Deliverables",
            type: "textarea",
            value: formData.deliverables,
            placeholder: "Expected outputs from this phase",
            helpText: "Optional - list the key deliverables",
          },
          {
            id: "startDate",
            label: formData.phaseType === "ams" ? "Contract Start Date" : "Start Date",
            type: "date",
            value: formData.startDate,
            required: true,
            error: validationErrors.startDate,
          },
          ...(formData.phaseType === "standard"
            ? [
                {
                  id: "endDate",
                  label: "End Date",
                  type: "date" as const,
                  value: formData.endDate,
                  required: true,
                  error: validationErrors.endDate,
                },
              ]
            : []),
        ]}
        onChange={(field, value) => {
          setFormData({ ...formData, [field]: value });
          const newErrors = { ...validationErrors };
          delete newErrors[field];
          setValidationErrors(newErrors);
        }}
        holidays={currentProject?.holidays || []}
      />

      {formData.phaseType === "standard" && (
        <WorkingDaysIndicator
          startDate={formData.startDate}
          endDate={formData.endDate}
          holidays={currentProject?.holidays || []}
        />
      )}

      {/* Phase Type Selector */}
      <div style={{ marginTop: SPACING[4] }}>
        <label
          style={{
            display: "block",
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.secondary,
            marginBottom: SPACING[2],
          }}
        >
          Phase Type
        </label>
        <div style={{ display: "flex", gap: SPACING[2] }}>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, phaseType: "standard" })}
            style={{
              flex: 1,
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: formData.phaseType === "standard" ? COLORS.blue : COLORS.bg.subtle,
              color: formData.phaseType === "standard" ? COLORS.text.inverse : COLORS.text.secondary,
              borderRadius: RADIUS.default,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              transition: "all 0.15s ease",
              cursor: "pointer",
            }}
          >
            Standard Phase
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, phaseType: "ams" })}
            style={{
              flex: 1,
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: formData.phaseType === "ams" ? COLORS.blue : COLORS.bg.subtle,
              color: formData.phaseType === "ams" ? COLORS.text.inverse : COLORS.text.secondary,
              borderRadius: RADIUS.default,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              transition: "all 0.15s ease",
              cursor: "pointer",
            }}
          >
            AMS Support
          </button>
        </div>
        {formData.phaseType === "ams" && (
          <p
            style={{
              marginTop: SPACING[2],
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
            }}
          >
            Application Management Services - long-term support contract (yearly basis)
          </p>
        )}
      </div>

      {/* AMS Duration Selector - Only shown for AMS phases */}
      {formData.phaseType === "ams" && (
        <div style={{ marginTop: SPACING[4] }}>
          <label
            style={{
              display: "block",
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
              marginBottom: SPACING[2],
            }}
          >
            AMS Contract Duration
          </label>
          <div style={{ display: "flex", gap: SPACING[2] }}>
            {([1, 2, 3] as const).map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => setFormData({ ...formData, amsDuration: years })}
                style={{
                  flex: 1,
                  padding: `${SPACING[3]} ${SPACING[4]}`,
                  backgroundColor: formData.amsDuration === years ? COLORS.blue : COLORS.bg.subtle,
                  color: formData.amsDuration === years ? COLORS.text.inverse : COLORS.text.secondary,
                  borderRadius: RADIUS.default,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
              >
                {years} {years === 1 ? "Year" : "Years"}
              </button>
            ))}
          </div>
          <p
            style={{
              marginTop: SPACING[2],
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
            }}
          >
            End date will be automatically calculated as: Start Date + {formData.amsDuration} year{formData.amsDuration > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </BaseModal>
  );
}

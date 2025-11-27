/**
 * EditPhaseModal - Exact Implementation from Modal Design Showcase
 *
 * IMPORTANT: This file follows the showcase pattern for phase editing
 * Source: /app/modal-design-showcase/page.tsx (Create Phase pattern adapted for edit)
 *
 * Design Philosophy:
 * - Simple, focused interface
 * - Phase name, dates, color picker
 * - Working days calculation
 * - Delete functionality
 *
 * DO NOT add features not in the showcase without updating showcase first
 *
 * @version 1.0.0 - Showcase Match
 * @created 2025-11-17
 */

"use client";

import { useState, useEffect } from "react";
import { format, addYears } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample, WorkingDaysIndicator } from "@/lib/design-system/showcase-helpers";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-system/tokens";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { Phase } from "@/types/gantt-tool";

interface EditPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  phase: Phase;
  phaseId: string;
}

export function EditPhaseModal({ isOpen, onClose, phase, phaseId }: EditPhaseModalProps) {
  const { currentProject, updatePhase, deletePhase } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - pre-populated with current phase data
  const [formData, setFormData] = useState({
    phaseName: phase.name,
    startDate: format(new Date(phase.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(phase.endDate), "yyyy-MM-dd"),
    phaseColor: phase.color,
    phaseType: phase.phaseType || "standard",
    amsDuration: phase.amsDuration || 1,
  });

  // Reset form when phase changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        phaseName: phase.name,
        startDate: format(new Date(phase.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(phase.endDate), "yyyy-MM-dd"),
        phaseColor: phase.color,
        phaseType: phase.phaseType || "standard",
        amsDuration: phase.amsDuration || 1,
      });
    }
  }, [isOpen, phase]);

  // Auto-calculate end date for AMS phases when start date or duration changes
  // CRITICAL: Wrapped in try-catch to prevent crashes on invalid date inputs
  useEffect(() => {
    if (formData.phaseType === "ams" && formData.startDate) {
      try {
        const startDate = new Date(formData.startDate);

        // Guard: Validate date is actually valid
        if (isNaN(startDate.getTime())) {
          console.warn("Invalid start date for AMS calculation:", formData.startDate);
          return;
        }

        const calculatedEndDate = format(
          addYears(startDate, formData.amsDuration),
          "yyyy-MM-dd"
        );

        if (formData.endDate !== calculatedEndDate) {
          setFormData(prev => ({ ...prev, endDate: calculatedEndDate }));
        }
      } catch (error) {
        console.error("Failed to calculate AMS end date:", error);
        // Graceful degradation: Don't update end date if calculation fails
      }
    }
  }, [formData.phaseType, formData.startDate, formData.amsDuration]);

  const isAMSPhase = formData.phaseType === "ams";

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.phaseName.trim()) {
      alert("Phase name is required");
      return;
    }

    if (!formData.startDate) {
      alert("Start date is required");
      return;
    }

    // For standard phases, validate end date manually
    // For AMS phases, end date is auto-calculated, so skip manual validation
    if (formData.phaseType === "standard") {
      if (!formData.endDate) {
        alert("End date is required");
        return;
      }

      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        alert("End date must be after start date");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await updatePhase(phaseId, {
        name: formData.phaseName,
        color: formData.phaseColor,
        startDate: formData.startDate,
        endDate: formData.endDate,
        phaseType: formData.phaseType,
        amsDuration: formData.phaseType === "ams" ? formData.amsDuration : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update phase:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete phase "${phase.name}"? This will also delete all tasks within this phase. This action cannot be undone.`)) {
      try {
        await deletePhase(phaseId);
        onClose();
      } catch (error) {
        console.error("Failed to delete phase:", error);
        alert("Failed to delete phase. Please try again.");
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Phase"
      subtitle={isAMSPhase ? "AMS Support Contract" : "Modify phase with timeline and visual identity"}
      size="medium"
      footer={
        <>
          <ModalButton onClick={handleDelete} variant="destructive">
            Delete Phase
          </ModalButton>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary">
            Save Changes
          </ModalButton>
        </>
      }
    >
      {/* AMS Badge - Visual indicator for contract type */}
      {isAMSPhase && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: SPACING[2],
            padding: `${SPACING[2]} ${SPACING[3]}`,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: RADIUS.default,
            marginBottom: SPACING[4],
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: "rgb(59, 130, 246)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "rgb(59, 130, 246)",
            }}
          />
          Application Management Services (AMS) Contract
        </div>
      )}

      <FormExample
        fields={[
          {
            id: "phaseName",
            label: "Phase Name",
            type: "text",
            value: formData.phaseName,
            required: true,
            placeholder: isAMSPhase ? "e.g., AMS Support Year 1" : "e.g., Discovery & Planning",
          },
          {
            id: "startDate",
            label: isAMSPhase ? "Contract Start Date" : "Start Date",
            type: "date",
            value: formData.startDate,
            required: true,
          },
        ]}
        onChange={(field, value) => {
          setFormData({ ...formData, [field]: value });
        }}
        holidays={currentProject?.holidays || []}
      />

      {/* AMS Duration Selector - Only shown for AMS phases */}
      {isAMSPhase && (
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
            Contract Duration
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
                  border: "none",
                }}
              >
                {years} {years === 1 ? "Year" : "Years"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* End Date - READ-ONLY for AMS with clear visual distinction */}
      {isAMSPhase ? (
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
            Contract End Date (Auto-calculated)
          </label>
          <input
            type="date"
            value={formData.endDate}
            disabled
            style={{
              width: "100%",
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: "rgba(0, 0, 0, 0.03)", // Lighter background to indicate read-only
              border: "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: RADIUS.default,
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.body,
              color: COLORS.text.tertiary,
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          />
          <p
            style={{
              marginTop: SPACING[2],
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.tertiary,
              fontFamily: TYPOGRAPHY.fontFamily.text,
            }}
          >
            {(() => {
              try {
                const start = new Date(formData.startDate);
                const end = new Date(formData.endDate);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                  return "Select a valid start date to calculate end date";
                }
                return (
                  <>
                    Automatically calculated as: <strong>{format(start, "MMM d, yyyy")}</strong> + {formData.amsDuration} {formData.amsDuration === 1 ? "year" : "years"} = <strong>{format(end, "MMM d, yyyy")}</strong>
                  </>
                );
              } catch (error) {
                return "Select a valid start date to calculate end date";
              }
            })()}
          </p>
        </div>
      ) : (
        <FormExample
          fields={[
            {
              id: "endDate",
              label: "End Date",
              type: "date",
              value: formData.endDate,
              required: true,
            },
          ]}
          onChange={(field, value) => {
            setFormData({ ...formData, [field]: value });
          }}
          holidays={currentProject?.holidays || []}
        />
      )}

      {/* Contract Summary Info Box - Only for AMS */}
      {isAMSPhase && (
        <div
          style={{
            marginTop: SPACING[4],
            padding: SPACING[4],
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
            borderRadius: RADIUS.default,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.secondary,
              marginBottom: SPACING[2],
            }}
          >
            Contract Summary
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2] }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                Duration:
              </span>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                {formData.amsDuration} {formData.amsDuration === 1 ? "Year" : "Years"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                Start Date:
              </span>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                {(() => {
                  try {
                    const start = new Date(formData.startDate);
                    return isNaN(start.getTime()) ? "Not set" : format(start, "MMM d, yyyy");
                  } catch {
                    return "Not set";
                  }
                })()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                End Date:
              </span>
              <span style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                {(() => {
                  try {
                    const end = new Date(formData.endDate);
                    return isNaN(end.getTime()) ? "Not set" : format(end, "MMM d, yyyy");
                  } catch {
                    return "Not set";
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Working Days Indicator - Only shown for standard phases */}
      {!isAMSPhase && (
        <WorkingDaysIndicator
          startDate={formData.startDate}
          endDate={formData.endDate}
          holidays={currentProject?.holidays || []}
        />
      )}
    </BaseModal>
  );
}

export default EditPhaseModal;

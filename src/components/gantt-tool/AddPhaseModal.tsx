/**
 * AddPhaseModal - Apple HIG-compliant modal for creating new phases
 *
 * Features:
 * - BaseModal integration with consistent UX
 * - Smart defaults (auto-fill dates, suggest phase name)
 * - Real-time validation
 * - Keyboard shortcuts (Cmd+Enter to save)
 * - Working days calculation
 * - Color picker with presets
 * - HolidayAwareDatePicker (matching EditPhaseModal)
 * - Full parity with EditPhaseModal design
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { Calendar, Palette, PlusSquare } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { PHASE_COLOR_PRESETS } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import type { PhaseFormData } from "@/types/gantt-tool";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Phase"
      subtitle="Create a new project phase with smart defaults"
      icon={<PlusSquare className="w-5 h-5" />}
      size="medium"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={() => { void handleSubmit(new Event('submit') as any); }}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create Phase"}
          </ModalButton>
        </>
      }
    >
      <form onSubmit={(e) => { void handleSubmit(e); }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Phase Name */}
        <div>
          <label
            htmlFor="phase-name"
            style={{
              display: "block",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#1D1D1F",
              marginBottom: "8px",
            }}
          >
            Phase Name
          </label>
          <input
            ref={nameInputRef}
            id="phase-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Requirements Gathering"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              color: "#1D1D1F",
              backgroundColor: errors.name ? "#FFF5F5" : "#F5F5F7",
              border: errors.name ? "2px solid #FF3B30" : "2px solid transparent",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.15s ease",
            }}
            onFocus={(e) => {
              if (!errors.name) {
                e.target.style.backgroundColor = "#FFFFFF";
                e.target.style.borderColor = "#007AFF";
              }
            }}
            onBlur={(e) => {
              if (!errors.name) {
                e.target.style.backgroundColor = "#F5F5F7";
                e.target.style.borderColor = "transparent";
              }
            }}
          />
          {errors.name && (
            <p style={{
              fontFamily: "var(--font-text)",
              fontSize: "12px",
              color: "#FF3B30",
              marginTop: "6px",
            }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="phase-description"
            style={{
              display: "block",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#1D1D1F",
              marginBottom: "8px",
            }}
          >
            Description <span style={{ color: "#86868B", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="phase-description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="What happens during this phase?"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              color: "#1D1D1F",
              backgroundColor: "#F5F5F7",
              border: "2px solid transparent",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.15s ease",
              resize: "vertical",
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = "#FFFFFF";
              e.target.style.borderColor = "#007AFF";
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = "#F5F5F7";
              e.target.style.borderColor = "transparent";
            }}
          />
        </div>

        {/* Deliverables */}
        <div>
          <label
            htmlFor="phase-deliverables"
            style={{
              display: "block",
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#1D1D1F",
              marginBottom: "8px",
            }}
          >
            Deliverables <span style={{ color: "#86868B", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="phase-deliverables"
            value={formData.deliverables}
            onChange={(e) => handleChange("deliverables", e.target.value)}
            placeholder="Key outputs and artifacts"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontFamily: "var(--font-text)",
              fontSize: "15px",
              color: "#1D1D1F",
              backgroundColor: "#F5F5F7",
              border: "2px solid transparent",
              borderRadius: "8px",
              outline: "none",
              transition: "all 0.15s ease",
              resize: "vertical",
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = "#FFFFFF";
              e.target.style.borderColor = "#007AFF";
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = "#F5F5F7";
              e.target.style.borderColor = "transparent";
            }}
          />
        </div>

        {/* Date Range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Start Date */}
          <div>
            <label
              htmlFor="phase-start-date"
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1D1D1F",
                marginBottom: "8px",
              }}
            >
              Start Date
            </label>
            <HolidayAwareDatePicker
              value={formData.startDate}
              onChange={(date) => handleChange("startDate", date)}
              region={currentProject?.orgChartPro?.location || "ABMY"}
              error={errors.startDate}
              size="medium"
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="phase-end-date"
              style={{
                display: "block",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1D1D1F",
                marginBottom: "8px",
              }}
            >
              End Date
            </label>
            <HolidayAwareDatePicker
              value={formData.endDate}
              onChange={(date) => handleChange("endDate", date)}
              region={currentProject?.orgChartPro?.location || "ABMY"}
              error={errors.endDate}
              size="medium"
            />
          </div>
        </div>

        {/* Working Days Display */}
        {workingDays > 0 && (
          <div style={{
            padding: "12px 16px",
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

        {/* Keyboard Shortcut Hint */}
        <div style={{
          fontFamily: "var(--font-text)",
          fontSize: "12px",
          color: "#86868B",
          textAlign: "center",
          paddingTop: "8px",
        }}>
          Press <kbd style={{ padding: "2px 6px", backgroundColor: "#F5F5F7", borderRadius: "4px", fontWeight: 600 }}>⌘</kbd> + <kbd style={{ padding: "2px 6px", backgroundColor: "#F5F5F7", borderRadius: "4px", fontWeight: 600 }}>Enter</kbd> to create
        </div>
      </form>
    </BaseModal>
  );
}

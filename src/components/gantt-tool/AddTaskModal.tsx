/**
 * AddTaskModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 * Source Pattern: /app/modal-design-showcase + EditTaskModal.tsx
 *
 * Features:
 * - Declarative form using FormExample
 * - Smart phase-based defaults
 * - Working days calculation
 * - Holiday-aware date picker
 * - Keyboard shortcuts (Cmd+Enter)
 */

"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample, WorkingDaysIndicator } from "@/lib/design-system/showcase-helpers";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { TaskFormData } from "@/types/gantt-tool";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPhaseId?: string;
}

export function AddTaskModal({ isOpen, onClose, preselectedPhaseId }: AddTaskModalProps) {
  const { currentProject, addTask } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deliverables: "",
    phaseId: preselectedPhaseId || "",
    startDate: "",
    endDate: "",
  });

  // Initialize form with smart defaults
  useEffect(() => {
    if (isOpen && currentProject) {
      const selectedPhaseId = preselectedPhaseId || (currentProject.phases.length > 0 ? currentProject.phases[0].id : "");
      const phase = currentProject.phases.find(p => p.id === selectedPhaseId);

      if (phase) {
        const taskCount = phase.tasks.length;
        const suggestedName = `Task ${taskCount + 1}`;

        let suggestedStartDate: string;
        let suggestedEndDate: string;

        if (taskCount > 0) {
          const lastTask = phase.tasks[taskCount - 1];
          const lastEndDate = new Date(lastTask.endDate);
          const phaseEndDate = new Date(phase.endDate);

          suggestedStartDate = format(addDays(lastEndDate, 1), "yyyy-MM-dd");
          const proposedEndDate = addDays(lastEndDate, 7);
          suggestedEndDate = format(proposedEndDate > phaseEndDate ? phaseEndDate : proposedEndDate, "yyyy-MM-dd");
        } else {
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);
          suggestedStartDate = format(phaseStart, "yyyy-MM-dd");
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
        });
      }

      setValidationErrors({});
    }
  }, [isOpen, currentProject, preselectedPhaseId]);

  // Update dates when phase changes
  const handlePhaseChange = (newPhaseId: string) => {
    if (!currentProject) return;

    const newPhase = currentProject.phases.find(p => p.id === newPhaseId);
    if (!newPhase) return;

    const taskCount = newPhase.tasks.length;
    const suggestedName = `Task ${taskCount + 1}`;

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

    setFormData(prev => ({
      ...prev,
      name: suggestedName,
      phaseId: newPhaseId,
      startDate: suggestedStartDate,
      endDate: suggestedEndDate,
    }));
  };

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Task name is required";
    }

    if (!formData.phaseId) {
      errors.phaseId = "Please select a phase";
    }

    // Check if trying to add task to AMS phase that already has 1 task
    const selectedPhase = currentProject?.phases.find(p => p.id === formData.phaseId);
    const isAMSPhase = selectedPhase?.phaseType === 'ams';

    if (selectedPhase?.phaseType === 'ams' && (selectedPhase?.tasks?.length ?? 0) >= 1) {
      errors.phaseId = "AMS phases can only have one task. This phase already has a task.";
    }

    // Date validation - not required for AMS phases
    if (!isAMSPhase && !formData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!isAMSPhase && !formData.endDate) {
      errors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        errors.endDate = "End date must be after start date";
      }

      if (currentProject && formData.phaseId) {
        const phase = currentProject.phases.find(p => p.id === formData.phaseId);
        if (phase && phase.phaseType !== 'ams') {
          const phaseStart = new Date(phase.startDate);
          const phaseEnd = new Date(phase.endDate);

          if (start < phaseStart || end > phaseEnd) {
            errors.startDate = "Task dates must fall within phase boundaries";
            errors.endDate = `Phase: ${format(phaseStart, "MMM d")} - ${format(phaseEnd, "MMM d, yyyy")}`;
          }
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
      const taskData: TaskFormData = {
        name: formData.name,
        description: formData.description,
        deliverables: formData.deliverables,
        phaseId: formData.phaseId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assignee: "",
        dependencies: [],
        isAMS: false,
        amsRateType: "daily",
        amsFixedRate: 0,
        amsMinimumDuration: 12,
        amsNotes: "",
      };

      await addTask(taskData);
      onClose();
    } catch (error) {
      console.error("Failed to add task:", error);
      alert("Failed to add task. Please try again.");
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

  // Get phase options
  const phaseOptions = !currentProject || currentProject.phases.length === 0
    ? [{ value: "", label: "No phases available - create a phase first" }]
    : [
        { value: "", label: "Select a phase..." },
        ...currentProject.phases.map((phase) => ({
          value: phase.id,
          label: `${phase.name} (${format(new Date(phase.startDate), "MMM d")} - ${format(new Date(phase.endDate), "MMM d, yyyy")})`,
        })),
      ];

  // Check if selected phase is AMS
  const selectedPhase = currentProject?.phases.find(p => p.id === formData.phaseId);
  const isAMSPhase = selectedPhase?.phaseType === 'ams';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      subtitle="Add a task to the current phase with dates and details"
      size="medium"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </ModalButton>
        </>
      }
    >
      <FormExample
        fields={[
          {
            id: "name",
            label: "Task Name",
            type: "text",
            value: formData.name,
            required: true,
            placeholder: "e.g., Design Review Sprint",
            error: validationErrors.name,
            helpText: "Clear, specific name describing the deliverable",
          },
          {
            id: "description",
            label: "Description",
            type: "textarea",
            value: formData.description,
            placeholder: "What will be accomplished in this task?",
            helpText: "Brief context for team members (optional)",
          },
          {
            id: "deliverables",
            label: "Deliverables",
            type: "textarea",
            value: formData.deliverables,
            placeholder: "Expected outputs",
            helpText: "List the key deliverables (optional)",
          },
          {
            id: "phaseId",
            label: "Phase",
            type: "select",
            value: formData.phaseId,
            required: true,
            options: phaseOptions,
            error: validationErrors.phaseId,
          },
          {
            id: "startDate",
            label: "Start Date",
            type: "date",
            value: formData.startDate,
            required: !isAMSPhase,
            disabled: isAMSPhase,
            error: validationErrors.startDate,
            helpText: isAMSPhase ? "AMS tasks do not have specific start dates - they are ongoing based on SLA" : undefined,
          },
          {
            id: "endDate",
            label: "End Date",
            type: "date",
            value: formData.endDate,
            required: !isAMSPhase,
            disabled: isAMSPhase,
            error: validationErrors.endDate,
            helpText: isAMSPhase ? "AMS tasks do not have specific end dates - they run for the duration of the contract" : undefined,
          },
        ]}
        onChange={(field, value) => {
          if (field === "phaseId") {
            handlePhaseChange(value);
          } else {
            setFormData({ ...formData, [field]: value });
            const newErrors = { ...validationErrors };
            delete newErrors[field];
            setValidationErrors(newErrors);
          }
        }}
        holidays={currentProject?.holidays || []}
      />

      <WorkingDaysIndicator
        startDate={formData.startDate}
        endDate={formData.endDate}
        holidays={currentProject?.holidays || []}
      />
    </BaseModal>
  );
}

/**
 * EditTaskModal - Exact Implementation from Modal Design Showcase
 *
 * IMPORTANT: This file is a 1:1 copy of the showcase pattern
 * Source: /app/modal-design-showcase/page.tsx (lines 354-414)
 *
 * Design Philosophy:
 * - Simple, focused interface
 * - Impact warnings upfront
 * - Clear form fields
 * - Working days calculation
 *
 * DO NOT add features not in the showcase without updating showcase first
 *
 * @version 1.0.0 - Showcase Match
 * @created 2025-11-17
 */

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample, WorkingDaysIndicator, ImpactWarning } from "@/lib/design-system/showcase-helpers";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { Task } from "@/types/gantt-tool";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  taskId: string;
  phaseId: string;
}

export function EditTaskModal({ isOpen, onClose, task, taskId, phaseId }: EditTaskModalProps) {
  const { currentProject, updateTask, deleteTask } = useGanttToolStore();
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [_showDeleteModal, _setShowDeleteModal] = useState(false);

  // Form state - pre-populated with current task data
  const [formData, setFormData] = useState({
    taskName: task.name,
    description: task.description || "",
    startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(task.endDate), "yyyy-MM-dd"),
  });

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        taskName: task.name,
        description: task.description || "",
        startDate: format(new Date(task.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(task.endDate), "yyyy-MM-dd"),
      });
    }
  }, [isOpen, task]);

  // Calculate impact warning
  const getImpactWarning = () => {
    if (!currentProject) return null;

    const newStart = new Date(formData.startDate);
    const newEnd = new Date(formData.endDate);
    const oldStart = new Date(task.startDate);
    const oldEnd = new Date(task.endDate);

    // Check if dates are changing
    if (newStart.getTime() !== oldStart.getTime() || newEnd.getTime() !== oldEnd.getTime()) {
      const assignmentCount = task.resourceAssignments?.length || 0;
      if (assignmentCount > 0) {
        return `Changing dates will affect ${assignmentCount} resource allocation${assignmentCount > 1 ? 's' : ''} and downstream dependencies`;
      }
    }

    return null;
  };

  const impactWarning = getImpactWarning();

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.taskName.trim()) {
      alert("Task name is required");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Start and end dates are required");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Only update the fields that are editable in this simplified modal
      // All other fields (resourceAssignments, raciAssignments, etc.) are preserved by Object.assign
      await updateTask(taskId, phaseId, {
        name: formData.taskName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        // Note: phaseId is NOT included here - it's already a parameter and shouldn't change
      });
      onClose();
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
      deleteTask(taskId, phaseId);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      subtitle="Modify task details - changes may impact resources and timeline"
      size="medium"
      footer={
        <>
          <ModalButton onClick={handleDelete} variant="destructive">
            Delete Task
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
      {impactWarning && (
        <ImpactWarning
          severity="medium"
          message={impactWarning}
        />
      )}

      <FormExample
        fields={[
          {
            id: "taskName",
            label: "Task Name",
            type: "text",
            value: formData.taskName,
            required: true,
          },
          {
            id: "description",
            label: "Description",
            type: "textarea",
            value: formData.description,
          },
          {
            id: "startDate",
            label: "Start Date",
            type: "date",
            value: formData.startDate,
            required: true,
          },
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

      <WorkingDaysIndicator
        startDate={formData.startDate}
        endDate={formData.endDate}
        holidays={currentProject?.holidays || []}
      />
    </BaseModal>
  );
}

export default EditTaskModal;

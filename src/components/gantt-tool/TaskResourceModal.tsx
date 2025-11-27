/**
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 *
 * Task Resource Modal
 * Pattern: "Allocate Resources" from showcase (lines 809-827, 1970-2022)
 */

"use client";

import { useState } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample } from "@/lib/design-system/showcase-helpers";

interface TaskResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName?: string;
  currentAllocations?: Array<{
    id: string;
    name: string;
    allocation: number;
  }>;
  onSave: (resourceId: string, allocation: string, notes: string) => void;
}

export function TaskResourceModal({
  isOpen,
  onClose,
  taskName = "Design Review Sprint",
  currentAllocations = [],
  onSave,
}: TaskResourceModalProps) {
  const [resource, setResource] = useState("");
  const [allocation, setAllocation] = useState("50");
  const [notes, setNotes] = useState("");

  const handleChange = (field: string, value: string) => {
    if (field === "resource") setResource(value);
    else if (field === "allocation") setAllocation(value);
    else if (field === "notes") setNotes(value);
  };

  const handleSave = () => {
    onSave(resource, allocation, notes);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Resources"
      subtitle="Assign team members to this task with allocation percentage"
      size="medium"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSave} variant="primary">
            Save Allocation
          </ModalButton>
        </>
      }
    >
      <FormExample
        fields={[
          {
            id: "resource",
            label: "Select Resource",
            type: "select",
            value: resource,
            options: [
              { value: "", label: "Choose a team member..." },
              { value: "1", label: "Sarah Chen - Senior Designer" },
              { value: "2", label: "Mike Ross - Lead Developer" },
              { value: "3", label: "Emma Wilson - Project Manager" },
            ],
            required: true,
          },
          {
            id: "allocation",
            label: "Allocation Percentage",
            type: "text",
            value: allocation,
            required: true,
            helpText: "Percentage of this person's time allocated to this task (0-100)",
          },
          {
            id: "notes",
            label: "Notes",
            type: "textarea",
            value: notes,
            placeholder: "Any specific responsibilities or notes...",
          },
        ]}
        onChange={handleChange}
      />

      {/* Current Allocations Display */}
      <div style={{
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#F5F5F7",
        borderRadius: "8px",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D1D1F", marginBottom: "12px" }}>
          Current Allocations
        </div>
        {currentAllocations.length > 0 ? (
          <div style={{ fontSize: "13px", color: "#6B7280" }}>
            {currentAllocations.map((alloc) => (
              <div key={alloc.id} style={{ marginBottom: "4px" }}>
                {alloc.name} - {alloc.allocation}%
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "#6B7280" }}>
            No resources allocated yet
          </div>
        )}
      </div>
    </BaseModal>
  );
}

/**
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 *
 * Conflict Resolution Modal
 * Pattern: "Resolve Data Conflicts" from showcase (lines 709-727, 1590-1653)
 */

"use client";

import { useState } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample } from "@/lib/design-system/showcase-helpers";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictCount: number;
  conflicts: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onResolve: (strategy: string) => void;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflictCount = 3,
  conflicts = [],
  onResolve,
}: ConflictResolutionModalProps) {
  const [strategy, setStrategy] = useState("merge");

  const handleApply = () => {
    onResolve(strategy);
    onClose();
  };

  // Default conflicts if none provided
  const displayConflicts = conflicts.length > 0
    ? conflicts
    : [
        { id: "1", name: "Phase: Implementation", type: "phase" },
        { id: "2", name: "Task: Design Review", type: "task" },
        { id: "3", name: "Resource: Sarah Chen", type: "resource" },
      ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Data Conflicts"
      subtitle="Choose how to handle conflicts between imported and existing data"
      size="large"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel Import
          </ModalButton>
          <ModalButton onClick={handleApply} variant="primary">
            Apply Strategy
          </ModalButton>
        </>
      }
    >
      {/* Yellow Warning Box */}
      <div style={{
        padding: "16px",
        backgroundColor: "#FEF3C7",
        border: "1px solid #FCD34D",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#92400E", margin: "0 0 4px 0" }}>
              {conflictCount} Conflicts Detected
            </p>
            <p style={{ fontSize: "13px", color: "#92400E", margin: 0, lineHeight: 1.5 }}>
              Imported data contains phases and tasks that conflict with existing data.
            </p>
          </div>
        </div>
      </div>

      {/* Strategy Dropdown */}
      <FormExample
        fields={[
          {
            id: "strategy",
            label: "Resolution Strategy",
            type: "select",
            value: strategy,
            options: [
              { value: "merge", label: "Smart Merge (keep both, rename conflicts)" },
              { value: "replace", label: "Total Refresh (replace all existing data)" },
              { value: "skip", label: "Skip Conflicts (keep existing, ignore imported)" },
            ],
            helpText: "Choose how to handle conflicts between imported and existing data",
          },
        ]}
        onChange={(field, value) => setStrategy(value)}
      />

      {/* Conflicts Preview */}
      <div style={{ marginTop: "24px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "12px" }}>
          Conflicts Preview
        </h4>
        <div style={{
          border: "1px solid rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          {displayConflicts.map((conflict, idx) => (
            <div key={conflict.id} style={{
              padding: "12px 16px",
              borderBottom: idx < displayConflicts.length - 1 ? "1px solid rgba(0, 0, 0, 0.05)" : "none",
              fontSize: "13px",
              color: "#6B7280",
            }}>
              {conflict.name}
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}

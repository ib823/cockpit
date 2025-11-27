/**
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 *
 * Resource Planning Modal
 * Pattern: "Resource Planning" from showcase (lines 746-764, 1728-1809)
 */

"use client";

import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface ResourcePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ResourcePlanningModal({
  isOpen,
  onClose,
  onSave,
}: ResourcePlanningModalProps) {
  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Resource Planning"
      subtitle="Build your team structure aligned with client organization"
      size="xlarge"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleSave} variant="primary">
            Save Team Structure
          </ModalButton>
        </>
      }
    >
      {/* Blue Info Box */}
      <div style={{
        padding: "16px",
        backgroundColor: "#F0F9FF",
        border: "1px solid #BAE6FD",
        borderRadius: "8px",
        marginBottom: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#1E40AF", margin: 0 }}>
          Build your team structure aligned with the client's organization. Define roles, reporting lines, and calculate costs.
        </p>
      </div>

      {/* Hierarchical Tree Mockup */}
      <div style={{
        border: "1px solid rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#FAFAFA",
      }}>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "8px" }}>
            Client Organization
          </div>
          <div style={{ paddingLeft: "16px", borderLeft: "2px solid #E5E5EA" }}>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
              └─ IT Division
            </div>
            <div style={{ paddingLeft: "16px", borderLeft: "2px solid #E5E5EA" }}>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
                └─ Digital Transformation
              </div>
              <div style={{ paddingLeft: "16px" }}>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  └─ Project Team
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F", marginBottom: "8px" }}>
            Your Team Structure
          </div>
          <div style={{
            padding: "12px",
            backgroundColor: "white",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#6B7280",
          }}>
            <div>Project Manager - $850/day</div>
            <div style={{ paddingLeft: "16px", marginTop: "8px" }}>
              ├─ Lead Designer - $650/day
            </div>
            <div style={{ paddingLeft: "16px", marginTop: "4px" }}>
              ├─ Senior Developer - $700/day
            </div>
            <div style={{ paddingLeft: "16px", marginTop: "4px" }}>
              └─ QA Specialist - $550/day
            </div>
          </div>
        </div>

        {/* Cost Summary Box */}
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#F0FDF4",
          border: "1px solid #86EFAC",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#166534",
        }}>
          <strong>Total Daily Rate:</strong> $2,750 • <strong>Monthly (20 days):</strong> $55,000
        </div>
      </div>
    </BaseModal>
  );
}

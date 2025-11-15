"use client";

import type { CurrentSystem } from "../types";
import { Package } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface ReuseSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemsToKeep: CurrentSystem[];
  onReuse: (system: CurrentSystem) => void;
}

export function ReuseSystemModal({
  isOpen,
  onClose,
  systemsToKeep,
  onReuse,
}: ReuseSystemModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reuse System from AS-IS"
      subtitle="Select a system from your Current Landscape that was marked with the KEEP status"
      icon={<Package className="w-6 h-6" />}
      size="medium"
      footer={
        <ModalButton variant="secondary" onClick={onClose}>
          Close
        </ModalButton>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#86868B",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          It will be added to the selected phase as a "REUSED" component.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {systemsToKeep.length > 0 ? (
            systemsToKeep.map((system) => (
              <button
                key={system.id}
                onClick={() => {
                  onReuse(system);
                  onClose();
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "#F5F5F7",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E8E8ED";
                  e.currentTarget.style.borderColor = "#007AFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F5F5F7";
                  e.currentTarget.style.borderColor = "#D1D1D6";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Package className="w-5 h-5" style={{ color: "#007AFF", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                        marginBottom: "4px",
                      }}
                    >
                      {system.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "13px",
                        color: "#86868B",
                      }}
                    >
                      {system.vendor} - ({system.modules.join(", ")})
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "#86868B",
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                border: "2px dashed #D1D1D6",
                borderRadius: "8px",
                backgroundColor: "#FAFAFA",
              }}
            >
              No systems marked as "KEEP" in the Current Landscape (AS-IS) tab.
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

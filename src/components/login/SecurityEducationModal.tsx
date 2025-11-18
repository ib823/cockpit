"use client";

import { AlertTriangle } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface SecurityEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function SecurityEducationModal({
  isOpen,
  onClose,
  onAccept,
}: SecurityEducationModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Use Personal Devices Only"
      icon={<AlertTriangle className="w-6 h-6" style={{ color: "#FF9500" }} />}
      size="small"
      preventClose={true}
      preventEscapeClose={true}
      footer={
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <ModalButton variant="primary" onClick={onAccept}>
            Understood
          </ModalButton>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            color: "#1D1D1F",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Your phone, laptop, or tablet
        </p>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#1D1D1F",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Never on shared or public devices
        </p>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#86868B",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Does not work in private browsing (e.g., incognito, Tor)
        </p>
      </div>
    </BaseModal>
  );
}

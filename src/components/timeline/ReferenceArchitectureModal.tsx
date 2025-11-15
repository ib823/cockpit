"use client";

import { Download, Layers } from "lucide-react";
import BaseModal from "@/components/ui/BaseModal";
import { ComprehensiveReferenceArchitecture } from "./ComprehensiveReferenceArchitecture";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceArchitectureModal({ isOpen, onClose }: Props) {
  const handleExport = () => {
    // Export functionality - print to PDF
    window.print();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Implementation Reference"
      subtitle="Comprehensive SAP project architecture and planning"
      icon={<Layers />}
      size="fullscreen"
      footerActions={[
        {
          label: "Export PDF",
          onClick: handleExport,
          variant: "primary",
          icon: Download,
        },
      ]}
    >
      <ComprehensiveReferenceArchitecture />
    </BaseModal>
  );
}

/**
 * Celebration Modal
 *
 * Displays a celebratory message when milestones are achieved
 */

"use client";

import { Sparkles } from "lucide-react";
import BaseModal from "@/components/ui/BaseModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function CelebrationModal({
  isOpen,
  onClose,
  title = "Congratulations!",
  message = "You've achieved an important milestone!"
}: Props) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<Sparkles />}
      size="medium"
      footerActions={[
        {
          label: "Continue",
          onClick: onClose,
          variant: "primary",
        },
      ]}
    >
      <div className="text-center py-6">
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </BaseModal>
  );
}

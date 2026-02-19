"use client";

import { useState } from "react";
import { CheckCircle, Mail, Check } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  code: string;
  magicUrl?: string;
}

export default function AccessCodeModal({
  isOpen,
  onClose,
  email,
  code,
  magicUrl,
}: AccessCodeModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyLink = async () => {
    if (!magicUrl) return;
    try {
      await navigator.clipboard.writeText(magicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenEmail = () => {
    const subject = "Welcome to Cockpit - Your Access is Ready!";

    const bodyText = `Hi there,

Welcome to Cockpit! Your access has been approved and you're all set to get started.

Choose your preferred way to login:

========================================

MAGIC LINK (Quick Login)
${magicUrl || "N/A"}
Expires in: 2 minutes

========================================

6-DIGIT CODE (Manual Entry)
${code}
Expires in: 7 days

========================================

How to Get Started:

Option 1 (Recommended):
- Click the magic link above for instant access
- Set up your passkey (fingerprint/Face ID)
- Done! You're logged in

Option 2 (Manual):
- Visit the login page
- Enter your email
- Enter the 6-digit code above
- Set up your passkey
- Start using Cockpit!

========================================

Security Tip:
After setup, you'll use your device's passkey (fingerprint or Face ID) to sign in. No passwords needed!

Need help? Reply to this email or contact your admin.

Best regards,
The Cockpit Team

========================================
This is an automated message from Cockpit.`;

    // Create mailto link
    const mailtoLink = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    // Try to open in a new window first (more reliable)
    const opened = window.open(mailtoLink, "_blank");

    // Fallback to direct location change if popup blocked
    if (!opened) {
      window.location.href = mailtoLink;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Access Approved!"
      subtitle={
        <>
          Access code ready for <span className="font-semibold text-[var(--color-text-primary)]">{email}</span>
        </>
      }
      icon={<CheckCircle className="w-6 h-6 text-[var(--color-green)]" />}
      size="medium"
      footer={
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleOpenEmail}
            className="w-full py-3 px-5 font-[var(--font-text)] text-sm font-semibold bg-[var(--color-blue)] text-white border-none rounded-[var(--radius-md)] cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150 hover:brightness-90"
          >
            <Mail className="w-5 h-5" />
            Compose Email (Manual Send)
          </button>
          <ModalButton variant="secondary" onClick={onClose}>
            Done
          </ModalButton>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Warning Banner */}
        <div className="py-3 px-4 bg-[var(--color-orange-light)] border border-[rgba(255,149,0,0.2)] rounded-[var(--radius-md)] font-[var(--font-text)] text-[13px] text-[var(--color-orange)] text-center">
          No email sent - Share manually with user
        </div>

        {/* Magic Link Section */}
        {magicUrl && (
          <div>
            <div className="text-center mb-3">
              <h3 className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Magic Link
              </h3>
              <p className="font-[var(--font-text)] text-xs text-[var(--color-text-tertiary)] m-0">
                Expires in 2 minutes
              </p>
            </div>
            <div className="relative">
              <div className="bg-[var(--color-blue-light)] border-2 border-[rgba(0,122,255,0.2)] rounded-[var(--radius-md)] p-4 overflow-hidden">
                <p className="font-mono text-xs text-[var(--color-blue)] text-center m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {magicUrl}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 py-1.5 px-3 bg-[var(--color-blue)] text-white border-none rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors duration-150 hover:brightness-90"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  "Copy"
                )}
              </button>
            </div>
          </div>
        )}

        {/* 6-Digit Code Section */}
        <div>
          <div className="text-center mb-3">
            <h3 className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              6-Digit Code
            </h3>
            <p className="font-[var(--font-text)] text-xs text-[var(--color-text-tertiary)] m-0">
              Expires in 7 days
            </p>
          </div>
          <div className="relative">
            <div className="bg-[var(--color-bg-secondary)] border-2 border-[var(--color-gray-4)] rounded-[var(--radius-md)] p-6">
              <p className="font-mono text-4xl font-bold text-[var(--color-text-primary)] text-center m-0 tracking-widest">
                {code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="absolute right-2 top-1/2 -translate-y-1/2 py-1.5 px-3 bg-[var(--color-text-primary)] text-white border-none rounded-[var(--radius-sm)] text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors duration-150 hover:brightness-90"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

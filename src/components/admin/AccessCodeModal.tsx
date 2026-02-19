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
          Access code ready for <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{email}</span>
        </>
      }
      icon={<CheckCircle className="w-6 h-6" style={{ color: "#34C759" }} />}
      size="medium"
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <button
            onClick={handleOpenEmail}
            style={{
              width: "100%",
              padding: "12px 20px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: "#007AFF",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0051D5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007AFF")}
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
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Warning Banner */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(255, 149, 0, 0.1)",
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#D97706",
            textAlign: "center",
          }}
        >
          No email sent - Share manually with user
        </div>

        {/* Magic Link Section */}
        {magicUrl && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "#1D1D1F", margin: "0 0 4px 0" }}>
                Magic Link
              </h3>
              <p style={{ fontFamily: "var(--font-text)", fontSize: "12px", color: "#86868B", margin: 0 }}>
                Expires in 2 minutes
              </p>
            </div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  backgroundColor: "rgba(0, 122, 255, 0.05)",
                  border: "2px solid rgba(0, 122, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "16px",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#007AFF",
                    textAlign: "center",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {magicUrl}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: "6px 12px",
                  backgroundColor: "#007AFF",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0051D5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007AFF")}
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
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 600, color: "#1D1D1F", margin: "0 0 4px 0" }}>
              6-Digit Code
            </h3>
            <p style={{ fontFamily: "var(--font-text)", fontSize: "12px", color: "#86868B", margin: 0 }}>
              Expires in 7 days
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{
                backgroundColor: "#F5F5F7",
                border: "2px solid #D1D1D6",
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  textAlign: "center",
                  margin: 0,
                  letterSpacing: "0.1em",
                }}
              >
                {code}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 12px",
                backgroundColor: "#1D1D1F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#000000")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1D1D1F")}
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

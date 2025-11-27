/**
 * SyncErrorRecoveryModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to use design tokens (no Tailwind)
 * Source Pattern: BaseModal + design tokens
 *
 * Features:
 * - Clear error messaging
 * - Multiple recovery options
 * - Download backup functionality
 * - Pure design tokens (no Tailwind)
 */

"use client";

import { useState } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { AlertTriangle, Download, RefreshCw, Trash2, Info } from "lucide-react";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "@/lib/design-system/tokens";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { showSuccess, showError, showInfo } from "@/lib/toast";

interface SyncErrorRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
  errorType?: "foreign_key" | "validation" | "conflict" | "network" | "unknown";
}

export function SyncErrorRecoveryModal({
  isOpen,
  onClose,
  errorMessage,
  errorType = "unknown",
}: SyncErrorRecoveryModalProps) {
  const { currentProject, clearSyncError } = useGanttToolStoreV2();
  const [isProcessing, setIsProcessing] = useState(false);

  const getErrorInfo = () => {
    switch (errorType) {
      case "foreign_key":
        return {
          title: "Data Conflict Detected",
          description: "Your local changes reference data that no longer exists on the server. This usually happens when another user deletes a resource or task you're working with.",
          icon: AlertTriangle,
          iconColor: "#FF9500",
          bgColor: "#FFF3E0",
        };
      case "validation":
        return {
          title: "Validation Error",
          description: "Some of your local changes don't meet the required validation rules and cannot be synced.",
          icon: Info,
          iconColor: COLORS.blue,
          bgColor: "#E5F1FF",
        };
      case "conflict":
        return {
          title: "Sync Conflict",
          description: "Your changes conflict with recent changes made by another user. Please review and resolve the conflict.",
          icon: AlertTriangle,
          iconColor: COLORS.red,
          bgColor: "#FFE5E5",
        };
      case "network":
        return {
          title: "Network Error",
          description: "Unable to sync your changes due to a network issue. Your changes are saved locally and will sync automatically when the connection is restored.",
          icon: AlertTriangle,
          iconColor: COLORS.status.warning,
          bgColor: "#FFF9E6",
        };
      default:
        return {
          title: "Sync Error",
          description: "An unexpected error occurred while syncing your changes. Your work is saved locally.",
          icon: AlertTriangle,
          iconColor: COLORS.text.secondary,
          bgColor: COLORS.bg.subtle,
        };
    }
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  const handleDownloadBackup = () => {
    if (!currentProject) return;

    try {
      const dataStr = JSON.stringify(currentProject, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentProject.name}-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess("Backup downloaded successfully");
    } catch (error) {
      showError("Failed to download backup");
      console.error("Download backup error:", error);
    }
  };

  const handleRefresh = () => {
    showInfo("Refreshing page to sync with server...");
    clearSyncError();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDiscardChanges = async () => {
    if (!currentProject) return;

    const confirmed = window.confirm(
      "Are you sure you want to discard your local changes? This action cannot be undone.\n\nYour changes will be lost and the project will reload from the server."
    );

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      const { clearProjectLocal } = await import("@/lib/gantt-tool/local-storage");
      await clearProjectLocal(currentProject.id);

      showInfo("Local changes discarded. Refreshing...");
      clearSyncError();

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      showError("Failed to discard changes");
      console.error("Discard changes error:", error);
      setIsProcessing(false);
    }
  };

  const handleAcknowledge = () => {
    clearSyncError();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={errorInfo.title}
      size="medium"
      footer={<div />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING[6] }}>
        {/* Error Description */}
        <div style={{
          backgroundColor: errorInfo.bgColor,
          borderRadius: RADIUS.default,
          padding: SPACING[4],
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: SPACING[3] }}>
            <div style={{ flexShrink: 0, color: errorInfo.iconColor }}>
              <Icon style={{ width: "24px", height: "24px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                color: COLORS.text.primary,
                lineHeight: "1.6",
                margin: 0,
              }}>
                {errorInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        <details style={{
          backgroundColor: COLORS.bg.subtle,
          borderRadius: RADIUS.default,
          border: `1px solid ${COLORS.border.default}`,
        }}>
          <summary style={{
            padding: `${SPACING[3]} ${SPACING[4]}`,
            cursor: "pointer",
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
          }}>
            Technical Details
          </summary>
          <div style={{ padding: `0 ${SPACING[4]} ${SPACING[3]}` }}>
            <code style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: COLORS.text.secondary,
              display: "block",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {errorMessage}
            </code>
          </div>
        </details>

        {/* Recovery Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
          <h3 style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
            margin: 0,
          }}>
            Recovery Options
          </h3>

          {/* Refresh (Recommended) */}
          <button
            onClick={handleRefresh}
            disabled={isProcessing}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: COLORS.blue,
              color: "#FFFFFF",
              borderRadius: RADIUS.default,
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) e.currentTarget.style.backgroundColor = COLORS.blueHover;
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) e.currentTarget.style.backgroundColor = COLORS.blue;
            }}
          >
            <RefreshCw style={{ width: "20px", height: "20px", flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
              }}>
                Refresh Page (Recommended)
              </div>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: "11px",
                opacity: 0.9,
                marginTop: "2px",
              }}>
                Get the latest data from server and try again
              </div>
            </div>
          </button>

          {/* Download Backup */}
          <button
            onClick={handleDownloadBackup}
            disabled={isProcessing || !currentProject}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: "#FFFFFF",
              border: `2px solid ${COLORS.border.strong}`,
              color: COLORS.text.primary,
              borderRadius: RADIUS.default,
              cursor: (isProcessing || !currentProject) ? "not-allowed" : "pointer",
              opacity: (isProcessing || !currentProject) ? 0.5 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && currentProject) {
                e.currentTarget.style.backgroundColor = COLORS.bg.subtle;
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing && currentProject) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }
            }}
          >
            <Download style={{ width: "20px", height: "20px", flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
              }}>
                Download Backup First
              </div>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: "11px",
                color: COLORS.text.secondary,
                marginTop: "2px",
              }}>
                Save your local changes as JSON file for safekeeping
              </div>
            </div>
          </button>

          {/* Discard Changes */}
          <button
            onClick={handleDiscardChanges}
            disabled={isProcessing || !currentProject}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: SPACING[3],
              padding: `${SPACING[3]} ${SPACING[4]}`,
              backgroundColor: "#FFFFFF",
              border: `2px solid ${COLORS.red}`,
              color: COLORS.red,
              borderRadius: RADIUS.default,
              cursor: (isProcessing || !currentProject) ? "not-allowed" : "pointer",
              opacity: (isProcessing || !currentProject) ? 0.5 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isProcessing && currentProject) {
                e.currentTarget.style.backgroundColor = "#FFE5E5";
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing && currentProject) {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }
            }}
          >
            <Trash2 style={{ width: "20px", height: "20px", flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
              }}>
                Discard Local Changes
              </div>
              <div style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: "11px",
                marginTop: "2px",
              }}>
                ⚠️ Permanently delete your local changes and reload from server
              </div>
            </div>
          </button>

          {/* Acknowledge */}
          <button
            onClick={handleAcknowledge}
            disabled={isProcessing}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: SPACING[2],
              padding: `${SPACING[2]} ${SPACING[4]}`,
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.caption,
              color: COLORS.text.secondary,
              backgroundColor: "transparent",
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) e.currentTarget.style.color = COLORS.text.primary;
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) e.currentTarget.style.color = COLORS.text.secondary;
            }}
          >
            I'll handle this manually
          </button>
        </div>

        {/* Pro Tips */}
        <div style={{
          backgroundColor: "#E5F1FF",
          border: `1px solid ${COLORS.blue}`,
          borderRadius: RADIUS.default,
          padding: SPACING[4],
        }}>
          <h4 style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.caption,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.blue,
            marginBottom: SPACING[2],
            margin: 0,
          }}>
            💡 Pro Tips
          </h4>
          <ul style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: "11px",
            color: COLORS.text.primary,
            margin: 0,
            paddingLeft: SPACING[5],
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}>
            <li>Your local changes are automatically saved in your browser</li>
            <li>Refreshing the page will sync you with the latest server state</li>
            <li>If you're working in multiple tabs, close the other tabs first</li>
            <li>Download a backup if you want to preserve your exact current state</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
}

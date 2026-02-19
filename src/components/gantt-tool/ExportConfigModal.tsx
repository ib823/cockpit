/**
 * ExportConfigModal - Showcase Pattern
 *
 * MIGRATED: 2025-11-17 to match modal-design-showcase exactly
 * Source Pattern: /app/modal-design-showcase "Export Configuration"
 *
 * Features:
 * - Tab-based settings
 * - Format & quality options
 * - Content checkboxes
 * - Advanced settings
 */

"use client";

import { useState } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { FormExample } from "@/lib/design-system/showcase-helpers";
import { COLORS, SPACING, TYPOGRAPHY } from "@/lib/design-system/tokens";
import type { GanttProject } from "@/types/gantt-tool";
import { exportGanttEnhanced } from "@/lib/gantt-tool/export-utils";

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: GanttProject;
}

type TabType = "format" | "content" | "advanced";

export default function ExportConfigModal({ isOpen, onClose, project }: ExportConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("format");
  const [isExporting, setIsExporting] = useState(false);

  // Form state
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState("high");
  const [padding, setPadding] = useState("24");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [contentOptions, setContentOptions] = useState({
    showTaskNames: true,
    showResourceAllocations: true,
    showDependencies: true,
    includeTimeline: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportGanttEnhanced(project, {
        format: format as "png" | "pdf" | "svg",
        quality: quality as "standard" | "high" | "print",
        sizePreset: "presentation",
        exportScope: "all",
        contentOptions: {
          hideUIControls: true,
          hidePhaseNames: false,
          hideTaskNames: !contentOptions.showTaskNames,
          showOnlyBars: false,
          includeLegend: false,
          includeHeader: true,
          includeFooter: false,
        },
        padding: {
          top: Number(padding),
          right: Number(padding),
          bottom: Number(padding),
          left: Number(padding),
        },
        backgroundColor,
        transparentBackground: false,
      });
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: "format" as TabType, label: "Format & Quality" },
    { id: "content" as TabType, label: "Content Options" },
    { id: "advanced" as TabType, label: "Advanced" },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Configuration"
      subtitle="Choose format and quality settings for your export"
      size="large"
      footer={
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleExport} disabled={isExporting} variant="primary">
            {isExporting ? "Exporting..." : "Export"}
          </ModalButton>
        </>
      }
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${COLORS.border.default}`,
          marginBottom: SPACING[6],
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: `${SPACING[3]} ${SPACING[6]}`,
              fontSize: TYPOGRAPHY.fontSize.body,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: activeTab === tab.id ? COLORS.blue : COLORS.text.tertiary,
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.blue}` : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: TYPOGRAPHY.fontFamily.text,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "format" && (
        <FormExample
          fields={[
            {
              id: "format",
              label: "Export Format",
              type: "select",
              value: format,
              options: [
                { value: "png", label: "PNG Image" },
                { value: "pdf", label: "PDF Document" },
                { value: "svg", label: "SVG Vector" },
              ],
            },
            {
              id: "quality",
              label: "Quality",
              type: "select",
              value: quality,
              options: [
                { value: "low", label: "Low (Screen)" },
                { value: "medium", label: "Medium (Presentation)" },
                { value: "high", label: "High (Print)" },
              ],
            },
          ]}
          onChange={(field, value) => {
            if (field === "format") setFormat(value);
            if (field === "quality") setQuality(value);
          }}
        />
      )}

      {activeTab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: SPACING[4] }}>
          {[
            { key: "showTaskNames" as const, label: "Show task names" },
            { key: "showResourceAllocations" as const, label: "Show resource allocations" },
            { key: "showDependencies" as const, label: "Show dependencies" },
            { key: "includeTimeline" as const, label: "Include timeline" },
          ].map((option) => (
            <label
              key={option.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACING[3],
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={contentOptions[option.key]}
                onChange={(e) =>
                  setContentOptions({ ...contentOptions, [option.key]: e.target.checked })
                }
                style={{ width: "18px", height: "18px" }}
              />
              <span
                style={{
                  fontSize: TYPOGRAPHY.fontSize.body,
                  color: COLORS.text.primary,
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                }}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {activeTab === "advanced" && (
        <FormExample
          fields={[
            {
              id: "padding",
              label: "Padding (px)",
              type: "text",
              value: padding,
            },
            {
              id: "background",
              label: "Background Color",
              type: "text",
              value: backgroundColor,
            },
          ]}
          onChange={(field, value) => {
            if (field === "padding") setPadding(value);
            if (field === "background") setBackgroundColor(value);
          }}
        />
      )}
    </BaseModal>
  );
}

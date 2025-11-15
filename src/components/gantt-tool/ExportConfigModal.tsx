/**
 * Export Configuration Modal
 *
 * Allows users to configure export settings for optimized, consistent Gantt chart snapshots
 *
 * Refactored to use AppleMinimalistModal with Apple HIG standards
 */

"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import type {
  GanttProject,
  EnhancedExportConfig,
  ExportSizePreset,
  ExportQuality,
  DEFAULT_EXPORT_CONFIG,
  EXPORT_SIZE_PRESETS,
  EXPORT_QUALITY_SETTINGS,
} from "@/types/gantt-tool";
import { exportGanttEnhanced } from "@/lib/gantt-tool/export-utils";
import { AppleMinimalistModal, ModalButton } from "@/components/ui/AppleMinimalistModal";

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: GanttProject;
}

export default function ExportConfigModal({ isOpen, onClose, project }: ExportConfigModalProps) {
  // Import constants
  const [exportSizePresets, setExportSizePresets] = useState<typeof EXPORT_SIZE_PRESETS | null>(
    null
  );
  const [exportQualitySettings, setExportQualitySettings] = useState<
    typeof EXPORT_QUALITY_SETTINGS | null
  >(null);
  const [defaultConfig, setDefaultConfig] = useState<typeof DEFAULT_EXPORT_CONFIG | null>(null);

  // Load constants on mount
  React.useEffect(() => {
    import("@/types/gantt-tool").then((module) => {
      setExportSizePresets(module.EXPORT_SIZE_PRESETS);
      setExportQualitySettings(module.EXPORT_QUALITY_SETTINGS);
      setDefaultConfig(module.DEFAULT_EXPORT_CONFIG);
    });
  }, []);

  // Configuration state
  const [config, setConfig] = useState<EnhancedExportConfig>({
    format: "png",
    quality: "high",
    sizePreset: "presentation",
    exportScope: "all",
    contentOptions: {
      hideUIControls: true,
      hidePhaseNames: false,
      hideTaskNames: false,
      showOnlyBars: false,
      includeLegend: false,
      includeHeader: true,
      includeFooter: false,
    },
    padding: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    },
    backgroundColor: "#ffffff",
    transparentBackground: false,
  });

  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"format" | "content" | "style" | "preview">("format");

  // Update config helper
  const updateConfig = (updates: Partial<EnhancedExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateContentOptions = (updates: Partial<EnhancedExportConfig["contentOptions"]>) => {
    setConfig((prev) => ({
      ...prev,
      contentOptions: { ...prev.contentOptions, ...updates },
    }));
  };

  const updatePadding = (updates: Partial<EnhancedExportConfig["padding"]>) => {
    setConfig((prev) => ({
      ...prev,
      padding: { ...prev.padding, ...updates },
    }));
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportConfig: EnhancedExportConfig = {
        ...config,
        selectedPhaseIds: config.exportScope === "selected-phases" ? selectedPhases : undefined,
      };
      await exportGanttEnhanced(project, exportConfig);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (defaultConfig) {
      setConfig(defaultConfig);
      setSelectedPhases([]);
    }
  };

  if (!exportSizePresets || !exportQualitySettings || !defaultConfig) {
    return null;
  }

  const footer = (
    <>
      <ModalButton onClick={handleReset} variant="secondary">
        Reset to Defaults
      </ModalButton>
      <ModalButton onClick={onClose} variant="secondary">
        Cancel
      </ModalButton>
      <ModalButton onClick={handleExport} disabled={isExporting} variant="primary">
        {isExporting ? "Exporting..." : "Export"}
      </ModalButton>
    </>
  );

  return (
    <AppleMinimalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Configuration"
      subtitle="Configure export settings for optimized Gantt chart snapshots"
      icon={<Download className="w-5 h-5" />}
      size="large"
      footer={footer}
    >
      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.08)", marginBottom: "24px", marginLeft: "-32px", marginRight: "-32px", marginTop: "-32px" }}>
        <div style={{ display: "flex", gap: "4px", paddingLeft: "32px" }}>
          {[
            { key: "format", label: "Format & Size" },
            { key: "content", label: "Content" },
            { key: "style", label: "Style" },
            { key: "preview", label: "Summary" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 500,
                position: "relative",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: activeTab === tab.key ? "#007AFF" : "#86868B",
                transition: "color 0.15s ease",
              }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    backgroundColor: "#007AFF",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "format" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Format Selection */}
            <div>
              <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                Export Format
              </label>
              <select
                value={config.format}
                onChange={(e) => updateConfig({ format: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                }}
              >
                <option value="png">PNG Image (Recommended)</option>
                <option value="pdf">PDF Document</option>
                <option value="svg" disabled>SVG Vector (Coming Soon)</option>
              </select>
            </div>

            {/* Quality Selection */}
            <div>
              <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                Quality
              </label>
              <select
                value={config.quality}
                onChange={(e) => updateConfig({ quality: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                }}
              >
                {Object.entries(exportQualitySettings).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Preset */}
            <div>
              <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "4px" }}>
                Size Preset
              </label>
              <p style={{ fontSize: "12px", color: "#86868B", marginBottom: "8px" }}>
                Choose a preset for consistent sizing across exports
              </p>
              <select
                value={config.sizePreset}
                onChange={(e) => updateConfig({ sizePreset: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                }}
              >
                {Object.entries(exportSizePresets).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.description} ({value.width}x{value.height}px)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Dimensions */}
            {config.sizePreset === "custom" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={config.customWidth || exportSizePresets.custom.width}
                    onChange={(e) => updateConfig({ customWidth: parseInt(e.target.value, 10) })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      border: "1px solid #D1D1D6",
                      borderRadius: "8px",
                      fontFamily: "var(--font-text)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={config.customHeight || exportSizePresets.custom.height}
                    onChange={(e) => updateConfig({ customHeight: parseInt(e.target.value, 10) })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      border: "1px solid #D1D1D6",
                      borderRadius: "8px",
                      fontFamily: "var(--font-text)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Phase Selection */}
            <div style={{ padding: "16px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Phase Selection</h4>
              <select
                value={config.exportScope}
                onChange={(e) => updateConfig({ exportScope: e.target.value as any })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #D1D1D6",
                  borderRadius: "8px",
                  fontFamily: "var(--font-text)",
                  marginBottom: "16px",
                }}
              >
                <option value="all">Export All Phases</option>
                <option value="selected-phases">Export Selected Phases Only</option>
              </select>

              {config.exportScope === "selected-phases" && (
                <div>
                  <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                    Select Phases:
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {project.phases.map((phase) => (
                      <label key={phase.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={selectedPhases.includes(phase.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPhases([...selectedPhases, phase.id]);
                            } else {
                              setSelectedPhases(selectedPhases.filter((id) => id !== phase.id));
                            }
                          }}
                        />
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: phase.color,
                            borderRadius: "2px",
                          }}
                        />
                        <span style={{ fontSize: "14px" }}>{phase.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Options */}
            <div style={{ padding: "16px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Content Options</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "hideUIControls", label: "Hide UI Controls", description: "Hide buttons, drag handles, and other UI controls" },
                  { key: "hidePhaseNames", label: "Hide Phase Names", description: null },
                  { key: "hideTaskNames", label: "Hide Task Names", description: null },
                  { key: "showOnlyBars", label: "Minimal (Bars Only)", description: "Minimal view shows only timeline and bars" },
                ].map((option) => (
                  <div key={option.key}>
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={config.contentOptions[option.key as keyof typeof config.contentOptions] as boolean}
                        onChange={(e) => updateContentOptions({ [option.key]: e.target.checked })}
                      />
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{option.label}</span>
                    </label>
                    {option.description && (
                      <p style={{ fontSize: "12px", color: "#86868B", marginLeft: "28px" }}>{option.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Elements */}
            <div style={{ padding: "16px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Additional Elements</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { key: "includeHeader", label: "Include Header", description: "Add project name and date range at the top" },
                  { key: "includeFooter", label: "Include Footer", description: "Add export date and metadata at the bottom" },
                  { key: "includeLegend", label: "Include Legend", description: "Add phase color legend" },
                ].map((option) => (
                  <div key={option.key}>
                    <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={config.contentOptions[option.key as keyof typeof config.contentOptions] as boolean}
                        onChange={(e) => updateContentOptions({ [option.key]: e.target.checked })}
                      />
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{option.label}</span>
                    </label>
                    <p style={{ fontSize: "12px", color: "#86868B", marginLeft: "28px" }}>{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "style" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Background */}
            <div>
              <label style={{ fontWeight: 600, fontSize: "14px", color: "#1D1D1F", display: "block", marginBottom: "8px" }}>
                Background
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", marginBottom: "12px" }}>
                <input
                  type="checkbox"
                  checked={config.transparentBackground}
                  onChange={(e) => updateConfig({ transparentBackground: e.target.checked })}
                />
                <span style={{ fontSize: "14px" }}>Transparent Background</span>
              </label>

              {!config.transparentBackground && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <label style={{ fontSize: "14px", fontWeight: 500 }}>Background Color:</label>
                  <input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    style={{ width: "100px", height: "40px", border: "1px solid #D1D1D6", borderRadius: "8px" }}
                  />
                </div>
              )}
            </div>

            {/* Padding */}
            <div style={{ padding: "16px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Padding</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {["top", "right", "bottom", "left"].map((side) => (
                  <div key={side}>
                    <label style={{ fontSize: "14px", fontWeight: 500, display: "block", marginBottom: "8px", textTransform: "capitalize" }}>
                      {side}: {config.padding[side as keyof typeof config.padding]}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.padding[side as keyof typeof config.padding]}
                      onChange={(e) => updatePadding({ [side]: parseInt(e.target.value, 10) })}
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "20px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px", backgroundColor: "#FAFAFA" }}>
              <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Export Summary</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                <p><strong>Format:</strong> {config.format.toUpperCase()}</p>
                <p><strong>Quality:</strong> {exportQualitySettings[config.quality].description}</p>
                <p><strong>Size:</strong> {exportSizePresets[config.sizePreset].description}</p>
                <p>
                  <strong>Dimensions:</strong>{" "}
                  {config.sizePreset === "custom" && config.customWidth && config.customHeight
                    ? `${config.customWidth}x${config.customHeight}px`
                    : `${exportSizePresets[config.sizePreset].width}x${exportSizePresets[config.sizePreset].height}px`}
                </p>
                <p>
                  <strong>Phases:</strong>{" "}
                  {config.exportScope === "all"
                    ? `All phases (${project.phases.length})`
                    : `${selectedPhases.length} selected phases`}
                </p>
                <p><strong>Header:</strong> {config.contentOptions.includeHeader ? "Yes" : "No"}</p>
                <p><strong>Footer:</strong> {config.contentOptions.includeFooter ? "Yes" : "No"}</p>
                <p><strong>Legend:</strong> {config.contentOptions.includeLegend ? "Yes" : "No"}</p>
              </div>
            </div>

            <div style={{ padding: "16px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "8px", backgroundColor: "#F5F5F7" }}>
              <p style={{ fontSize: "14px", color: "#1D1D1F", lineHeight: 1.6 }}>
                All exports will use consistent sizing and formatting for professional presentations. The snapshot will focus on the timeline and bars, optimized for PowerPoint, Word, and other documents.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppleMinimalistModal>
  );
}

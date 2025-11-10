/**
 * Export Configuration Modal
 *
 * Allows users to configure export settings for optimized, consistent Gantt chart snapshots
 */

"use client";

import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Select,
  Slider,
  Switch,
  Button,
  Checkbox,
  Input,
  Row,
  Col,
  Card,
  Space,
  Typography,
} from "antd";
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

const { Title, Text, Paragraph } = Typography;

interface ExportConfigModalProps {
  visible: boolean;
  onClose: () => void;
  project: GanttProject;
}

export default function ExportConfigModal({ visible, onClose, project }: ExportConfigModalProps) {
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

  return (
    <Modal
      title="Export Configuration"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={handleReset}>Reset to Defaults</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleExport} loading={isExporting}>
            Export
          </Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="format"
        items={[
          {
            key: "format",
            label: "Format & Size",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {/* Format Selection */}
                <div>
                  <Text strong>Export Format</Text>
                  <Select
                    value={config.format}
                    onChange={(value) => updateConfig({ format: value })}
                    style={{ width: "100%", marginTop: 8 }}
                    options={[
                      { value: "png", label: "PNG Image (Recommended)" },
                      { value: "pdf", label: "PDF Document" },
                      { value: "svg", label: "SVG Vector (Coming Soon)", disabled: true },
                    ]}
                  />
                </div>

                {/* Quality Selection */}
                <div>
                  <Text strong>Quality</Text>
                  <Select
                    value={config.quality}
                    onChange={(value) => updateConfig({ quality: value })}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    {Object.entries(exportQualitySettings).map(([key, value]) => (
                      <Select.Option key={key} value={key}>
                        {value.description}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {/* Size Preset */}
                <div>
                  <Text strong>Size Preset</Text>
                  <Paragraph type="secondary" style={{ marginBottom: 8 }} className="text-xs">
                    Choose a preset for consistent sizing across exports
                  </Paragraph>
                  <Select
                    value={config.sizePreset}
                    onChange={(value) => updateConfig({ sizePreset: value })}
                    style={{ width: "100%" }}
                  >
                    {Object.entries(exportSizePresets).map(([key, value]) => (
                      <Select.Option key={key} value={key}>
                        {value.description} ({value.width}x{value.height}px)
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {/* Custom Dimensions */}
                {config.sizePreset === "custom" && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Width (px)</Text>
                      <Input
                        type="number"
                        value={config.customWidth || exportSizePresets.custom.width}
                        onChange={(e) =>
                          updateConfig({ customWidth: parseInt(e.target.value, 10) })
                        }
                        style={{ marginTop: 8 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Text strong>Height (px)</Text>
                      <Input
                        type="number"
                        value={config.customHeight || exportSizePresets.custom.height}
                        onChange={(e) =>
                          updateConfig({ customHeight: parseInt(e.target.value, 10) })
                        }
                        style={{ marginTop: 8 }}
                      />
                    </Col>
                  </Row>
                )}
              </Space>
            ),
          },
          {
            key: "content",
            label: "Content",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {/* Phase Selection */}
                <Card size="small" title="Phase Selection">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Select
                      value={config.exportScope}
                      onChange={(value) => updateConfig({ exportScope: value })}
                      style={{ width: "100%" }}
                      options={[
                        { value: "all", label: "Export All Phases" },
                        { value: "selected-phases", label: "Export Selected Phases Only" },
                      ]}
                    />

                    {config.exportScope === "selected-phases" && (
                      <div style={{ marginTop: 16 }}>
                        <Text strong>Select Phases:</Text>
                        <div style={{ marginTop: 8 }}>
                          {project.phases.map((phase) => (
                            <div key={phase.id} style={{ marginBottom: 8 }}>
                              <Checkbox
                                checked={selectedPhases.includes(phase.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPhases([...selectedPhases, phase.id]);
                                  } else {
                                    setSelectedPhases(
                                      selectedPhases.filter((id) => id !== phase.id)
                                    );
                                  }
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 12,
                                    height: 12,
                                    backgroundColor: phase.color,
                                    marginRight: 8,
                                    borderRadius: 2,
                                  }}
                                />
                                {phase.name}
                              </Checkbox>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>

                {/* Content Options */}
                <Card size="small" title="Content Options">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Switch
                      checked={config.contentOptions.hideUIControls}
                      onChange={(checked) => updateContentOptions({ hideUIControls: checked })}
                      checkedChildren="Hide UI"
                      unCheckedChildren="Show UI"
                    />
                    <Text type="secondary" className="text-xs">
                      Hide buttons, drag handles, and other UI controls
                    </Text>

                    <Switch
                      checked={config.contentOptions.hidePhaseNames}
                      onChange={(checked) => updateContentOptions({ hidePhaseNames: checked })}
                      checkedChildren="Hide Phase Names"
                      unCheckedChildren="Show Phase Names"
                    />

                    <Switch
                      checked={config.contentOptions.hideTaskNames}
                      onChange={(checked) => updateContentOptions({ hideTaskNames: checked })}
                      checkedChildren="Hide Task Names"
                      unCheckedChildren="Show Task Names"
                    />

                    <Switch
                      checked={config.contentOptions.showOnlyBars}
                      onChange={(checked) => updateContentOptions({ showOnlyBars: checked })}
                      checkedChildren="Minimal (Bars Only)"
                      unCheckedChildren="Full View"
                    />
                    <Text type="secondary" className="text-xs">
                      Minimal view shows only timeline and bars
                    </Text>
                  </Space>
                </Card>

                {/* Additional Elements */}
                <Card size="small" title="Additional Elements">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Switch
                      checked={config.contentOptions.includeHeader}
                      onChange={(checked) => updateContentOptions({ includeHeader: checked })}
                      checkedChildren="Include Header"
                      unCheckedChildren="No Header"
                    />
                    <Text type="secondary" className="text-xs">
                      Add project name and date range at the top
                    </Text>

                    <Switch
                      checked={config.contentOptions.includeFooter}
                      onChange={(checked) => updateContentOptions({ includeFooter: checked })}
                      checkedChildren="Include Footer"
                      unCheckedChildren="No Footer"
                    />
                    <Text type="secondary" className="text-xs">
                      Add export date and metadata at the bottom
                    </Text>

                    <Switch
                      checked={config.contentOptions.includeLegend}
                      onChange={(checked) => updateContentOptions({ includeLegend: checked })}
                      checkedChildren="Include Legend"
                      unCheckedChildren="No Legend"
                    />
                    <Text type="secondary" className="text-xs">
                      Add phase color legend
                    </Text>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: "style",
            label: "Style",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                {/* Background */}
                <div>
                  <Text strong>Background</Text>
                  <div style={{ marginTop: 8 }}>
                    <Switch
                      checked={config.transparentBackground}
                      onChange={(checked) => updateConfig({ transparentBackground: checked })}
                      checkedChildren="Transparent"
                      unCheckedChildren="Solid Color"
                    />
                  </div>

                  {!config.transparentBackground && (
                    <div style={{ marginTop: 16 }}>
                      <Text>Background Color:</Text>
                      <Input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                        style={{ width: 100, marginLeft: 8 }}
                      />
                    </div>
                  )}
                </div>

                {/* Padding */}
                <Card size="small" title="Padding">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text>Top: {config.padding.top}px</Text>
                      <Slider
                        min={0}
                        max={100}
                        value={config.padding.top}
                        onChange={(value) => updatePadding({ top: value })}
                      />
                    </div>
                    <div>
                      <Text>Right: {config.padding.right}px</Text>
                      <Slider
                        min={0}
                        max={100}
                        value={config.padding.right}
                        onChange={(value) => updatePadding({ right: value })}
                      />
                    </div>
                    <div>
                      <Text>Bottom: {config.padding.bottom}px</Text>
                      <Slider
                        min={0}
                        max={100}
                        value={config.padding.bottom}
                        onChange={(value) => updatePadding({ bottom: value })}
                      />
                    </div>
                    <div>
                      <Text>Left: {config.padding.left}px</Text>
                      <Slider
                        min={0}
                        max={100}
                        value={config.padding.left}
                        onChange={(value) => updatePadding({ left: value })}
                      />
                    </div>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: "preview",
            label: "Summary",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="large">
                <Card>
                  <Title level={5}>Export Summary</Title>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text>
                      <strong>Format:</strong> {config.format.toUpperCase()}
                    </Text>
                    <Text>
                      <strong>Quality:</strong> {exportQualitySettings[config.quality].description}
                    </Text>
                    <Text>
                      <strong>Size:</strong> {exportSizePresets[config.sizePreset].description}
                    </Text>
                    <Text>
                      <strong>Dimensions:</strong>{" "}
                      {config.sizePreset === "custom" && config.customWidth && config.customHeight
                        ? `${config.customWidth}x${config.customHeight}px`
                        : `${exportSizePresets[config.sizePreset].width}x${exportSizePresets[config.sizePreset].height}px`}
                    </Text>
                    <Text>
                      <strong>Phases:</strong>{" "}
                      {config.exportScope === "all"
                        ? `All phases (${project.phases.length})`
                        : `${selectedPhases.length} selected phases`}
                    </Text>
                    <Text>
                      <strong>Header:</strong> {config.contentOptions.includeHeader ? "Yes" : "No"}
                    </Text>
                    <Text>
                      <strong>Footer:</strong> {config.contentOptions.includeFooter ? "Yes" : "No"}
                    </Text>
                    <Text>
                      <strong>Legend:</strong> {config.contentOptions.includeLegend ? "Yes" : "No"}
                    </Text>
                  </Space>
                </Card>

                <Card type="inner">
                  <Paragraph>
                    All exports will use consistent sizing and formatting for professional
                    presentations. The snapshot will focus on the timeline and bars, optimized for
                    PowerPoint, Word, and other documents.
                  </Paragraph>
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
}

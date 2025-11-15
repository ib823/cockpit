/**
 * Current Landscape Diagram (AS-IS Architecture)
 * Professional visualization of current systems, integrations, and external dependencies
 * NO EMOJIS - Professional enterprise architecture documentation
 */

"use client";

import { Download, Server, ArrowRight } from "lucide-react";
import type { CurrentLandscapeData, DiagramSettings, ExportOptions } from "../types";

interface CurrentLandscapeDiagramProps {
  data: CurrentLandscapeData;
  settings: DiagramSettings;
  onExport: (options: ExportOptions) => void;
}

export function CurrentLandscapeDiagram({
  data,
  settings,
  onExport,
}: CurrentLandscapeDiagramProps) {
  // Get style colors based on selected visual style
  const getColors = () => {
    switch (settings.visualStyle) {
      case "clean":
        return {
          primary: "#2563A5",
          primaryLight: "#EBF5FF",
          bg: "#fff",
          border: "#e0e0e0",
          text: "#000",
          textSecondary: "#666",
          shadow: "0 2px 8px rgba(0,0,0,0.1)",
          external: "#999",
          externalBg: "#f9f9f9",
        };
      case "bold":
        return {
          primary: "#2563A5",
          primaryLight: "#1e4a80",
          bg: "#2563A5",
          border: "#1e4a80",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "none",
          external: "#666",
          externalBg: "#888",
        };
      case "gradient":
        return {
          primary: "#667eea",
          primaryLight: "#764ba2",
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "#667eea",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          external: "#999",
          externalBg: "#764ba2",
        };
    }
  };

  const colors = getColors();

  const handleExport = () => {
    onExport({
      format: 'pdf',
      filename: `as-is-architecture-${new Date().toISOString().split('T')[0]}.pdf`,
      includeMetadata: true,
    });
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 32px" }}>
      {/* Header */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "32px",
        }}
        role="banner"
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 600,
            color: "#000",
            marginBottom: "8px",
          }}
        >
          Current Landscape Architecture (AS-IS)
        </h1>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          Existing Systems, Integrations & External Dependencies
        </p>
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#999",
          }}
        >
          Style: {settings.visualStyle} • Layout: {settings.layoutMode}
        </div>
      </header>

      {/* Main Diagram Container */}
      <div
        style={{
          padding: "48px",
          border: "2px solid #333",
          borderRadius: "12px",
          backgroundColor: "#fff",
          minHeight: "600px",
        }}
        role="main"
        aria-label="AS-IS architecture diagram content"
      >
        {/* Current Systems Section */}
        {data.systems.length > 0 && (
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="systems-heading"
          >
            <h2
              id="systems-heading"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: "8px",
              }}
            >
              CURRENT SYSTEMS ({data.systems.length})
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: settings.layoutMode === "swim-lanes"
                  ? "1fr"
                  : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              }}
              role="list"
              aria-label="Current systems list"
            >
              {data.systems.map((system) => (
                <div
                  key={system.id}
                  role="listitem"
                  style={{
                    padding: "20px",
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: settings.visualStyle === "clean" ? "8px" : "4px",
                    boxShadow: colors.shadow,
                    color: colors.text,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                    {settings.showIcons && (
                      <Server
                        className="w-6 h-6"
                        style={{ color: colors.primary, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>
                        {system.name}
                      </div>
                      {system.vendor && (
                        <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                          Vendor: {system.vendor}
                          {system.version && ` v${system.version}`}
                        </div>
                      )}
                    </div>
                    {system.status && (
                      <div
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor:
                            system.status === "active"
                              ? "#E8F5E9"
                              : system.status === "retiring"
                              ? "#FFEBEE"
                              : "#FFF3E0",
                          color:
                            system.status === "active"
                              ? "#2E7D32"
                              : system.status === "retiring"
                              ? "#C62828"
                              : "#E65100",
                        }}
                      >
                        {system.status.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {system.modules && system.modules.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          marginBottom: "6px",
                          color: colors.textSecondary,
                        }}
                      >
                        Modules/Capabilities:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {system.modules.map((module, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: colors.primaryLight,
                              color: settings.visualStyle === "clean" ? colors.primary : colors.text,
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          >
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Integrations Section */}
        {data.integrations.length > 0 && (
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="integrations-heading"
          >
            <h2
              id="integrations-heading"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
                paddingBottom: "8px",
              }}
            >
              SYSTEM INTEGRATIONS ({data.integrations.length})
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              role="list"
              aria-label="System integrations list"
            >
              {data.integrations.map((integration) => {
                const sourceSystem = data.systems.find(s => s.id === integration.sourceId);
                const targetSystem = data.systems.find(s => s.id === integration.targetId);

                return (
                  <div
                    key={integration.id}
                    role="listitem"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px",
                      backgroundColor: "#f9f9f9",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ flex: 1, fontWeight: 600 }}>
                      {sourceSystem?.name || "Unknown Source"}
                    </div>
                    <div style={{ padding: "0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <ArrowRight className="w-5 h-5" style={{ color: colors.primary }} aria-hidden="true" />
                      {integration.type && (
                        <span style={{ fontSize: "11px", color: "#666" }}>
                          ({integration.type})
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, fontWeight: 600, textAlign: "right" }}>
                      {targetSystem?.name || "Unknown Target"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* External Systems Section */}
        {data.externalSystems.length > 0 && (
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="external-systems-heading"
          >
            <h2
              id="external-systems-heading"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
                color: colors.external,
                borderBottom: `2px solid ${colors.external}`,
                paddingBottom: "8px",
              }}
            >
              EXTERNAL SYSTEMS & DEPENDENCIES ({data.externalSystems.length})
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "12px",
              }}
              role="list"
              aria-label="External systems list"
            >
              {data.externalSystems.map((system) => (
                <div
                  key={system.id}
                  role="listitem"
                  style={{
                    padding: "16px",
                    backgroundColor: colors.externalBg,
                    border: `2px dashed ${colors.external}`,
                    borderRadius: "6px",
                    color: settings.visualStyle === "clean" ? "#333" : colors.text,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    {system.name}
                  </div>
                  {system.provider && (
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      Provider: {system.provider}
                    </div>
                  )}
                  {system.category && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "4px 8px",
                        backgroundColor: "rgba(0,0,0,0.1)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        display: "inline-block",
                      }}
                    >
                      {system.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {data.systems.length === 0 && data.externalSystems.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "64px 32px",
              color: "#999",
            }}
            role="status"
            aria-live="polite"
          >
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              No AS-IS architecture data available
            </p>
            <p style={{ fontSize: "13px" }}>
              Add current systems in the "Current Business Landscape" tab to visualize the AS-IS state
            </p>
          </div>
        )}

        {/* Legend */}
        {settings.showLegend && (data.systems.length > 0 || data.externalSystems.length > 0) && (
          <footer
            style={{
              marginTop: "48px",
              padding: "20px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
            role="contentinfo"
            aria-label="Diagram legend and metadata"
          >
            <div style={{ fontWeight: 600, marginBottom: "12px" }}>Legend:</div>
            <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
              <div>• Solid Border: Internal Systems</div>
              <div>• Dashed Border: External Systems/Dependencies</div>
              <div>• Visual Style: {settings.visualStyle.toUpperCase()}</div>
              <div>• Date: {new Date().toLocaleDateString()}</div>
            </div>
          </footer>
        )}
      </div>

      {/* Export Button */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button
          onClick={handleExport}
          style={{
            padding: "14px 32px",
            backgroundColor: "#2563A5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
          aria-label="Export AS-IS architecture diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export AS-IS Diagram
        </button>
      </div>
    </div>
  );
}

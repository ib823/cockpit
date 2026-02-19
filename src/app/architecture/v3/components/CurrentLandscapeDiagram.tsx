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
          primary: "#007AFF",
          primaryLight: "rgba(0, 122, 255, 0.08)",
          bg: "#fff",
          border: "var(--color-border-subtle)",
          text: "var(--color-text-primary)",
          textSecondary: "var(--color-text-secondary)",
          shadow: "var(--shadow-sm)",
          external: "var(--color-text-tertiary)",
          externalBg: "var(--color-bg-secondary)",
        };
      case "bold":
        return {
          primary: "#007AFF",
          primaryLight: "#005EC4",
          bg: "#007AFF",
          border: "#005EC4",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "none",
          external: "var(--color-text-secondary)",
          externalBg: "#888",
        };
      case "gradient":
        return {
          primary: "#007AFF",
          primaryLight: "#AF52DE",
          bg: "linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)",
          border: "#007AFF",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
          external: "var(--color-text-tertiary)",
          externalBg: "#AF52DE",
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
    <div className="max-w-[1400px] mx-auto py-12 px-8">
      {/* Header */}
      <header className="text-center mb-8" role="banner">
        <h1 className="font-[var(--font-display)] text-[28px] font-semibold text-[var(--color-text-primary)] mb-2">
          Current Landscape Architecture (AS-IS)
        </h1>
        <p className="font-[var(--font-text)] text-sm text-[var(--color-text-secondary)] mb-4">
          Existing Systems, Integrations & External Dependencies
        </p>
        <div className="font-[var(--font-text)] text-[13px] text-[var(--color-text-tertiary)]">
          Style: {settings.visualStyle} • Layout: {settings.layoutMode}
        </div>
      </header>

      {/* Main Diagram Container */}
      <div
        className="p-12 border-2 border-[var(--color-text-primary)] rounded-xl bg-[var(--color-bg-primary)] min-h-[600px]"
        role="main"
        aria-label="AS-IS architecture diagram content"
      >
        {/* Current Systems Section */}
        {data.systems.length > 0 && (
          <section className="mb-12" aria-labelledby="systems-heading">
            <h2
              id="systems-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              CURRENT SYSTEMS ({data.systems.length})
            </h2>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: settings.layoutMode === "swim-lanes"
                  ? "1fr"
                  : "repeat(auto-fit, minmax(300px, 1fr))",
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
                  <div className="flex items-start gap-3 mb-3">
                    {settings.showIcons && (
                      <Server
                        className="w-6 h-6 shrink-0"
                        style={{ color: colors.primary }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-base mb-1">
                        {system.name}
                      </div>
                      {system.vendor && (
                        <div className="text-[13px]" style={{ color: colors.textSecondary }}>
                          Vendor: {system.vendor}
                          {system.version && ` v${system.version}`}
                        </div>
                      )}
                    </div>
                    {system.status && (
                      <div
                        className="px-2 py-1 rounded text-[11px] font-semibold"
                        style={{
                          backgroundColor:
                            system.status === "active"
                              ? "rgba(52, 199, 89, 0.12)"
                              : system.status === "retiring"
                              ? "rgba(255, 59, 48, 0.1)"
                              : "rgba(255, 149, 0, 0.1)",
                          color:
                            system.status === "active"
                              ? "#248A3D"
                              : system.status === "retiring"
                              ? "#D70015"
                              : "#C93400",
                        }}
                      >
                        {system.status.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {system.modules && system.modules.length > 0 && (
                    <div className="mt-3">
                      <div
                        className="text-xs font-semibold mb-1.5"
                        style={{ color: colors.textSecondary }}
                      >
                        Modules/Capabilities:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {system.modules.map((module, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-[11px] font-medium"
                            style={{
                              backgroundColor: colors.primaryLight,
                              color: settings.visualStyle === "clean" ? colors.primary : colors.text,
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
          <section className="mb-12" aria-labelledby="integrations-heading">
            <h2
              id="integrations-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              SYSTEM INTEGRATIONS ({data.integrations.length})
            </h2>
            <div className="flex flex-col gap-3" role="list" aria-label="System integrations list">
              {data.integrations.map((integration) => {
                const sourceSystem = data.systems.find(s => s.id === integration.sourceId);
                const targetSystem = data.systems.find(s => s.id === integration.targetId);

                return (
                  <div
                    key={integration.id}
                    role="listitem"
                    className="flex items-center p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-md"
                  >
                    <div className="flex-1 font-semibold">
                      {sourceSystem?.name || "Unknown Source"}
                    </div>
                    <div className="px-4 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5" style={{ color: colors.primary }} aria-hidden="true" />
                      {integration.type && (
                        <span className="text-[11px] text-[var(--color-text-secondary)]">
                          ({integration.type})
                        </span>
                      )}
                    </div>
                    <div className="flex-1 font-semibold text-right">
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
          <section className="mb-12" aria-labelledby="external-systems-heading">
            <h2
              id="external-systems-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.external,
                borderBottom: `2px solid ${colors.external}`,
              }}
            >
              EXTERNAL SYSTEMS & DEPENDENCIES ({data.externalSystems.length})
            </h2>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
              role="list"
              aria-label="External systems list"
            >
              {data.externalSystems.map((system) => (
                <div
                  key={system.id}
                  role="listitem"
                  className="p-4 rounded-md"
                  style={{
                    backgroundColor: colors.externalBg,
                    border: `2px dashed ${colors.external}`,
                    color: settings.visualStyle === "clean" ? "var(--color-text-primary)" : colors.text,
                  }}
                >
                  <div className="font-semibold mb-1">
                    {system.name}
                  </div>
                  {system.provider && (
                    <div className="text-xs opacity-80">
                      Provider: {system.provider}
                    </div>
                  )}
                  {system.category && (
                    <span className="inline-block mt-2 px-2 py-1 bg-black/10 rounded text-[10px] font-semibold">
                      {system.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {data.systems.length === 0 && data.externalSystems.length === 0 && (
          <div
            className="text-center py-16 px-8 text-[var(--color-text-tertiary)]"
            role="status"
            aria-live="polite"
          >
            <p className="text-base mb-2">
              No AS-IS architecture data available
            </p>
            <p className="text-[13px]">
              Add current systems in the &quot;Current Business Landscape&quot; tab to visualize the AS-IS state
            </p>
          </div>
        )}

        {/* Legend */}
        {settings.showLegend && (data.systems.length > 0 || data.externalSystems.length > 0) && (
          <footer
            className="mt-12 p-5 bg-[var(--color-bg-secondary)] rounded-lg"
            role="contentinfo"
            aria-label="Diagram legend and metadata"
          >
            <div className="font-semibold mb-3">Legend:</div>
            <div className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              <div>• Solid Border: Internal Systems</div>
              <div>• Dashed Border: External Systems/Dependencies</div>
              <div>• Visual Style: {settings.visualStyle.toUpperCase()}</div>
              <div>• Date: {new Date().toLocaleDateString()}</div>
            </div>
          </footer>
        )}
      </div>

      {/* Export Button */}
      <div className="text-center mt-8">
        <button
          onClick={handleExport}
          className="px-8 py-3.5 bg-[var(--color-blue)] text-white border-none rounded-lg font-[var(--font-text)] text-[15px] font-semibold cursor-pointer inline-flex items-center gap-2 hover:brightness-90 transition-all"
          aria-label="Export AS-IS architecture diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export AS-IS Diagram
        </button>
      </div>
    </div>
  );
}

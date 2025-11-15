/**
 * Proposed Solution Diagram (TO-BE Architecture)
 * Professional visualization of future state, implementation phases, and migration roadmap
 * NO EMOJIS - Professional enterprise architecture documentation
 */

"use client";

import { Download, Calendar, Package, Sparkles } from "lucide-react";
import type { ProposedSolutionData, DiagramSettings, ExportOptions } from "../types";

interface ProposedSolutionDiagramProps {
  data: ProposedSolutionData;
  settings: DiagramSettings;
  onExport: (options: ExportOptions) => void;
}

export function ProposedSolutionDiagram({
  data,
  settings,
  onExport,
}: ProposedSolutionDiagramProps) {
  // Get style colors based on selected visual style
  const getColors = () => {
    switch (settings.visualStyle) {
      case "clean":
        return {
          primary: "#2563A5",
          primaryLight: "#EBF5FF",
          success: "#2E7D32",
          successLight: "#E8F5E9",
          warning: "#E65100",
          warningLight: "#FFF3E0",
          bg: "#fff",
          border: "#e0e0e0",
          text: "#000",
          textSecondary: "#666",
          shadow: "0 2px 8px rgba(0,0,0,0.1)",
        };
      case "bold":
        return {
          primary: "#2563A5",
          primaryLight: "#1e4a80",
          success: "#2E7D32",
          successLight: "#1b5e20",
          warning: "#E65100",
          warningLight: "#bf360c",
          bg: "#2563A5",
          border: "#1e4a80",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "none",
        };
      case "gradient":
        return {
          primary: "#667eea",
          primaryLight: "#764ba2",
          success: "#4CAF50",
          successLight: "#388E3C",
          warning: "#FF9800",
          warningLight: "#F57C00",
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "#667eea",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
        };
    }
  };

  const colors = getColors();

  const handleExport = () => {
    onExport({
      format: 'pdf',
      filename: `to-be-roadmap-${new Date().toISOString().split('T')[0]}.pdf`,
      includeMetadata: true,
    });
  };

  // Sort phases by order
  const sortedPhases = [...data.phases].sort((a, b) => a.order - b.order);

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
          Proposed Solution Architecture (TO-BE)
        </h1>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          Implementation Roadmap, Future Systems & Migration Strategy
        </p>
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#999",
          }}
        >
          Style: {settings.visualStyle} • {data.phases.length} Phases • {data.systems.length} Systems
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
        aria-label="TO-BE architecture diagram content"
      >
        {/* Implementation Phases Section */}
        {sortedPhases.length > 0 && (
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="phases-heading"
          >
            <h2
              id="phases-heading"
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
              IMPLEMENTATION ROADMAP
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: settings.layoutMode === "swim-lanes" ? "column" : "row",
                gap: "16px",
                flexWrap: "wrap",
              }}
              role="list"
              aria-label="Implementation phases timeline"
            >
              {sortedPhases.map((phase, index) => {
                const phaseSystems = data.systems.filter(s => s.phaseId === phase.id);

                return (
                  <div
                    key={phase.id}
                    role="listitem"
                    style={{
                      flex: settings.layoutMode === "swim-lanes" ? "1 1 100%" : "1 1 calc(50% - 8px)",
                      minWidth: settings.layoutMode === "swim-lanes" ? "100%" : "300px",
                      padding: "20px",
                      background: phase.scope === "in-scope" ? colors.primaryLight : colors.warningLight,
                      border: `2px solid ${phase.scope === "in-scope" ? colors.primary : colors.warning}`,
                      borderRadius: "8px",
                      position: "relative",
                    }}
                  >
                    {/* Phase Number Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "16px",
                        backgroundColor: phase.scope === "in-scope" ? colors.primary : colors.warning,
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Phase {index + 1}
                    </div>

                    {/* Phase Header */}
                    <div style={{ marginBottom: "12px", paddingTop: "8px" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          marginBottom: "4px",
                          color: settings.visualStyle === "clean" ? "#000" : colors.text,
                        }}
                      >
                        {phase.name}
                      </div>
                      {phase.timeline && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            color: settings.visualStyle === "clean" ? "#666" : colors.textSecondary,
                          }}
                        >
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          {phase.timeline}
                        </div>
                      )}
                    </div>

                    {/* Phase Description */}
                    {phase.description && (
                      <div
                        style={{
                          fontSize: "13px",
                          lineHeight: "1.5",
                          marginBottom: "12px",
                          color: settings.visualStyle === "clean" ? "#333" : colors.textSecondary,
                        }}
                      >
                        {phase.description}
                      </div>
                    )}

                    {/* Systems Count */}
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: settings.visualStyle === "clean" ? colors.primary : colors.text,
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: `1px solid ${settings.visualStyle === "clean" ? "#e0e0e0" : "rgba(255,255,255,0.2)"}`,
                      }}
                    >
                      {phaseSystems.length} System{phaseSystems.length !== 1 ? 's' : ''}
                      {phaseSystems.length > 0 && (
                        <span style={{ opacity: 0.7, fontWeight: 400 }}>
                          {' '}• {phaseSystems.filter(s => s.isNew).length} New, {phaseSystems.filter(s => !s.isNew).length} Reused
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Systems by Phase Section */}
        {sortedPhases.map((phase, phaseIndex) => {
          const phaseSystems = data.systems.filter(s => s.phaseId === phase.id);

          if (phaseSystems.length === 0) return null;

          return (
            <section
              key={phase.id}
              style={{ marginBottom: "48px" }}
              aria-labelledby={`phase-${phase.id}-systems-heading`}
            >
              <h3
                id={`phase-${phase.id}-systems-heading`}
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "#666",
                  borderBottom: "1px solid #e0e0e0",
                  paddingBottom: "8px",
                }}
              >
                Phase {phaseIndex + 1} Systems: {phase.name}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "12px",
                }}
                role="list"
                aria-label={`Systems in ${phase.name}`}
              >
                {phaseSystems.map((system) => (
                  <div
                    key={system.id}
                    role="listitem"
                    style={{
                      padding: "16px",
                      background: system.isNew ? colors.successLight : "#f5f5f5",
                      border: `2px solid ${system.isNew ? colors.success : "#ccc"}`,
                      borderRadius: "6px",
                      position: "relative",
                    }}
                  >
                    {/* New/Reused Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        backgroundColor: system.isNew ? colors.success : "#999",
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {system.isNew ? (
                        <>
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          NEW
                        </>
                      ) : (
                        <>
                          <Package className="w-3 h-3" aria-hidden="true" />
                          REUSED
                        </>
                      )}
                    </div>

                    {/* System Details */}
                    <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px", paddingRight: "60px" }}>
                      {system.name}
                    </div>
                    {system.vendor && (
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
                        {system.vendor}
                      </div>
                    )}
                    {system.modules && system.modules.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                        {system.modules.slice(0, 3).map((module, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "3px 6px",
                              backgroundColor: "rgba(0,0,0,0.1)",
                              borderRadius: "3px",
                              fontSize: "10px",
                              fontWeight: 500,
                            }}
                          >
                            {module}
                          </span>
                        ))}
                        {system.modules.length > 3 && (
                          <span style={{ fontSize: "10px", opacity: 0.7 }}>
                            +{system.modules.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty State */}
        {sortedPhases.length === 0 && (
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
              No TO-BE roadmap defined
            </p>
            <p style={{ fontSize: "13px" }}>
              Add implementation phases in the "Proposed Solution" tab to visualize the migration roadmap
            </p>
          </div>
        )}

        {/* Legend */}
        {settings.showLegend && sortedPhases.length > 0 && (
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: colors.success, borderRadius: "2px" }}></div>
                <span>New System (to be implemented)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "12px", height: "12px", backgroundColor: "#999", borderRadius: "2px" }}></div>
                <span>Reused System (from AS-IS)</span>
              </div>
              <div style={{ marginTop: "8px" }}>
                Visual Style: {settings.visualStyle.toUpperCase()} • Date: {new Date().toLocaleDateString()}
              </div>
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
          aria-label="Export TO-BE roadmap diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export TO-BE Roadmap
        </button>
      </div>
    </div>
  );
}

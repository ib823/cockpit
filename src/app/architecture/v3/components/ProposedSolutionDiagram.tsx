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
          primary: "#007AFF",
          primaryLight: "rgba(0, 122, 255, 0.08)",
          success: "#248A3D",
          successLight: "rgba(52, 199, 89, 0.12)",
          warning: "#C93400",
          warningLight: "rgba(255, 149, 0, 0.1)",
          bg: "#fff",
          border: "var(--color-border-subtle)",
          text: "var(--color-text-primary)",
          textSecondary: "var(--color-text-secondary)",
          shadow: "var(--shadow-sm)",
        };
      case "bold":
        return {
          primary: "#007AFF",
          primaryLight: "#005EC4",
          success: "#248A3D",
          successLight: "#1B6B2F",
          warning: "#C93400",
          warningLight: "#A02B00",
          bg: "#007AFF",
          border: "#005EC4",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "none",
        };
      case "gradient":
        return {
          primary: "#007AFF",
          primaryLight: "#AF52DE",
          success: "#34C759",
          successLight: "#248A3D",
          warning: "#FF9500",
          warningLight: "#C93400",
          bg: "linear-gradient(135deg, #007AFF 0%, #AF52DE 100%)",
          border: "#007AFF",
          text: "#fff",
          textSecondary: "#f0f0f0",
          shadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
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
    <div className="max-w-[1400px] mx-auto py-12 px-8">
      {/* Header */}
      <header className="text-center mb-8" role="banner">
        <h1 className="font-[var(--font-display)] text-[28px] font-semibold text-[var(--color-text-primary)] mb-2">
          Proposed Solution Architecture (TO-BE)
        </h1>
        <p className="font-[var(--font-text)] text-sm text-[var(--color-text-secondary)] mb-4">
          Implementation Roadmap, Future Systems & Migration Strategy
        </p>
        <div className="font-[var(--font-text)] text-[13px] text-[var(--color-text-tertiary)]">
          Style: {settings.visualStyle} • {data.phases.length} Phases • {data.systems.length} Systems
        </div>
      </header>

      {/* Main Diagram Container */}
      <div
        className="p-12 border-2 border-[var(--color-text-primary)] rounded-xl bg-[var(--color-bg-primary)] min-h-[600px]"
        role="main"
        aria-label="TO-BE architecture diagram content"
      >
        {/* Implementation Phases Section */}
        {sortedPhases.length > 0 && (
          <section className="mb-12" aria-labelledby="phases-heading">
            <h2
              id="phases-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              IMPLEMENTATION ROADMAP
            </h2>
            <div
              className="flex flex-wrap gap-4"
              style={{
                flexDirection: settings.layoutMode === "swim-lanes" ? "column" : "row",
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
                    className="relative p-5 rounded-lg"
                    style={{
                      flex: settings.layoutMode === "swim-lanes" ? "1 1 100%" : "1 1 calc(50% - 8px)",
                      minWidth: settings.layoutMode === "swim-lanes" ? "100%" : "300px",
                      background: phase.scope === "in-scope" ? colors.primaryLight : colors.warningLight,
                      border: `2px solid ${phase.scope === "in-scope" ? colors.primary : colors.warning}`,
                    }}
                  >
                    {/* Phase Number Badge */}
                    <div
                      className="absolute -top-3 left-4 text-white px-3 py-1 rounded-xl text-xs font-bold"
                      style={{
                        backgroundColor: phase.scope === "in-scope" ? colors.primary : colors.warning,
                      }}
                    >
                      Phase {index + 1}
                    </div>

                    {/* Phase Header */}
                    <div className="mb-3 pt-2">
                      <div
                        className="font-bold text-base mb-1"
                        style={{
                          color: settings.visualStyle === "clean" ? "var(--color-text-primary)" : colors.text,
                        }}
                      >
                        {phase.name}
                      </div>
                      {phase.timeline && (
                        <div
                          className="flex items-center gap-1.5 text-[13px]"
                          style={{
                            color: settings.visualStyle === "clean" ? "var(--color-text-secondary)" : colors.textSecondary,
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
                        className="text-[13px] leading-relaxed mb-3"
                        style={{
                          color: settings.visualStyle === "clean" ? "var(--color-text-primary)" : colors.textSecondary,
                        }}
                      >
                        {phase.description}
                      </div>
                    )}

                    {/* Systems Count */}
                    <div
                      className="text-xs font-semibold mt-3 pt-3"
                      style={{
                        color: settings.visualStyle === "clean" ? colors.primary : colors.text,
                        borderTop: `1px solid ${settings.visualStyle === "clean" ? "var(--color-border-subtle)" : "rgba(255,255,255,0.2)"}`,
                      }}
                    >
                      {phaseSystems.length} System{phaseSystems.length !== 1 ? 's' : ''}
                      {phaseSystems.length > 0 && (
                        <span className="opacity-70 font-normal">
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
            <section key={phase.id} className="mb-12" aria-labelledby={`phase-${phase.id}-systems-heading`}>
              <h3
                id={`phase-${phase.id}-systems-heading`}
                className="font-[var(--font-text)] text-base font-semibold mb-4 pb-2 text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]"
              >
                Phase {phaseIndex + 1} Systems: {phase.name}
              </h3>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
                role="list"
                aria-label={`Systems in ${phase.name}`}
              >
                {phaseSystems.map((system) => (
                  <div
                    key={system.id}
                    role="listitem"
                    className="p-4 rounded-md relative"
                    style={{
                      background: system.isNew ? colors.successLight : "var(--color-bg-secondary)",
                      border: `2px solid ${system.isNew ? colors.success : "var(--color-border-subtle)"}`,
                    }}
                  >
                    {/* New/Reused Badge */}
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-white rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: system.isNew ? colors.success : "#8E8E93",
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
                    <div className="font-semibold text-[15px] mb-1 pr-[60px]">
                      {system.name}
                    </div>
                    {system.vendor && (
                      <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                        {system.vendor}
                      </div>
                    )}
                    {system.modules && system.modules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {system.modules.slice(0, 3).map((module, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-black/10 rounded-[3px] text-[10px] font-medium"
                          >
                            {module}
                          </span>
                        ))}
                        {system.modules.length > 3 && (
                          <span className="text-[10px] opacity-70">
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
            className="text-center py-16 px-8 text-[var(--color-text-tertiary)]"
            role="status"
            aria-live="polite"
          >
            <p className="text-base mb-2">
              No TO-BE roadmap defined
            </p>
            <p className="text-[13px]">
              Add implementation phases in the &quot;Proposed Solution&quot; tab to visualize the migration roadmap
            </p>
          </div>
        )}

        {/* Legend */}
        {settings.showLegend && sortedPhases.length > 0 && (
          <footer
            className="mt-12 p-5 bg-[var(--color-bg-secondary)] rounded-lg"
            role="contentinfo"
            aria-label="Diagram legend and metadata"
          >
            <div className="font-semibold mb-3">Legend:</div>
            <div className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.success }}></div>
                <span>New System (to be implemented)</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm bg-[#8E8E93]"></div>
                <span>Reused System (from AS-IS)</span>
              </div>
              <div className="mt-2">
                Visual Style: {settings.visualStyle.toUpperCase()} • Date: {new Date().toLocaleDateString()}
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Export Button */}
      <div className="text-center mt-8">
        <button
          onClick={handleExport}
          className="px-8 py-3.5 bg-[var(--color-blue)] text-white border-none rounded-lg font-[var(--font-text)] text-[15px] font-semibold cursor-pointer inline-flex items-center gap-2 hover:brightness-90 transition-all"
          aria-label="Export TO-BE roadmap diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export TO-BE Roadmap
        </button>
      </div>
    </div>
  );
}

/**
 * Business Context Diagram
 * Professional visualization of business entities, stakeholders, capabilities, and pain points
 * NO EMOJIS - Professional enterprise architecture documentation
 */

"use client";

import { Download } from "lucide-react";
import type { BusinessContextData, DiagramSettings, ExportOptions } from "../types";

interface BusinessContextDiagramProps {
  data: BusinessContextData;
  settings: DiagramSettings;
  onExport: (options: ExportOptions) => void;
}

export function BusinessContextDiagram({
  data,
  settings,
  onExport,
}: BusinessContextDiagramProps) {
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
        };
    }
  };

  const colors = getColors();

  const handleExport = () => {
    onExport({
      format: 'pdf',
      filename: `business-context-${new Date().toISOString().split('T')[0]}.pdf`,
      includeMetadata: true,
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto py-12 px-8">
      {/* Header */}
      <header className="text-center mb-8" role="banner">
        <h1 className="font-[var(--font-display)] text-[28px] font-semibold text-[var(--color-text-primary)] mb-2">
          Business Context Architecture
        </h1>
        <p className="font-[var(--font-text)] text-sm text-[var(--color-text-secondary)] mb-4">
          Enterprise Overview: Entities, Stakeholders, Capabilities & Motivation
        </p>
        <div className="font-[var(--font-text)] text-[13px] text-[var(--color-text-tertiary)]">
          Style: {settings.visualStyle} • Actor Display: {settings.actorDisplay} • Layout:{" "}
          {settings.layoutMode}
        </div>
      </header>

      {/* Main Diagram Container */}
      <div
        className="p-12 border-2 border-[var(--color-text-primary)] rounded-xl bg-[var(--color-bg-primary)] min-h-[600px]"
        role="main"
        aria-label="Business context diagram content"
      >
        {/* Business Entities Section */}
        {data.entities.length > 0 && (
          <section className="mb-12" aria-labelledby="entities-heading">
            <h2
              id="entities-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              BUSINESS ENTITIES
            </h2>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
              role="list"
              aria-label="Business entities list"
            >
              {data.entities.map((entity) => (
                <div
                  key={entity.id}
                  role="listitem"
                  className="text-center p-5"
                  style={{
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: settings.visualStyle === "clean" ? "8px" : "4px",
                    boxShadow: colors.shadow,
                    color: colors.text,
                  }}
                >
                  <div className="font-semibold mb-1">{entity.name}</div>
                  {entity.location && (
                    <div className="text-xs opacity-80" style={{ color: colors.textSecondary }}>
                      {entity.location}
                    </div>
                  )}
                  {entity.description && (
                    <div
                      className="text-[11px] mt-2 leading-snug"
                      style={{ color: colors.textSecondary }}
                    >
                      {entity.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Stakeholders Section */}
        {data.actors.length > 0 && (
          <section className="mb-12" aria-labelledby="stakeholders-heading">
            <h2
              id="stakeholders-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              KEY STAKEHOLDERS
            </h2>
            {settings.actorDisplay === "cards" ? (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}
                role="list"
                aria-label="Stakeholders list in card format"
              >
                {data.actors.map((actor) => (
                  <div
                    key={actor.id}
                    role="listitem"
                    className="p-4 rounded-lg"
                    style={{
                      background: colors.primaryLight,
                      border: `2px solid ${colors.primary}`,
                      color: settings.visualStyle === "clean" ? "var(--color-text-primary)" : colors.text,
                    }}
                  >
                    <div className="font-semibold mb-1">{actor.name}</div>
                    <div
                      className="text-xs opacity-90 mb-2"
                      style={{
                        color: settings.visualStyle === "clean" ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {actor.role} • {actor.department}
                    </div>
                    {actor.activities && actor.activities.length > 0 && (
                      <ul
                        className="text-[11px] m-0 pl-4"
                        style={{
                          color: settings.visualStyle === "clean" ? "var(--color-text-primary)" : colors.textSecondary,
                        }}
                      >
                        {actor.activities.map((activity, idx) => (
                          <li key={idx}>{activity}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2" role="list" aria-label="Stakeholders list in tag format">
                {data.actors.map((actor) => (
                  <div
                    key={actor.id}
                    role="listitem"
                    className="px-4 py-2 rounded-full text-[13px] font-medium"
                    style={{
                      backgroundColor: colors.primaryLight,
                      border: `1px solid ${colors.primary}`,
                      color: settings.visualStyle === "clean" ? colors.primary : colors.text,
                    }}
                  >
                    {actor.name} ({actor.role})
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Required Capabilities Section */}
        {data.capabilities.length > 0 && (
          <section className="mb-12" aria-labelledby="capabilities-heading">
            <h2
              id="capabilities-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: colors.primary,
                borderBottom: `2px solid ${colors.primary}`,
              }}
            >
              REQUIRED CAPABILITIES
            </h2>
            <div className="flex flex-wrap gap-3" role="list" aria-label="Business capabilities list">
              {data.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  role="listitem"
                  className="px-4 py-2.5 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "rgba(0, 122, 255, 0.08)",
                    border: `2px solid ${colors.primary}`,
                    color: colors.primary,
                  }}
                >
                  {cap.name}
                  {cap.category && (
                    <span className="text-[11px] opacity-70 ml-2">
                      ({cap.category})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pain Points Section */}
        {data.painPoints && (
          <section className="mb-12" aria-labelledby="pain-points-heading">
            <h2
              id="pain-points-heading"
              className="font-[var(--font-text)] text-lg font-semibold mb-5 pb-2"
              style={{
                color: "#C93400",
                borderBottom: "2px solid #FF9500",
              }}
            >
              PAIN POINTS & TRANSFORMATION MOTIVATION
            </h2>
            <div
              className="p-5 rounded-lg text-sm leading-relaxed"
              style={{
                backgroundColor: "rgba(255, 149, 0, 0.08)",
                border: "2px solid #FF9500",
                color: "#C93400",
              }}
              role="article"
              aria-label="Business pain points and motivation for transformation"
            >
              {data.painPoints}
            </div>
          </section>
        )}

        {/* Legend */}
        {settings.showLegend && (
          <footer
            className="mt-12 p-5 bg-[var(--color-bg-secondary)] rounded-lg"
            role="contentinfo"
            aria-label="Diagram legend and metadata"
          >
            <div className="font-semibold mb-3">Legend:</div>
            <div className="text-[13px] text-[var(--color-text-secondary)]">
              Visual Style: {settings.visualStyle.toUpperCase()} • Layout:{" "}
              {settings.layoutMode.toUpperCase()} • Date:{" "}
              {new Date().toLocaleDateString()}
            </div>
          </footer>
        )}
      </div>

      {/* Export Button */}
      <div className="text-center mt-8">
        <button
          onClick={handleExport}
          className="px-8 py-3.5 bg-[var(--color-blue)] text-white border-none rounded-lg font-[var(--font-text)] text-[15px] font-semibold cursor-pointer inline-flex items-center gap-2 hover:brightness-90 transition-all"
          aria-label="Export business context diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export Diagram
        </button>
      </div>
    </div>
  );
}

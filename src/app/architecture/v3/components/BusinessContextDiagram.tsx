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
          primary: "#2563A5",
          primaryLight: "#EBF5FF",
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
      filename: `business-context-${new Date().toISOString().split('T')[0]}.pdf`,
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
          Business Context Architecture
        </h1>
        <p
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "16px",
          }}
        >
          Enterprise Overview: Entities, Stakeholders, Capabilities & Motivation
        </p>
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#999",
          }}
        >
          Style: {settings.visualStyle} • Actor Display: {settings.actorDisplay} • Layout:{" "}
          {settings.layoutMode}
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
        aria-label="Business context diagram content"
      >
        {/* Business Entities Section */}
        {data.entities.length > 0 && (
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="entities-heading"
          >
            <h2
              id="entities-heading"
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
              BUSINESS ENTITIES
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
              role="list"
              aria-label="Business entities list"
            >
              {data.entities.map((entity) => (
                <div
                  key={entity.id}
                  role="listitem"
                  style={{
                    padding: "20px",
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                    borderRadius: settings.visualStyle === "clean" ? "8px" : "4px",
                    boxShadow: colors.shadow,
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{entity.name}</div>
                  {entity.location && (
                    <div style={{ fontSize: "12px", opacity: 0.8, color: colors.textSecondary }}>
                      {entity.location}
                    </div>
                  )}
                  {entity.description && (
                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "8px",
                        color: colors.textSecondary,
                        lineHeight: "1.4",
                      }}
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
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="stakeholders-heading"
          >
            <h2
              id="stakeholders-heading"
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
              KEY STAKEHOLDERS
            </h2>
            {settings.actorDisplay === "cards" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
                role="list"
                aria-label="Stakeholders list in card format"
              >
                {data.actors.map((actor) => (
                  <div
                    key={actor.id}
                    role="listitem"
                    style={{
                      padding: "16px",
                      background: colors.primaryLight,
                      border: `2px solid ${colors.primary}`,
                      borderRadius: "8px",
                      color: settings.visualStyle === "clean" ? "#000" : colors.text,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>{actor.name}</div>
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.9,
                        marginBottom: "8px",
                        color: settings.visualStyle === "clean" ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {actor.role} • {actor.department}
                    </div>
                    {actor.activities && actor.activities.length > 0 && (
                      <ul
                        style={{
                          fontSize: "11px",
                          margin: 0,
                          paddingLeft: "16px",
                          color: settings.visualStyle === "clean" ? "#333" : colors.textSecondary,
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }} role="list" aria-label="Stakeholders list in tag format">
                {data.actors.map((actor) => (
                  <div
                    key={actor.id}
                    role="listitem"
                    style={{
                      padding: "8px 16px",
                      backgroundColor: colors.primaryLight,
                      border: `1px solid ${colors.primary}`,
                      borderRadius: "20px",
                      color: settings.visualStyle === "clean" ? colors.primary : colors.text,
                      fontSize: "13px",
                      fontWeight: 500,
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
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="capabilities-heading"
          >
            <h2
              id="capabilities-heading"
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
              REQUIRED CAPABILITIES
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }} role="list" aria-label="Business capabilities list">
              {data.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  role="listitem"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#EBF5FF",
                    border: `2px solid ${colors.primary}`,
                    borderRadius: "6px",
                    color: colors.primary,
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {cap.name}
                  {cap.category && (
                    <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: "8px" }}>
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
          <section
            style={{ marginBottom: "48px" }}
            aria-labelledby="pain-points-heading"
          >
            <h2
              id="pain-points-heading"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
                color: "#CC7700",
                borderBottom: "2px solid #FF9500",
                paddingBottom: "8px",
              }}
            >
              PAIN POINTS & TRANSFORMATION MOTIVATION
            </h2>
            <div
              style={{
                padding: "20px",
                backgroundColor: "#FFF3EB",
                border: "2px solid #FF9500",
                borderRadius: "8px",
                color: "#CC7700",
                fontSize: "14px",
                lineHeight: "1.6",
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
            <div style={{ fontSize: "13px", color: "#666" }}>
              Visual Style: {settings.visualStyle.toUpperCase()} • Layout:{" "}
              {settings.layoutMode.toUpperCase()} • Date:{" "}
              {new Date().toLocaleDateString()}
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
          aria-label="Export business context diagram to PDF or PowerPoint"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Export Diagram
        </button>
      </div>
    </div>
  );
}

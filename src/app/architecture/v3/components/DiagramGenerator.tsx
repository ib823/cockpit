/**
 * Diagram Generator
 * Renders the final diagram based on selected style
 */

"use client";

import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from "../types";

interface DiagramGeneratorProps {
  businessContext: BusinessContextData;
  currentLandscape: CurrentLandscapeData;
  proposedSolution: ProposedSolutionData;
  settings: DiagramSettings;
  onEdit: () => void;
  onChangeStyle: () => void;
}

export function DiagramGenerator({
  businessContext,
  currentLandscape,
  proposedSolution,
  settings,
  onEdit,
  onChangeStyle,
}: DiagramGeneratorProps) {
  // Get style colors based on selected visual style
  const getColors = () => {
    switch (settings.visualStyle) {
      case "clean":
        return {
          bg: "#fff",
          border: "#e0e0e0",
          text: "#000",
          shadow: "0 2px 8px rgba(0,0,0,0.1)",
        };
      case "bold":
        return {
          bg: "#2563A5",
          border: "#1e4a80",
          text: "#fff",
          shadow: "none",
        };
      case "gradient":
        return {
          bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "#667eea",
          text: "#fff",
          shadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
        };
    }
  };

  const colors = getColors();

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "48px 32px" }}>
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "32px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 600,
            color: "#000",
            marginBottom: "12px",
          }}
        >
          Generated Architecture Diagram
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={onEdit}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ← Back to Edit
          </button>
          <button
            onClick={onChangeStyle}
            style={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Change Style
          </button>
        </div>
        <div
          style={{
            marginTop: "12px",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#666",
          }}
        >
          Style: {settings.visualStyle} • Actor Display: {settings.actorDisplay} • Layout:{" "}
          {settings.layoutMode}
        </div>
      </div>

      {/* Diagram Container */}
      <div
        style={{
          padding: "48px",
          border: "2px solid #333",
          borderRadius: "12px",
          backgroundColor: "#fff",
          minHeight: "600px",
        }}
      >
        {/* Business Context Summary */}
        {businessContext.entities.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h3
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              📊 BUSINESS CONTEXT
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {businessContext.entities.map((entity) => (
                <div
                  key={entity.id}
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
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>{entity.location}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actors Display */}
        {businessContext.actors.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h3
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              👥 KEY STAKEHOLDERS
            </h3>
            {settings.actorDisplay === "cards" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                {businessContext.actors.map((actor) => (
                  <div
                    key={actor.id}
                    style={{
                      padding: "20px",
                      background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: settings.visualStyle === "clean" ? "8px" : "4px",
                      boxShadow: colors.shadow,
                      color: colors.text,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "8px" }}>
                      {actor.name}
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "4px" }}>
                      {actor.role} • {actor.department}
                    </div>
                    {actor.activities.length > 0 && (
                      <div style={{ fontSize: "12px", marginTop: "8px", opacity: 0.8 }}>
                        {actor.activities.slice(0, 3).join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {businessContext.actors.map((actor) => (
                  <div
                    key={actor.id}
                    style={{
                      padding: "10px 16px",
                      background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: "6px",
                      color: colors.text,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {actor.name} - {actor.role}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Capabilities */}
        {businessContext.capabilities.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <h3
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              🎯 REQUIRED CAPABILITIES
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {businessContext.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#EBF5FF",
                    border: "2px solid #2563A5",
                    borderRadius: "6px",
                    color: "#2563A5",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {cap.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pain Points */}
        {businessContext.painPoints && (
          <div style={{ marginBottom: "48px" }}>
            <h3
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "20px",
              }}
            >
              ⚠️ PAIN POINTS & MOTIVATION
            </h3>
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
            >
              {businessContext.painPoints}
            </div>
          </div>
        )}

        {/* Legend */}
        {settings.showLegend && (
          <div
            style={{
              marginTop: "48px",
              padding: "20px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "12px" }}>Legend:</div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              Visual Style: {settings.visualStyle.toUpperCase()} • Layout:{" "}
              {settings.layoutMode.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <button
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
          }}
        >
          Export to PDF / PowerPoint
        </button>
      </div>
    </div>
  );
}

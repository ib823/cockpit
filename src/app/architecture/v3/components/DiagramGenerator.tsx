/**
 * Diagram Generator (Orchestrator)
 * Routes to the correct diagram component based on diagram type
 * - BusinessContextDiagram: Shows entities, stakeholders, capabilities
 * - CurrentLandscapeDiagram: Shows AS-IS systems and integrations
 * - ProposedSolutionDiagram: Shows TO-BE roadmap and migration plan
 */

"use client";

import { ArrowLeft, Palette } from "lucide-react";
import { BusinessContextDiagram } from "./BusinessContextDiagram";
import { CurrentLandscapeDiagram } from "./CurrentLandscapeDiagram";
import { ProposedSolutionDiagram } from "./ProposedSolutionDiagram";
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
  DiagramType,
  ExportOptions,
} from "../types";

interface DiagramGeneratorProps {
  diagramType: DiagramType;
  businessContext: BusinessContextData;
  currentLandscape: CurrentLandscapeData;
  proposedSolution: ProposedSolutionData;
  settings: DiagramSettings;
  onEdit: () => void;
  onChangeStyle: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export function DiagramGenerator({
  diagramType,
  businessContext,
  currentLandscape,
  proposedSolution,
  settings,
  onEdit,
  onChangeStyle,
  onExport,
}: DiagramGeneratorProps) {
  // Route to the correct diagram component based on diagram type
  const renderDiagram = () => {
    switch (diagramType) {
      case "business-context":
        return (
          <BusinessContextDiagram
            data={businessContext}
            settings={settings}
            onExport={onExport}
          />
        );
      case "as-is":
        return (
          <CurrentLandscapeDiagram
            data={currentLandscape}
            settings={settings}
            onExport={onExport}
          />
        );
      case "to-be":
        return (
          <ProposedSolutionDiagram
            data={proposedSolution}
            settings={settings}
            onExport={onExport}
          />
        );
      default:
        return (
          <div
            style={{
              textAlign: "center",
              padding: "64px 32px",
              color: "#999",
            }}
          >
            <p style={{ fontSize: "16px" }}>Unknown diagram type</p>
          </div>
        );
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 32px" }}>
      {/* Header Controls */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
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
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            aria-label="Return to edit mode"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Edit
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
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            aria-label="Change diagram visual style"
          >
            <Palette className="w-4 h-4" aria-hidden="true" />
            Change Style
          </button>
        </div>
      </div>

      {/* Render the appropriate diagram */}
      {renderDiagram()}
    </div>
  );
}

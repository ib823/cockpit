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
          <div className="text-center py-16 px-8 text-secondary">
            <p className="body-large">Unknown diagram type</p>
          </div>
        );
    }
  };

  return (
    <div className="content-max-w p-8">
      {/* Header Controls */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-3">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 py-2 px-5 bg-primary border border-subtle rounded-md body text-sm cursor-pointer hover:bg-secondary transition-default"
            aria-label="Return to edit mode"
          >
            <ArrowLeft className="w-4 h-4 text-blue" aria-hidden="true" />
            Back to Edit
          </button>
          <button
            onClick={onChangeStyle}
            className="inline-flex items-center gap-2 py-2 px-5 bg-primary border border-subtle rounded-md body text-sm cursor-pointer hover:bg-secondary transition-default"
            aria-label="Change diagram visual style"
          >
            <Palette className="w-4 h-4 text-blue" aria-hidden="true" />
            Change Style
          </button>
        </div>
      </div>

      {/* Render the appropriate diagram */}
      {renderDiagram()}
    </div>
  );
}

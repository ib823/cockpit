/**
 * Architecture V3 - Complete Type Definitions
 * All data structures for Business Context, Current Landscape, Proposed Solution
 */

// ============================================================================
// BUSINESS CONTEXT
// ============================================================================

export interface BusinessEntity {
  id: string;
  name: string;
  location?: string;
  description?: string;
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  department: string;
  activities: string[];
  entityId?: string; // Which entity they belong to
}

export interface Capability {
  id: string;
  name: string;
  category?: string; // Finance, Operations, Supply Chain, etc.
}

export interface BusinessContextData {
  entities: BusinessEntity[];
  actors: Actor[];
  capabilities: Capability[];
  painPoints: string; // Free text area
}

// ============================================================================
// CURRENT LANDSCAPE (AS-IS)
// ============================================================================

export interface CurrentSystem {
  id: string;
  name: string;
  vendor?: string; // Oracle, SAP, Custom, etc.
  version?: string;
  modules: string[]; // List of modules/capabilities
  entityId?: string; // Which entity uses this
  status?: "active" | "retiring" | "keep"; // For TO-BE planning
}

export interface Integration {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  method: string; // SFTP, REST API, Manual, etc.
  frequency?: string; // Real-time, Daily, Weekly, etc.
  dataType?: string; // What data is transferred
  direction: "one-way" | "two-way";
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: string; // Banking, Government, Partner, etc.
  purpose: string;
  interface?: string; // How we connect
}

export interface CurrentLandscapeData {
  systems: CurrentSystem[];
  integrations: Integration[];
  externalSystems: ExternalSystem[];
}

// ============================================================================
// PROPOSED SOLUTION (TO-BE)
// ============================================================================

export interface ProposedSystem {
  id: string;
  name: string;
  vendor?: string;
  modules: string[];
  phaseId: string; // Which phase this belongs to
  isNew: boolean; // true = new system, false = reused from AS-IS
  reusedFromId?: string; // If reused, which AS-IS system ID
}

export interface Phase {
  id: string;
  name: string;
  order: number; // 1, 2, 3...
  scope: "in-scope" | "future"; // In scope vs future scope
  timeline?: string; // "Q1 2025" or "2026+"
  description?: string;
}

export interface ProposedIntegration {
  id: string;
  name: string;
  sourceSystemId: string;
  targetSystemId: string;
  method: string;
  phaseId: string; // Which phase this integration is implemented
}

export interface ProposedSolutionData {
  phases: Phase[];
  systems: ProposedSystem[];
  integrations: ProposedIntegration[];
  retainedExternalSystems: string[]; // IDs of external systems from AS-IS
}

// ============================================================================
// VISUAL STYLES
// ============================================================================

export type VisualStyle = "clean" | "bold" | "gradient";
export type ActorDisplay = "cards" | "tags";
export type LayoutMode = "swim-lanes" | "grouped";

export interface DiagramSettings {
  visualStyle: VisualStyle;
  actorDisplay: ActorDisplay;
  layoutMode: LayoutMode;
  showLegend: boolean;
  showIcons: boolean;
}

// ============================================================================
// COMPLETE PROJECT DATA
// ============================================================================

export interface ArchitectureProject {
  id: string;
  name: string;
  version: string;
  lastSaved: string;
  businessContext: BusinessContextData;
  currentLandscape: CurrentLandscapeData;
  proposedSolution: ProposedSolutionData;
  diagramSettings: DiagramSettings;
}

/**
 * Data Aggregator
 *
 * Responsible for aggregating data from multiple sources (stores, databases, etc.)
 * and preparing it for the recompute engine.
 *
 * This module acts as a bridge between state management and computation.
 */

import { Phase } from "@/types/core";
import { RicefwItem, FormItem, IntegrationItem } from "@/lib/ricefw/model";
import { ProjectInputs } from "./recompute";

// ============================================================================
// Types
// ============================================================================

export interface StoreSnapshot {
  // From presales-store
  chips?: Array<{
    id: string;
    type: string;
    value: string;
    confidence: number;
  }>;
  decisions?: Record<string, any>;
  completenessScore?: number;

  // From timeline-store
  phases?: Phase[];
  selectedPackages?: string[];

  // From project-store (if exists)
  ricefwItems?: RicefwItem[];
  formItems?: FormItem[];
  integrationItems?: IntegrationItem[];

  // Configuration
  averageHourlyRate?: number;
  region?: string;
}

export interface AggregatedData extends ProjectInputs {
  // Metadata
  aggregatedAt: Date;
  dataSourceVersion: string;
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate data from all stores into a single ProjectInputs object
 */
export function aggregateFromStores(snapshot: StoreSnapshot): AggregatedData {
  return {
    // Presales data
    chipCount: snapshot.chips?.length || 0,
    completenessScore: snapshot.completenessScore || 0,
    decisions: snapshot.decisions || {},

    // Timeline data
    phases: snapshot.phases || [],
    selectedPackages: snapshot.selectedPackages || [],

    // Estimation data
    ricefwItems: snapshot.ricefwItems || [],
    formItems: snapshot.formItems || [],
    integrationItems: snapshot.integrationItems || [],

    // Configuration
    averageHourlyRate: snapshot.averageHourlyRate || 150,
    region: snapshot.region || "ABMY",

    // Metadata
    aggregatedAt: new Date(),
    dataSourceVersion: "1.0.0",
  };
}

/**
 * Aggregate data from database query results
 */
export function aggregateFromDatabase(data: {
  project?: any;
  chips?: any[];
  decisions?: any[];
  phases?: any[];
  ricefwItems?: any[];
  formItems?: any[];
  integrationItems?: any[];
}): AggregatedData {
  // Extract project configuration
  const project = data.project || {};
  const averageHourlyRate = project.averageHourlyRate || 150;
  const region = project.region || "ABMY";

  // Convert decisions array to record
  const decisions: Record<string, any> = {};
  if (data.decisions) {
    for (const decision of data.decisions) {
      decisions[decision.key] = decision.value;
    }
  }

  // Map database phases to Phase type
  const phases: Phase[] = (data.phases || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || "implementation",
    startBusinessDay: p.startBusinessDay || 0,
    workingDays: p.workingDays || p.duration || 0,
    effort: p.effort || 0,
    color: p.color || "#3b82f6",
    dependencies: p.dependencies || [],
    skipHolidays: p.skipHolidays !== undefined ? p.skipHolidays : true,
  }));

  // Map database RICEFW items to RicefwItem type
  const ricefwItems: RicefwItem[] = (data.ricefwItems || []).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    type: item.type as any,
    name: item.name,
    description: item.description || undefined,
    complexity: item.complexity as any,
    count: item.count,
    effortPerItem: Number(item.effortPerItem),
    totalEffort: Number(item.totalEffort),
    phase: item.phase as any,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  // Map database form items to FormItem type
  const formItems: FormItem[] = (data.formItems || []).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    name: item.name,
    type: item.type as any,
    languages: item.languages || [],
    complexity: item.complexity as any,
    effort: Number(item.effort),
    createdAt: item.createdAt,
  }));

  // Map database integration items to IntegrationItem type
  const integrationItems: IntegrationItem[] = (data.integrationItems || []).map((item) => ({
    id: item.id,
    projectId: item.projectId,
    name: item.name,
    type: item.type as any,
    source: item.source,
    target: item.target,
    complexity: item.complexity as any,
    volume: item.volume as any,
    effort: Number(item.effort),
    createdAt: item.createdAt,
  }));

  return {
    // Presales data
    chipCount: data.chips?.length || 0,
    completenessScore: calculateCompletenessFromChips(data.chips || []),
    decisions,

    // Timeline data
    phases,
    selectedPackages: [], // Would need to be extracted from decisions or project config

    // Estimation data
    ricefwItems,
    formItems,
    integrationItems,

    // Configuration
    averageHourlyRate,
    region,

    // Metadata
    aggregatedAt: new Date(),
    dataSourceVersion: "1.0.0",
  };
}

/**
 * Merge partial updates into existing aggregated data
 */
export function mergeUpdates(
  existing: AggregatedData,
  updates: Partial<StoreSnapshot>
): AggregatedData {
  return {
    ...existing,
    ...updates,
    aggregatedAt: new Date(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate completeness score from chips
 * (Simplified version - actual logic should match presales-store)
 */
function calculateCompletenessFromChips(chips: any[]): number {
  if (chips.length === 0) return 0;

  // Count chips by type
  const counts: Record<string, number> = {};
  for (const chip of chips) {
    const type = chip.type?.toLowerCase() || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }

  // Weighted scoring (simplified)
  let score = 0;
  const weights: Record<string, number> = {
    country: 15,
    industry: 15,
    modules: 15,
    "legal-entities": 15,
    employees: 10,
    revenue: 10,
    timeline: 10,
    budget: 10,
  };

  for (const [type, weight] of Object.entries(weights)) {
    if (counts[type] && counts[type] > 0) {
      score += weight;
    }
  }

  return Math.min(100, score);
}

/**
 * Extract selected SAP packages from decisions
 */
export function extractSelectedPackages(decisions: Record<string, any>): string[] {
  const packages: string[] = [];

  // Check module combo decision
  const moduleCombo = decisions.moduleCombo;
  if (moduleCombo) {
    // Map module combo to SAP packages (simplified)
    const packageMap: Record<string, string[]> = {
      "finance-only": ["sap-fico"],
      "finance-supply": ["sap-fico", "sap-mm", "sap-sd"],
      "full-erp": ["sap-fico", "sap-mm", "sap-sd", "sap-pp", "sap-hr"],
    };
    packages.push(...(packageMap[moduleCombo] || []));
  }

  return packages;
}

/**
 * Validate aggregated data for consistency
 */
export function validateAggregatedData(data: AggregatedData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required fields
  if (data.chipCount === undefined) {
    errors.push("Missing chipCount");
  }

  if (data.completenessScore === undefined) {
    errors.push("Missing completenessScore");
  }

  // Check for data consistency
  if (data.ricefwItems && data.ricefwItems.length > 0) {
    for (const item of data.ricefwItems) {
      if (!item.id || !item.name || !item.type) {
        errors.push(`Invalid RICEFW item: ${JSON.stringify(item)}`);
      }
    }
  }

  if (data.phases && data.phases.length > 0) {
    for (const phase of data.phases) {
      if (!phase.id || !phase.name) {
        errors.push(`Invalid phase: ${JSON.stringify(phase)}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

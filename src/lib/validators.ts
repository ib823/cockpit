/**
 * MILESTONE 5: VALIDATORS
 *
 * Validation functions for chip completeness and phase sequencing.
 */

import { Chip, ChipType } from "@/types/core";
import { Phase } from "@/lib/timeline/phase-generation";

// ============================================================================
// CHIP COMPLETENESS VALIDATION
// ============================================================================

export interface CompletenessResult {
  score: number;
  isComplete: boolean;
  missingFields: string[];
  criticalGaps: string[];
  warnings: string[];
}

// Minimum chip requirements for project generation
const REQUIRED_CHIP_TYPES: ChipType[] = ["COUNTRY", "INDUSTRY", "MODULES"];

const RECOMMENDED_CHIP_TYPES: ChipType[] = ["EMPLOYEES", "LEGAL_ENTITIES", "LOCATIONS"];

/**
 * Validate chip completeness
 */
export function validateChipCompleteness(chips: Chip[]): CompletenessResult {
  const chipTypes = new Set(chips.map((c) => c.type));
  const missingFields: string[] = [];
  const criticalGaps: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  REQUIRED_CHIP_TYPES.forEach((type) => {
    if (!chipTypes.has(type)) {
      missingFields.push(type);
      criticalGaps.push(`Missing critical field: ${type}`);
    }
  });

  // Check recommended fields
  RECOMMENDED_CHIP_TYPES.forEach((type) => {
    if (!chipTypes.has(type)) {
      missingFields.push(type);
      warnings.push(`Recommended field missing: ${type}`);
    }
  });

  // Check for low-confidence chips
  const lowConfidenceChips = chips.filter((c) => c.confidence < 0.6);
  if (lowConfidenceChips.length > 0) {
    warnings.push(`${lowConfidenceChips.length} chip(s) have low confidence (<60%)`);
  }

  // Calculate completeness score
  const requiredScore =
    (REQUIRED_CHIP_TYPES.filter((type) => chipTypes.has(type)).length /
      REQUIRED_CHIP_TYPES.length) *
    60;
  const recommendedScore =
    (RECOMMENDED_CHIP_TYPES.filter((type) => chipTypes.has(type)).length /
      RECOMMENDED_CHIP_TYPES.length) *
    30;
  const qualityScore = chips.length > 0 ? Math.min(10, (chips.length / 5) * 10) : 0;
  const confidenceScore =
    chips.length > 0 ? (chips.reduce((sum, c) => sum + c.confidence, 0) / chips.length) * 10 : 0;

  const score = Math.round(
    requiredScore + recommendedScore + qualityScore - lowConfidenceChips.length * 2
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    isComplete: criticalGaps.length === 0 && score >= 65,
    missingFields,
    criticalGaps,
    warnings,
  };
}

/**
 * Validate individual chip
 */
export function validateChip(chip: Chip): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!chip.type) {
    errors.push("Chip type is required");
  }

  if (!chip.value || (typeof chip.value === "string" && chip.value.trim().length === 0)) {
    errors.push("Chip value is required");
  }

  if (chip.confidence < 0 || chip.confidence > 1) {
    errors.push("Confidence must be between 0 and 1");
  }

  // Type-specific validation
  if (chip.type === "EMPLOYEES" && typeof chip.value === "string") {
    const numValue = parseInt(chip.value);
    if (isNaN(numValue) || numValue <= 0) {
      errors.push("Employee count must be a positive number");
    }
  }

  if (chip.type === "REVENUE" && typeof chip.value === "string") {
    const numValue = parseFloat(chip.value.replace(/[^\d.-]/g, ""));
    if (isNaN(numValue) || numValue <= 0) {
      errors.push("Revenue must be a positive number");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// PHASE SEQUENCING VALIDATION
// ============================================================================

export interface SequencingResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate phase sequencing and dependencies
 */
export function validatePhaseSequencing(phases: Phase[]): SequencingResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (phases.length === 0) {
    errors.push("No phases defined");
    return { valid: false, errors, warnings, suggestions };
  }

  // Check for phase name uniqueness
  const phaseNames = new Set<string>();
  phases.forEach((phase) => {
    if (phaseNames.has(phase.name)) {
      errors.push(`Duplicate phase name: ${phase.name}`);
    }
    phaseNames.add(phase.name);
  });

  // Check for phase ID uniqueness
  const phaseIds = new Set<string>();
  phases.forEach((phase) => {
    if (phaseIds.has(phase.id)) {
      errors.push(`Duplicate phase ID: ${phase.id}`);
    }
    phaseIds.add(phase.id);
  });

  // Check for overlapping phases
  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i];
    const currentEnd = current.startBusinessDay + current.workingDays;

    for (let j = i + 1; j < phases.length; j++) {
      const next = phases[j];
      const nextEnd = next.startBusinessDay + next.workingDays;

      // Check for overlap
      if (
        (next.startBusinessDay >= current.startBusinessDay && next.startBusinessDay < currentEnd) ||
        (current.startBusinessDay >= next.startBusinessDay && current.startBusinessDay < nextEnd)
      ) {
        warnings.push(`Phases "${current.name}" and "${next.name}" overlap`);
      }
    }
  }

  // Check for dependency validity
  phases.forEach((phase) => {
    if (phase.dependencies && phase.dependencies.length > 0) {
      phase.dependencies.forEach((depId) => {
        const depPhase = phases.find((p) => p.id === depId);

        if (!depPhase) {
          errors.push(`Phase "${phase.name}" depends on non-existent phase ID: ${depId}`);
        } else {
          // Check if dependency phase ends before current phase starts
          const depEnd = depPhase.startBusinessDay + depPhase.workingDays;
          if (depEnd > phase.startBusinessDay) {
            errors.push(
              `Phase "${phase.name}" starts before its dependency "${depPhase.name}" completes`
            );
          }
        }
      });
    }
  });

  // Check for negative or zero working days
  phases.forEach((phase) => {
    if (phase.workingDays <= 0) {
      errors.push(`Phase "${phase.name}" has invalid working days: ${phase.workingDays}`);
    }
    if (phase.workingDays > 365) {
      warnings.push(`Phase "${phase.name}" has unusually long duration: ${phase.workingDays} days`);
    }
  });

  // Check for negative or zero effort
  phases.forEach((phase) => {
    if (phase.effort && phase.effort < 0) {
      errors.push(`Phase "${phase.name}" has negative effort: ${phase.effort}`);
    }
    if (phase.effort === 0) {
      warnings.push(`Phase "${phase.name}" has zero effort`);
    }
  });

  // Check for resource allocation
  phases.forEach((phase) => {
    if (!phase.resources || phase.resources.length === 0) {
      warnings.push(`Phase "${phase.name}" has no resources assigned`);
    } else {
      phase.resources.forEach((resource) => {
        if (resource.allocation < 0 || resource.allocation > 150) {
          warnings.push(
            `Resource "${resource.name}" in phase "${phase.name}" has invalid allocation: ${resource.allocation}%`
          );
        }
      });
    }
  });

  // Suggestions for optimization
  const totalDays = phases.reduce((sum, p) => sum + p.workingDays, 0);
  if (totalDays > 365) {
    suggestions.push(
      `Total project duration is ${totalDays} days (>1 year). Consider parallel execution or scope reduction.`
    );
  }

  const totalEffort = phases.reduce((sum, p) => sum + (p.effort || 0), 0);
  if (totalEffort > 5000) {
    suggestions.push(
      `Total effort is ${totalEffort} person-days. This is a large project - ensure adequate resources.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Validate individual phase
 */
export function validatePhase(phase: Phase): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!phase.id || phase.id.trim().length === 0) {
    errors.push("Phase ID is required");
  }

  if (!phase.name || phase.name.trim().length === 0) {
    errors.push("Phase name is required");
  }

  if (phase.workingDays <= 0) {
    errors.push("Working days must be positive");
  }

  if (phase.effort && phase.effort < 0) {
    errors.push("Effort cannot be negative");
  }

  if (phase.startBusinessDay < 0) {
    errors.push("Start business day cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// COMBINED VALIDATION
// ============================================================================

export interface ProjectValidationResult {
  chipValidation: CompletenessResult;
  phaseValidation: SequencingResult;
  overallValid: boolean;
  canGenerate: boolean;
}

/**
 * Validate entire project (chips + phases)
 */
export function validateProject(chips: Chip[], phases: Phase[]): ProjectValidationResult {
  const chipValidation = validateChipCompleteness(chips);
  const phaseValidation = validatePhaseSequencing(phases);

  return {
    chipValidation,
    phaseValidation,
    overallValid: chipValidation.isComplete && phaseValidation.valid,
    canGenerate: chipValidation.isComplete,
  };
}

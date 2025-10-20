/**
 * Resource Parser - Stage 2 of Import
 * Parses: Role | Designation | W1 | W2 | W3 | ...
 * Maps weekly effort to actual calendar dates based on Stage 1 schedule
 *
 * Security: Input validation, sanitization, numeric bounds
 * Performance: Efficient week-to-date mapping, minimal allocations
 */

import { parse, isValid, format, addDays, startOfWeek } from 'date-fns';
import type { ParsedSchedule } from './schedule-parser';
import type { ResourceCategory, ResourceDesignation } from '@/types/gantt-tool';

// Types
export interface ParsedResource {
  name: string;
  designation: ResourceDesignation;
  category: ResourceCategory;
  weeklyEffort: Array<{
    weekStartDate: string; // YYYY-MM-DD (Monday)
    days: number;
  }>;
  totalDays: number;
  originalDesignation?: string; // Original input for tracking
  originalCategory?: string; // Original inferred category
  requiresMapping?: boolean; // True if failed to auto-map
  rowNumber?: number; // For error reporting
}

export interface ParsedResources {
  resources: ParsedResource[];
  weeklyHeaders: string[];
  totalMandays: number;
  unmappedResources: UnmappedResource[]; // Resources that need manual mapping
}

export interface UnmappedResource {
  rowNumber: number;
  name: string;
  originalDesignation: string;
  suggestedCategory?: ResourceCategory;
  weeklyEffort: Array<{
    weekStartDate: string;
    days: number;
  }>;
  totalDays: number;
}

export interface ResourceParseError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ResourceParseResult {
  success: boolean;
  data?: ParsedResources;
  errors: ResourceParseError[];
  warnings: string[];
  requiresMapping?: boolean; // True if any resources need manual mapping
}

// Constants
const MAX_INPUT_SIZE = 500_000;
const MAX_RESOURCES = 1_000;
const MAX_DAYS_PER_WEEK = 5;
const MAX_FIELD_LENGTH = 200;

/**
 * Sanitize input (reuse from schedule-parser)
 */
function sanitizeInput(text: string): string {
  if (!text) return '';

  const SQL_KEYWORDS = /\b(DROP|DELETE|UPDATE|INSERT|UNION|SELECT|ALTER|CREATE)\b/gi;
  const XSS_PATTERNS = /<script|javascript:|onerror=/gi;

  if (SQL_KEYWORDS.test(text)) {
    throw new Error('Input contains forbidden SQL keywords');
  }

  if (XSS_PATTERNS.test(text)) {
    throw new Error('Input contains forbidden script patterns');
  }

  return text.trim().substring(0, MAX_FIELD_LENGTH);
}

/**
 * Parse weekly headers to actual Monday dates
 */
function parseWeeklyHeaders(headers: string[], projectStartDate: string): string[] {
  const startDate = new Date(projectStartDate);
  const monday = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday

  return headers.map((_, index) => {
    const weekStartDate = addDays(monday, index * 7);
    return format(weekStartDate, 'yyyy-MM-dd');
  });
}

/**
 * Map designation string to ResourceDesignation enum
 */
function mapDesignation(designationStr: string): ResourceDesignation | null {
  const normalized = designationStr.toLowerCase().replace(/[^a-z]/g, '');

  const mapping: Record<string, ResourceDesignation> = {
    'principal': 'principal',
    'director': 'director',
    'seniormanager': 'senior_manager',
    'srmanager': 'senior_manager',
    'manager': 'manager',
    'seniorconsultant': 'senior_consultant',
    'srconsultant': 'senior_consultant',
    'consultant': 'consultant',
    'analyst': 'analyst',
    'subcontractor': 'subcontractor',
    'subcon': 'subcontractor',
  };

  return mapping[normalized] || null;
}

/**
 * Infer resource category from role name only (for suggestions)
 */
function inferCategoryFromRole(roleName: string): ResourceCategory {
  const lower = roleName.toLowerCase();

  // PM - check first as it's very specific
  if (lower.includes('pm') || lower.includes('project manager') || lower.includes('program manager')) {
    return 'pm';
  }

  // QA - check before "lead" since we have "QA Lead"
  if (lower.includes('qa') || lower.includes('quality') || lower.includes('test')) {
    return 'qa';
  }

  // Change Management - check before "lead" since we have "Training Lead"
  if (lower.includes('change') || lower.includes('training') || lower.includes('ocm')) {
    return 'change';
  }

  // Security - check before general categories
  if (lower.includes('security') || lower.includes('auth')) {
    return 'security';
  }

  // Basis - check before general categories
  if (lower.includes('basis') || lower.includes('infra') || lower.includes('cloud')) {
    return 'basis';
  }

  // Technical - check before leadership
  if (lower.includes('dev') || lower.includes('abap') || lower.includes('code') || lower.includes('technical')) {
    return 'technical';
  }

  // Leadership - architects, leads
  if (lower.includes('lead') || lower.includes('architect')) {
    return 'leadership';
  }

  // Functional - SAP modules and generic consultants
  if (lower.includes('fico') || lower.includes('mm') || lower.includes('sd') || lower.includes('pp') ||
      lower.includes('consultant') || lower.includes('functional')) {
    return 'functional';
  }

  return 'other';
}

/**
 * Infer resource category from role name and designation
 * Order matters - more specific matches should come before general ones
 */
function inferCategory(roleName: string, designation: ResourceDesignation): ResourceCategory {
  const lower = roleName.toLowerCase();

  // PM - check first as it's very specific
  if (lower.includes('pm') || lower.includes('project manager') || lower.includes('program manager')) {
    return 'pm';
  }

  // QA - check before "lead" since we have "QA Lead"
  if (lower.includes('qa') || lower.includes('quality') || lower.includes('test')) {
    return 'qa';
  }

  // Change Management - check before "lead" since we have "Training Lead"
  if (lower.includes('change') || lower.includes('training') || lower.includes('ocm')) {
    return 'change';
  }

  // Security - check before general categories
  if (lower.includes('security') || lower.includes('auth')) {
    return 'security';
  }

  // Basis - check before general categories
  if (lower.includes('basis') || lower.includes('infra') || lower.includes('cloud')) {
    return 'basis';
  }

  // Technical - check before leadership
  if (lower.includes('dev') || lower.includes('abap') || lower.includes('code') || lower.includes('technical')) {
    return 'technical';
  }

  // Leadership - architects, leads, and senior positions
  if (lower.includes('lead') || lower.includes('architect') || designation === 'principal' || designation === 'director') {
    return 'leadership';
  }

  // Functional - SAP modules and generic consultants
  if (lower.includes('fico') || lower.includes('mm') || lower.includes('sd') || lower.includes('pp') ||
      lower.includes('consultant') || lower.includes('functional')) {
    return 'functional';
  }

  return 'other';
}

/**
 * Parse resource data (TSV format)
 * Expected format: Role \t Designation \t W1 \t W2 \t W3 \t ...
 */
export function parseResourceData(
  tsvText: string,
  scheduleData: ParsedSchedule
): ResourceParseResult {
  const errors: ResourceParseError[] = [];
  const warnings: string[] = [];

  // Input validation
  if (!tsvText || !tsvText.trim()) {
    return {
      success: false,
      errors: [{ row: 0, column: 'general', message: 'No resource data provided', severity: 'error' }],
      warnings: [],
    };
  }

  if (tsvText.length > MAX_INPUT_SIZE) {
    return {
      success: false,
      errors: [{
        row: 0,
        column: 'general',
        message: `Input too large (${(tsvText.length / 1000).toFixed(1)}KB). Maximum: ${MAX_INPUT_SIZE / 1000}KB`,
        severity: 'error'
      }],
      warnings: [],
    };
  }

  const lines = tsvText.split('\n').filter(l => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, column: 'general', message: 'No valid lines found', severity: 'error' }],
      warnings: [],
    };
  }

  // First line should be header
  const headerCells = lines[0].split('\t').map(c => c.trim());

  // Find where weekly columns start (after Role and Designation)
  const weekStartIndex = 2; // Role, Designation, then weeks
  const weeklyHeaders = headerCells.slice(weekStartIndex);

  if (weeklyHeaders.length === 0) {
    return {
      success: false,
      errors: [{ row: 1, column: 'general', message: 'No weekly columns found. Expected: W1, W2, ... or date headers.', severity: 'error' }],
      warnings: [],
    };
  }

  // Parse weekly headers to actual dates
  const weekDates = parseWeeklyHeaders(weeklyHeaders, scheduleData.projectStartDate);

  // Parse resource rows
  const resources: ParsedResource[] = [];
  const unmappedResources: UnmappedResource[] = [];
  let totalMandays = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split('\t').map(c => c.trim());

    // Skip empty lines
    if (cells.every(c => !c)) {
      continue;
    }

    const [roleName, designationStr, ...effortCells] = cells;

    // Validate required fields
    if (!roleName) {
      errors.push({ row: i + 1, column: 'role', message: 'Role name is required', severity: 'error' });
      continue;
    }

    if (!designationStr) {
      errors.push({ row: i + 1, column: 'designation', message: 'Designation is required', severity: 'error' });
      continue;
    }

    // Sanitize inputs
    let sanitizedRole: string;
    let sanitizedDesignation: string;
    try {
      sanitizedRole = sanitizeInput(roleName);
      sanitizedDesignation = sanitizeInput(designationStr);
    } catch (e) {
      errors.push({
        row: i + 1,
        column: 'general',
        message: e instanceof Error ? e.message : 'Input validation failed',
        severity: 'error'
      });
      continue;
    }

    // Parse weekly effort (needed for both mapped and unmapped resources)
    const weeklyEffort: Array<{ weekStartDate: string; days: number }> = [];
    let resourceTotalDays = 0;

    for (let w = 0; w < effortCells.length && w < weekDates.length; w++) {
      const cellValue = effortCells[w];

      if (!cellValue || cellValue === '-' || cellValue === '') {
        continue;
      }

      const days = parseFloat(cellValue);

      if (isNaN(days)) {
        warnings.push(`Row ${i + 1}, Week ${w + 1}: Invalid number "${cellValue}". Skipping.`);
        continue;
      }

      if (days < 0) {
        errors.push({
          row: i + 1,
          column: `Week ${w + 1}`,
          message: 'Mandays cannot be negative',
          severity: 'error',
        });
        continue;
      }

      if (days > MAX_DAYS_PER_WEEK) {
        warnings.push(`Row ${i + 1}, Week ${w + 1}: ${days} days exceeds standard workweek (${MAX_DAYS_PER_WEEK} days)`);
      }

      if (days > 0) {
        weeklyEffort.push({
          weekStartDate: weekDates[w],
          days,
        });
        resourceTotalDays += days;
      }
    }

    if (weeklyEffort.length === 0) {
      warnings.push(`Row ${i + 1}: Resource "${sanitizedRole}" has no effort allocated. Skipping.`);
      continue;
    }

    // Map designation to enum
    const designation = mapDesignation(sanitizedDesignation);
    if (!designation) {
      // Store as unmapped resource for manual mapping
      const suggestedCategory = inferCategoryFromRole(sanitizedRole);

      unmappedResources.push({
        rowNumber: i + 1,
        name: sanitizedRole,
        originalDesignation: sanitizedDesignation,
        suggestedCategory,
        weeklyEffort,
        totalDays: resourceTotalDays,
      });

      warnings.push(`Row ${i + 1}: Designation "${sanitizedDesignation}" not recognized. Needs manual mapping.`);
      continue;
    }

    // Infer category from designation/role
    const category = inferCategory(sanitizedRole, designation);

    resources.push({
      name: sanitizedRole,
      designation,
      category,
      weeklyEffort,
      totalDays: resourceTotalDays,
      originalDesignation: sanitizedDesignation,
      rowNumber: i + 1,
    });

    totalMandays += resourceTotalDays;
  }

  // Return errors if any
  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Validate we have some data (either mapped or unmapped resources)
  if (resources.length === 0 && unmappedResources.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, column: 'general', message: 'No valid resources found', severity: 'error' }],
      warnings: [],
    };
  }

  // Validate resource count
  const totalResourceCount = resources.length + unmappedResources.length;
  if (totalResourceCount > MAX_RESOURCES) {
    return {
      success: false,
      errors: [{
        row: 0,
        column: 'general',
        message: `Too many resources (${totalResourceCount}). Maximum: ${MAX_RESOURCES}`,
        severity: 'error'
      }],
      warnings: [],
    };
  }

  // If we have unmapped resources, we need manual mapping
  const requiresMapping = unmappedResources.length > 0;

  return {
    success: true,
    requiresMapping,
    data: {
      resources,
      weeklyHeaders,
      totalMandays,
      unmappedResources,
    },
    errors: [],
    warnings,
  };
}

/**
 * Rate Card Management System
 *
 * Manages daily rates for resources based on designation.
 * All rates are in MYR (Malaysian Ringgit).
 */

import { ResourceDesignation, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';

// Re-export for convenience
export { RESOURCE_DESIGNATIONS };

export interface RateCardEntry {
  designation: ResourceDesignation;
  dailyRate: number; // MYR per day
  description: string;
}

/**
 * Default Rate Card for Malaysian Market (MYR)
 * Based on typical SAP consulting rates in Malaysia
 */
export const DEFAULT_RATE_CARD: Record<ResourceDesignation, RateCardEntry> = {
  principal: {
    designation: 'principal',
    dailyRate: 8000,
    description: 'Principal Consultant - Highest technical authority',
  },
  director: {
    designation: 'director',
    dailyRate: 7000,
    description: 'Director - Strategic leadership and oversight',
  },
  senior_manager: {
    designation: 'senior_manager',
    dailyRate: 5500,
    description: 'Senior Manager - Lead complex workstreams',
  },
  manager: {
    designation: 'manager',
    dailyRate: 4000,
    description: 'Manager - Manage teams and deliverables',
  },
  senior_consultant: {
    designation: 'senior_consultant',
    dailyRate: 3000,
    description: 'Senior Consultant - Subject matter expert',
  },
  consultant: {
    designation: 'consultant',
    dailyRate: 2200,
    description: 'Consultant - Experienced practitioner',
  },
  analyst: {
    designation: 'analyst',
    dailyRate: 1500,
    description: 'Analyst - Junior team member',
  },
  subcontractor: {
    designation: 'subcontractor',
    dailyRate: 1800,
    description: 'SubContractor - External resource',
  },
};

/**
 * Get daily rate for a designation
 */
export function getDailyRate(designation: ResourceDesignation): number {
  return DEFAULT_RATE_CARD[designation].dailyRate;
}

/**
 * Get hourly rate (assuming 8-hour workday)
 */
export function getHourlyRate(designation: ResourceDesignation): number {
  return DEFAULT_RATE_CARD[designation].dailyRate / 8;
}

/**
 * Calculate cost for a resource assignment
 * @param designation - Resource designation
 * @param durationDays - Number of working days
 * @param allocationPercentage - Allocation percentage (0-100)
 * @returns Total cost in MYR
 */
export function calculateAssignmentCost(
  designation: ResourceDesignation,
  durationDays: number,
  allocationPercentage: number
): number {
  const dailyRate = getDailyRate(designation);
  const allocatedDays = (durationDays * allocationPercentage) / 100;
  return dailyRate * allocatedDays;
}

/**
 * Calculate total project cost from resource assignments
 */
export interface ResourceAllocation {
  designation: ResourceDesignation;
  durationDays: number;
  allocationPercentage: number;
}

export function calculateProjectCost(allocations: ResourceAllocation[]): number {
  return allocations.reduce((total, allocation) => {
    return total + calculateAssignmentCost(
      allocation.designation,
      allocation.durationDays,
      allocation.allocationPercentage
    );
  }, 0);
}

/**
 * Format currency in MYR
 */
export function formatMYR(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency in MYR with short notation (K, M)
 */
export function formatMYRShort(amount: number): string {
  if (amount >= 1000000) {
    return `RM ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `RM ${(amount / 1000).toFixed(0)}K`;
  }
  return formatMYR(amount);
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

/**
 * Get margin color based on percentage
 */
export function getMarginColor(marginPercent: number): string {
  if (marginPercent >= 30) return '#10B981'; // Green - Excellent
  if (marginPercent >= 20) return '#3B82F6'; // Blue - Good
  if (marginPercent >= 10) return '#F59E0B'; // Orange - Warning
  return '#EF4444'; // Red - Critical
}

// @ts-nocheck
// Rate Cards - Regional pricing for different roles
import { Resource } from "@/types/core";

export interface RateCard {
  region: string;
  currency: string;
  positions: Record<string, { rate: number; seniority: number }>;
}

export const RATE_CARDS: Record<string, RateCard> = {
  ABMY: {
    region: "Malaysia",
    currency: "MYR",
    positions: {
      Partner: { rate: 2800, seniority: 9 },
      Director: { rate: 2200, seniority: 8 },
      "Senior Manager": { rate: 1800, seniority: 7 },
      Manager: { rate: 1400, seniority: 6 },
      "Senior Consultant": { rate: 1000, seniority: 5 },
      Consultant: { rate: 700, seniority: 3 },
      Analyst: { rate: 500, seniority: 1 },
    },
  },

  ABSG: {
    region: "Singapore",
    currency: "SGD",
    positions: {
      Partner: { rate: 1200, seniority: 9 },
      Director: { rate: 950, seniority: 8 },
      "Senior Manager": { rate: 750, seniority: 7 },
      Manager: { rate: 600, seniority: 6 },
      "Senior Consultant": { rate: 450, seniority: 5 },
      Consultant: { rate: 300, seniority: 3 },
      Analyst: { rate: 200, seniority: 1 },
    },
  },

  ABVN: {
    region: "Vietnam",
    currency: "VND",
    positions: {
      Partner: { rate: 15000000, seniority: 9 },
      Director: { rate: 12000000, seniority: 8 },
      "Senior Manager": { rate: 9000000, seniority: 7 },
      Manager: { rate: 7000000, seniority: 6 },
      "Senior Consultant": { rate: 5000000, seniority: 5 },
      Consultant: { rate: 3500000, seniority: 3 },
      Analyst: { rate: 2500000, seniority: 1 },
    },
  },
};

// Calculate blended rate for a team
export function calculateBlendedRate(resources: Resource[]): number {
  if (resources.length === 0) return 0;

  const totalWeightedRate = resources.reduce((sum, resource) => {
    const rate = resource.hourlyRate;
    const allocation = resource.allocation / 100;
    return sum + rate * allocation;
  }, 0);

  const totalAllocation = resources.reduce((sum, r) => sum + r.allocation / 100, 0);

  return totalAllocation > 0 ? totalWeightedRate / totalAllocation : 0;
}

// Calculate cost for resources over duration
export function calculateResourceCost(
  resources: Resource[],
  durationDays: number,
  hoursPerDay: number = 8
): number {
  return resources.reduce((total, resource) => {
    const dailyHours = hoursPerDay * (resource.allocation / 100);
    const totalHours = dailyHours * durationDays;
    return total + totalHours * resource.hourlyRate;
  }, 0);
}

// Get default team composition based on effort
export function getDefaultTeamComposition(
  effortDays: number,
  region: string = "ABMY",
  complexity: "low" | "standard" | "high" = "standard"
): Resource[] {
  const rateCard = RATE_CARDS[region];
  if (!rateCard) return [];

  const resources: Resource[] = [];

  // Determine team size based on effort
  let teamSize = 3; // minimum team
  if (effortDays > 100) teamSize = 4;
  if (effortDays > 200) teamSize = 5;
  if (effortDays > 400) teamSize = 6;
  if (effortDays > 600) teamSize = 8;

  // Adjust for complexity
  if (complexity === "high") teamSize = Math.ceil(teamSize * 1.2);
  if (complexity === "low") teamSize = Math.ceil(teamSize * 0.8);

  // Standard team composition patterns
  const compositions = {
    3: ["Manager", "Senior Consultant", "Consultant"],
    4: ["Manager", "Senior Consultant", "Senior Consultant", "Consultant"],
    5: ["Manager", "Senior Consultant", "Senior Consultant", "Consultant", "Analyst"],
    6: [
      "Senior Manager",
      "Manager",
      "Senior Consultant",
      "Senior Consultant",
      "Consultant",
      "Analyst",
    ],
    8: [
      "Senior Manager",
      "Manager",
      "Manager",
      "Senior Consultant",
      "Senior Consultant",
      "Consultant",
      "Consultant",
      "Analyst",
    ],
  };

  const composition = compositions[teamSize as keyof typeof compositions] || compositions[3];

  // Create resources with standard allocations
  const standardAllocations = [100, 100, 80, 60, 60, 50, 40, 40];

  composition.forEach((role, index) => {
    resources.push({
      id: `resource_${Date.now()}_${index}`,
      role: role as Resource["role"],
      allocation: standardAllocations[index] || 50,
      region: region as Resource["region"],
      hourlyRate: rateCard.positions[role]?.rate || 0,
    });
  });

  return resources;
}

// Format currency
export function formatCurrency(
  amount: number,
  region: string = "ABMY",
  options: { abbreviate?: boolean } = {}
): string {
  const rateCard = RATE_CARDS[region];
  const currency = rateCard?.currency || "MYR";

  if (options.abbreviate && amount >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (options.abbreviate && amount >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  }

  // Format with thousand separators
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

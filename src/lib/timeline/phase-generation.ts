import { generateResourceRequirements, STANDARD_TEAM_COMPOSITION } from "@/data/resource-catalog";
import { DEPENDENCY_MAP, SAP_CATALOG } from "@/data/sap-catalog";
import { ClientProfile, Phase, Resource, Task } from "@/types/core";

// Helper to format effort values
const formatEffort = (effort: number): number => Math.round(effort);

/**
 * Generate default 3 tasks for each phase based on SAP Activate stage
 */
const generateDefaultTasks = (stageName: string): Task[] => {
  const taskTemplates: Record<string, Task[]> = {
    Prepare: [
      {
        id: `${stageName}_task_1`,
        name: "Task 1",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Project Manager",
        description: "Project initiation and planning"
      },
      {
        id: `${stageName}_task_2`,
        name: "Task 2",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Business Analyst",
        description: "Requirements gathering"
      },
      {
        id: `${stageName}_task_3`,
        name: "Task 3",
        effortPercent: 33.34,
        daysPercent: 33.34,
        defaultRole: "Solution Architect",
        description: "Solution design"
      }
    ],
    Explore: [
      {
        id: `${stageName}_task_1`,
        name: "Task 1",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Business Analyst",
        description: "Business process mapping"
      },
      {
        id: `${stageName}_task_2`,
        name: "Task 2",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Solution Architect",
        description: "Technical architecture design"
      },
      {
        id: `${stageName}_task_3`,
        name: "Task 3",
        effortPercent: 33.34,
        daysPercent: 33.34,
        defaultRole: "Functional Consultant",
        description: "Fit-gap analysis"
      }
    ],
    Realize: [
      {
        id: `${stageName}_task_1`,
        name: "Task 1",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Developer",
        description: "Configuration and development"
      },
      {
        id: `${stageName}_task_2`,
        name: "Task 2",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Functional Consultant",
        description: "System integration testing"
      },
      {
        id: `${stageName}_task_3`,
        name: "Task 3",
        effortPercent: 33.34,
        daysPercent: 33.34,
        defaultRole: "Quality Analyst",
        description: "User acceptance testing"
      }
    ],
    Deploy: [
      {
        id: `${stageName}_task_1`,
        name: "Task 1",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Deployment Manager",
        description: "Deployment preparation"
      },
      {
        id: `${stageName}_task_2`,
        name: "Task 2",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Developer",
        description: "Production cutover"
      },
      {
        id: `${stageName}_task_3`,
        name: "Task 3",
        effortPercent: 33.34,
        daysPercent: 33.34,
        defaultRole: "Training Specialist",
        description: "User training"
      }
    ],
    Run: [
      {
        id: `${stageName}_task_1`,
        name: "Task 1",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Support Analyst",
        description: "Hypercare support"
      },
      {
        id: `${stageName}_task_2`,
        name: "Task 2",
        effortPercent: 33.33,
        daysPercent: 33.33,
        defaultRole: "Project Manager",
        description: "Performance monitoring"
      },
      {
        id: `${stageName}_task_3`,
        name: "Task 3",
        effortPercent: 33.34,
        daysPercent: 33.34,
        defaultRole: "Business Analyst",
        description: "Continuous improvement"
      }
    ]
  };

  return taskTemplates[stageName] || taskTemplates.Prepare;
};

// Phase colors for visualization
const PHASE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
];

// SAP Activate phase distribution
const SAP_ACTIVATE_PHASES = {
  Prepare: { percentage: 0.15, color: "#10B981" }, // 15% - Green
  Explore: { percentage: 0.25, color: "#3B82F6" }, // 25% - Blue
  Realize: { percentage: 0.4, color: "#8B5CF6" }, // 40% - Purple
  Deploy: { percentage: 0.15, color: "#F59E0B" }, // 15% - Yellow
  Run: { percentage: 0.05, color: "#10B981" }, // 5% - Green
};

// Generate phases from selected SAP packages
export const generateTimelineFromSAPSelection = (
  selectedPackages: string[],
  profile: ClientProfile
): Phase[] => {
  if (!selectedPackages.length) return [];

  const phases: Phase[] = [];
  let phaseIndex = 0;

  // Calculate total effort using sophisticated EffortCalculator
  const clientProfile = {
    size: profile.size || "medium",
    industry: profile.industry || "default",
    employees: profile.employees || 500,
    annualRevenue: profile.annualRevenue || 100000000,
    region: profile.region || "ABMY",
  };

  const totalEffort = calculateEffort(selectedPackages, profile.complexity, clientProfile);
  console.log(`Total effort calculated: ${totalEffort} person-days using EffortCalculator`);

  selectedPackages.forEach((packageId) => {
    const sapPackage = SAP_CATALOG[packageId];
    if (!sapPackage) return;

    // Calculate package proportion of total effort
    const packageProportion =
      (sapPackage.effort || 0) /
      selectedPackages.reduce((sum, p) => (SAP_CATALOG[p]?.effort || 0) + sum, 0);
    const packageEffort = Math.round(totalEffort * packageProportion);

    // Generate phases for each SAP Activate stage
    Object.entries(SAP_ACTIVATE_PHASES).forEach(([stageName, stageConfig]) => {
      const stageEffort = formatEffort(packageEffort * stageConfig.percentage);
      if (stageEffort === 0) return;

      const phase: Phase = {
        id: `${packageId}_${stageName}_${phaseIndex++}`,
        name: `${sapPackage.name} - ${stageName}`,
        category: `${sapPackage.category} - ${stageName}`,
        startBusinessDay: 0, // Will be calculated in sequencing
        workingDays: Math.max(5, stageEffort), // Minimum 1 week
        effort: stageEffort,
        color: stageConfig.color,
        skipHolidays: true,
        dependencies: getDependentPhases(packageId, stageName, phases),
        status: "idle",
        resources: generateResourceRequirements(stageEffort, profile.region),
        tasks: generateDefaultTasks(stageName), // Add 3 default tasks per phase
      };

      phases.push(phase);
    });
  });

  // Apply intelligent sequencing
  return calculateIntelligentSequencing(phases);
};

/**
 * Calculate total effort for selected packages based on complexity and client profile
 */
const calculateEffort = (
  selectedPackages: string[],
  complexity: string,
  clientProfile: any
): number => {
  // Base effort from SAP catalog
  const baseEffort = selectedPackages.reduce((sum, packageId) => {
    const sapPackage = SAP_CATALOG[packageId];
    return sum + (sapPackage?.effort || 0);
  }, 0);

  // Apply complexity multiplier
  const complexityMultiplier = getComplexityMultiplier(complexity, clientProfile.size);

  // Additional factors
  const industryMultiplier = clientProfile.industry === "banking" ? 1.2 : 1.0;
  const regionMultiplier = clientProfile.region === "APSG" ? 1.1 : 1.0;

  return Math.round(baseEffort * complexityMultiplier * industryMultiplier * regionMultiplier);
};

// Get complexity multiplier based on client profile
const getComplexityMultiplier = (complexity: string, size: string): number => {
  const complexityFactors = {
    simple: 0.8,
    standard: 1.0,
    complex: 1.3,
    very_complex: 1.6,
  };

  const sizeFactors = {
    small: 0.8,
    medium: 1.0,
    large: 1.2,
    enterprise: 1.5,
  };

  return (
    (complexityFactors[complexity as keyof typeof complexityFactors] || 1.0) *
    (sizeFactors[size as keyof typeof sizeFactors] || 1.0)
  );
};

// Get dependent phases for a given package and stage
const getDependentPhases = (
  packageId: string,
  stageName: string,
  existingPhases: Phase[]
): string[] => {
  const dependencies: string[] = [];

  // Get package-level dependencies
  const packageDependencies = DEPENDENCY_MAP[packageId] || [];

  packageDependencies.forEach((depPackageId) => {
    // Find the corresponding stage phase from dependent package
    const depPhase = existingPhases.find((phase) =>
      phase.id.startsWith(`${depPackageId}_${stageName}`)
    );

    if (depPhase) {
      dependencies.push(depPhase.id);
    }

    // Also depend on previous stages of the same package
    if (stageName === "Explore") {
      const preparePhase = existingPhases.find((phase) =>
        phase.id.startsWith(`${depPackageId}_Prepare`)
      );
      if (preparePhase) dependencies.push(preparePhase.id);
    }

    if (stageName === "Realize") {
      const explorePhase = existingPhases.find((phase) =>
        phase.id.startsWith(`${depPackageId}_Explore`)
      );
      if (explorePhase) dependencies.push(explorePhase.id);
    }

    if (stageName === "Deploy") {
      const realizePhase = existingPhases.find((phase) =>
        phase.id.startsWith(`${depPackageId}_Realize`)
      );
      if (realizePhase) dependencies.push(realizePhase.id);
    }

    if (stageName === "Run") {
      const deployPhase = existingPhases.find((phase) =>
        phase.id.startsWith(`${depPackageId}_Deploy`)
      );
      if (deployPhase) dependencies.push(deployPhase.id);
    }
  });

  return dependencies;
};

// Calculate intelligent phase sequencing using topological sort
export const calculateIntelligentSequencing = (phases: Phase[]): Phase[] => {
  if (!phases.length) return [];

  // Create a copy of phases to work with
  const phasesWithScheduling = [...phases];

  // Topological sort to determine order
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const sorted: Phase[] = [];

  const visit = (phaseId: string) => {
    if (visiting.has(phaseId)) {
      throw new Error(`Circular dependency detected involving phase ${phaseId}`);
    }

    if (visited.has(phaseId)) return;

    visiting.add(phaseId);

    const phase = phasesWithScheduling.find((p) => p.id === phaseId);
    if (!phase) return;

    // Visit all dependencies first
    (phase.dependencies || []).forEach((depId) => {
      visit(depId);
    });

    visiting.delete(phaseId);
    visited.add(phaseId);
    sorted.push(phase);
  };

  // Visit all phases
  phasesWithScheduling.forEach((phase) => {
    if (!visited.has(phase.id)) {
      visit(phase.id);
    }
  });

  // Calculate start dates based on dependencies
  const phaseStartDates = new Map<string, number>();

  sorted.forEach((phase) => {
    let earliestStart = 0;

    // Find the latest end date of all dependencies
    (phase.dependencies || []).forEach((depId) => {
      const depStartDate = phaseStartDates.get(depId) || 0;
      const depPhase = sorted.find((p) => p.id === depId);
      const depEndDate = depStartDate + (depPhase?.workingDays || 0);

      if (depEndDate > earliestStart) {
        earliestStart = depEndDate;
      }
    });

    phaseStartDates.set(phase.id, earliestStart);
    phase.startBusinessDay = earliestStart;
  });

  return sorted;
};

// Calculate resource requirements for a phase
export const calculateResourceRequirements = (phase: Phase, profile: ClientProfile): Resource[] => {
  const teamSize = Math.max(2, Math.ceil((phase.effort || 0) / 10)); // Minimum 2 people
  const resources: Resource[] = [];

  // Apply standard team composition
  Object.entries(STANDARD_TEAM_COMPOSITION).forEach(([role, percentage]) => {
    const allocation = Math.round(percentage * 100);

    if (allocation > 5) {
      // Only include roles with meaningful allocation
      resources.push({
        id: `${phase.id}_${role}`,
        name: `${role} for ${phase.name}`,
        role: role as any,
        region: profile.region,
        allocation,
        hourlyRate: 100, // Default hourly rate
      });
    }
  });

  return resources;
};

// Helper function to create a new phase
export const createPhase = (
  name: string,
  category: string,
  workingDays: number,
  colorIndex: number = 0,
  dependencies: string[] = []
): Phase => {
  return {
    id: `phase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    category,
    startBusinessDay: 0,
    workingDays,
    effort: workingDays,
    color: PHASE_COLORS[colorIndex % PHASE_COLORS.length],
    skipHolidays: true,
    dependencies,
    status: "idle",
    resources: [],
  };
};

// Validate phase dependencies
export const validatePhaseDependencies = (phases: Phase[]): string[] => {
  const errors: string[] = [];
  const phaseIds = new Set(phases.map((p) => p.id));

  phases.forEach((phase) => {
    (phase.dependencies || []).forEach((depId) => {
      if (!phaseIds.has(depId)) {
        errors.push(`Phase "${phase.name}" depends on non-existent phase ID: ${depId}`);
      }
    });
  });

  return errors;
};

// Export the Phase type and related interfaces
export type { ClientProfile, Phase, Resource };

/**
 * AI/ML Optimization & Recommendation Engine
 *
 * Intelligent recommendation system for resource allocation and cost optimization
 */

import { GanttProject, Resource, ResourceDesignation } from "@/types/gantt-tool";
import { calculateTotalCost, calculateUtilization, UtilizationMetrics } from "./calculation-engine";
import { getDailyRate, RESOURCE_DESIGNATIONS } from "@/lib/rate-card";

export type RecommendationType =
  | "cost_optimization"
  | "skill_optimization"
  | "risk_mitigation"
  | "timeline_optimization"
  | "resource_balancing"
  | "budget_variance"
  | "skill_gap"
  | "communication_overhead"
  | "knowledge_transfer"
  | "quality_assurance"
  | "vendor_optimization"
  | "geographic_optimization"
  | "training_needs";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: RecommendationImpact;
  confidence: number; // 0-100
  easeOfImplementation: number; // 0-100 (100 = easiest)
  strategicAlignment: number; // 0-100
  actions: RecommendationAction[];
  score: number; // Calculated composite score
  category?: "cost" | "time" | "quality" | "risk"; // Categorization for filtering
}

export interface RecommendationImpact {
  costSaving?: number; // MYR
  marginImprovement?: number; // percentage points
  timeReduction?: number; // days
  riskReduction?: number; // 0-100 scale
  description: string;
}

export interface RecommendationAction {
  action: string;
  target: string; // resourceId, phaseId, etc.
  details: string;
}

// ============================================
// Optimization Engine
// ============================================

export class OptimizationEngine {
  private project: GanttProject;
  private utilizationMetrics: UtilizationMetrics;

  constructor(project: GanttProject) {
    this.project = project;
    this.utilizationMetrics = calculateUtilization(project);
  }

  /**
   * Generate all recommendations and rank them
   */
  generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Core recommendations
    recommendations.push(...this.optimizeSkillMatching());
    recommendations.push(...this.optimizeCostEfficiency());
    recommendations.push(...this.identifyRisks());
    recommendations.push(...this.optimizeTimeline());
    recommendations.push(...this.balanceResources());

    // Advanced AI recommendations
    recommendations.push(...this.analyzeBudgetVariance());
    recommendations.push(...this.identifySkillGaps());
    recommendations.push(...this.optimizeCommunication());
    recommendations.push(...this.recommendKnowledgeTransfer());
    recommendations.push(...this.suggestQualityImprovements());
    recommendations.push(...this.optimizeVendorMix());
    recommendations.push(...this.analyzeGeographicDistribution());
    recommendations.push(...this.identifyTrainingNeeds());

    // Rank recommendations
    return this.rankRecommendations(recommendations);
  }

  /**
   * Skill-based optimization
   * Ensure resources are optimally matched to tasks
   */
  private optimizeSkillMatching(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for over-qualified resources on simple tasks
    // (This is simplified - would need skill data in real implementation)
    const resources = this.project.resources || [];
    const seniorResources = resources.filter((r) =>
      ["principal", "director", "senior_manager"].includes(r.designation)
    );

    if (seniorResources.length > resources.length * 0.4) {
      const costBreakdown = calculateTotalCost(this.project);
      const potentialSaving = costBreakdown.totalCost * 0.15; // 15% potential saving

      recommendations.push({
        id: "skill-opt-1",
        type: "skill_optimization",
        title: "Right-size Senior Resource Allocation",
        description:
          "Your project has a high percentage of senior resources. Consider using mid-level consultants for routine tasks.",
        impact: {
          costSaving: potentialSaving,
          marginImprovement: 5,
          description: `Potential savings of up to ${this.formatMYR(potentialSaving)} by optimizing resource mix`,
        },
        confidence: 75,
        easeOfImplementation: 60,
        strategicAlignment: 80,
        actions: [
          {
            action: "Replace senior resources on routine tasks",
            target: "resource-mix",
            details: `Replace ${Math.floor(seniorResources.length * 0.3)} senior resources with mid-level consultants on non-critical activities`,
          },
        ],
        score: 0, // Will be calculated
      });
    }

    return recommendations;
  }

  /**
   * Cost optimization recommendations
   */
  private optimizeCostEfficiency(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const costBreakdown = calculateTotalCost(this.project);
    const resources = this.project.resources || [];

    // 1. Identify expensive resources with low utilization
    const expensiveUnderutilized = resources.filter((resource) => {
      const utilization = this.utilizationMetrics.resourceUtilization.get(resource.id) || 0;
      const rate = getDailyRate(resource.designation);
      return utilization < 50 && rate > 4000; // Expensive and underutilized
    });

    if (expensiveUnderutilized.length > 0) {
      const totalWaste = expensiveUnderutilized.reduce((sum, resource) => {
        const utilization = this.utilizationMetrics.resourceUtilization.get(resource.id) || 0;
        const rate = getDailyRate(resource.designation);
        const allocatedDays = (costBreakdown.costByResource.get(resource.id) || 0) / rate;
        const wastedCapacity = allocatedDays * ((100 - utilization) / 100);
        return sum + wastedCapacity * rate;
      }, 0);

      recommendations.push({
        id: "cost-opt-1",
        type: "cost_optimization",
        title: "Optimize Underutilized Expensive Resources",
        description: `${expensiveUnderutilized.length} expensive resource(s) are underutilized (<50% utilization). Consider reducing allocation or redistributing work.`,
        impact: {
          costSaving: totalWaste * 0.5, // Can save 50% of waste
          marginImprovement: 3,
          description: `Reduce wasted capacity worth ${this.formatMYR(totalWaste)}`,
        },
        confidence: 85,
        easeOfImplementation: 70,
        strategicAlignment: 75,
        actions: expensiveUnderutilized.map((resource) => ({
          action: "Increase utilization or reduce allocation",
          target: resource.id,
          details: `${resource.name} (${RESOURCE_DESIGNATIONS[resource.designation]}) is only ${Math.round(this.utilizationMetrics.resourceUtilization.get(resource.id) || 0)}% utilized`,
        })),
        score: 0,
      });
    }

    // 2. Suggest phased resource ramp-up
    if (this.project.phases.length >= 3) {
      recommendations.push({
        id: "cost-opt-2",
        type: "cost_optimization",
        title: "Implement Phased Resource Ramp-up",
        description:
          "Instead of full team from day 1, gradually ramp up resources as project progresses to reduce idle time.",
        impact: {
          costSaving: costBreakdown.totalCost * 0.08, // 8% potential saving
          marginImprovement: 2,
          description: "Reduce resource idle time in early phases",
        },
        confidence: 70,
        easeOfImplementation: 65,
        strategicAlignment: 80,
        actions: [
          {
            action: "Start with core team in Prepare phase",
            target: this.project.phases[0]?.id || "",
            details: "Begin with PM and architects only",
          },
          {
            action: "Ramp up during Realize phase",
            target: this.project.phases[1]?.id || "",
            details: "Add functional and technical consultants",
          },
        ],
        score: 0,
      });
    }

    return recommendations;
  }

  /**
   * Risk mitigation recommendations
   */
  private identifyRisks(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Over-allocation risks
    if (this.utilizationMetrics.overallocatedResources.length > 0) {
      recommendations.push({
        id: "risk-1",
        type: "risk_mitigation",
        title: "Critical: Resolve Resource Over-allocation",
        description: `${this.utilizationMetrics.overallocatedResources.length} resource(s) are over-allocated, risking burnout and delays.`,
        impact: {
          riskReduction: 40,
          timeReduction: 0,
          description: "Prevent project delays and quality issues from overworked resources",
        },
        confidence: 95,
        easeOfImplementation: 50,
        strategicAlignment: 90,
        actions: this.utilizationMetrics.overallocatedResources.map((resourceId) => {
          const resource = this.project.resources?.find((r) => r.id === resourceId);
          return {
            action: "Reduce allocation or add team member",
            target: resourceId,
            details: `${resource?.name || resourceId} exceeds 100% utilization`,
          };
        }),
        score: 0,
      });
    }

    // 2. Single point of failure
    const criticalResources = this.findCriticalResources();
    if (criticalResources.length > 0) {
      recommendations.push({
        id: "risk-2",
        type: "risk_mitigation",
        title: "Mitigate Single Points of Failure",
        description:
          "Some resources are assigned to many critical tasks. Add backup resources or knowledge transfer.",
        impact: {
          riskReduction: 30,
          description: "Reduce dependency on key individuals",
        },
        confidence: 80,
        easeOfImplementation: 60,
        strategicAlignment: 85,
        actions: criticalResources.map((resource) => ({
          action: "Add backup resource or pair programming",
          target: resource.id,
          details: `${resource.name} is critical to multiple phases`,
        })),
        score: 0,
      });
    }

    return recommendations;
  }

  /**
   * Timeline optimization
   */
  private optimizeTimeline(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for sequential tasks that could be parallelized
    const parallelizablePhases = this.findParallelizableWork();

    if (parallelizablePhases.length > 0) {
      recommendations.push({
        id: "timeline-1",
        type: "timeline_optimization",
        title: "Parallelize Independent Work Streams",
        description: "Some phases/tasks can run in parallel to reduce overall timeline.",
        impact: {
          timeReduction: 15, // days
          description: "Reduce project duration by up to 2 weeks",
        },
        confidence: 75,
        easeOfImplementation: 55,
        strategicAlignment: 85,
        actions: parallelizablePhases.map((phase, idx) => ({
          action: `Run ${phase.name} in parallel`,
          target: phase.id,
          details: "This phase has no hard dependencies on previous phases",
        })),
        score: 0,
      });
    }

    return recommendations;
  }

  /**
   * Resource balancing
   */
  private balanceResources(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Move work from overallocated to underutilized resources
    const overallocated = this.utilizationMetrics.overallocatedResources;
    const underutilized = this.utilizationMetrics.underutilizedResources;

    if (overallocated.length > 0 && underutilized.length > 0) {
      recommendations.push({
        id: "balance-1",
        type: "resource_balancing",
        title: "Balance Workload Across Team",
        description: "Redistribute work from overloaded to underutilized team members.",
        impact: {
          riskReduction: 25,
          description: "Improve team morale and reduce burnout risk",
        },
        confidence: 80,
        easeOfImplementation: 65,
        strategicAlignment: 75,
        actions: [
          {
            action: "Redistribute tasks",
            target: "workload-balance",
            details: `Move work from ${overallocated.length} overloaded to ${underutilized.length} underutilized resources`,
          },
        ],
        score: 0,
      });
    }

    return recommendations;
  }

  /**
   * Budget variance analysis
   */
  private analyzeBudgetVariance(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const costBreakdown = calculateTotalCost(this.project);

    // Assume 30% margin target (would come from project settings in real app)
    const targetRevenue = costBreakdown.totalCost / 0.7;
    const targetMargin = targetRevenue - costBreakdown.totalCost;
    const marginPercent = (targetMargin / targetRevenue) * 100;

    if (marginPercent < 20) {
      recommendations.push({
        id: "budget-1",
        type: "budget_variance",
        title: "Margin Below Target - Review Pricing",
        description: `Current margin is ${marginPercent.toFixed(1)}%, below the recommended 20-30% range.`,
        impact: {
          marginImprovement: 30 - marginPercent,
          description: `Increase revenue or reduce costs to achieve target margin`,
        },
        confidence: 90,
        easeOfImplementation: 40,
        strategicAlignment: 95,
        actions: [
          {
            action: "Review and adjust pricing",
            target: "pricing",
            details: `Consider increasing proposed price by ${(((targetRevenue * 1.2 - targetRevenue) / targetRevenue) * 100).toFixed(1)}% to achieve 30% margin`,
          },
        ],
        score: 0,
        category: "cost",
      });
    }

    return recommendations;
  }

  /**
   * Skill gap analysis
   */
  private identifySkillGaps(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const resources = this.project.resources || [];

    // Analyze resource designation distribution
    const designationCounts = resources.reduce(
      (acc, r) => {
        acc[r.designation] = (acc[r.designation] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Check for missing functional consultants
    const functionalConsultants = designationCounts["senior_consultant"] || 0;
    const analysts = designationCounts["analyst"] || 0;

    if (resources.length > 5 && functionalConsultants < 2) {
      recommendations.push({
        id: "skill-gap-1",
        type: "skill_gap",
        title: "Add Functional Expertise",
        description: "Project lacks sufficient functional consultants for business process design.",
        impact: {
          riskReduction: 35,
          description: "Reduce risk of poor requirement gathering and design",
        },
        confidence: 85,
        easeOfImplementation: 75,
        strategicAlignment: 90,
        actions: [
          {
            action: "Add senior functional consultants",
            target: "team-composition",
            details: "Recommend adding 2-3 functional consultants for FI/CO, MM, SD modules",
          },
        ],
        score: 0,
        category: "risk",
      });
    }

    return recommendations;
  }

  /**
   * Communication overhead optimization
   */
  private optimizeCommunication(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const resources = this.project.resources || [];

    // If team is too large, communication overhead increases exponentially
    if (resources.length > 15) {
      const overhead = Math.pow(resources.length, 1.5) * 0.1; // Simplified model

      recommendations.push({
        id: "comm-1",
        type: "communication_overhead",
        title: "Reduce Communication Overhead",
        description: `Large team size (${resources.length} members) creates significant communication overhead.`,
        impact: {
          timeReduction: overhead,
          description: `Reduce by ${overhead.toFixed(0)} days through better team structure`,
        },
        confidence: 75,
        easeOfImplementation: 60,
        strategicAlignment: 70,
        actions: [
          {
            action: "Organize into smaller workstreams",
            target: "team-structure",
            details: "Split into 3-5 sub-teams with clear ownership and minimal cross-dependencies",
          },
          {
            action: "Establish clear communication protocols",
            target: "process",
            details: "Daily standups per workstream, weekly cross-team sync",
          },
        ],
        score: 0,
        category: "time",
      });
    }

    return recommendations;
  }

  /**
   * Knowledge transfer recommendations
   */
  private recommendKnowledgeTransfer(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const resources = this.project.resources || [];

    // Check for high ratio of contractors/subcontractors
    const subcontractors = resources.filter((r) => r.designation === "subcontractor");

    if (subcontractors.length > resources.length * 0.4) {
      recommendations.push({
        id: "knowledge-1",
        type: "knowledge_transfer",
        title: "Plan Knowledge Transfer from Contractors",
        description: `${subcontractors.length} contractors will leave after project. Plan knowledge transfer to permanent staff.`,
        impact: {
          riskReduction: 40,
          description: "Ensure business continuity post-implementation",
        },
        confidence: 90,
        easeOfImplementation: 70,
        strategicAlignment: 95,
        actions: [
          {
            action: "Schedule knowledge transfer sessions",
            target: "project-plan",
            details: "Allocate 2-3 days per contractor for documentation and training",
          },
          {
            action: "Pair contractors with permanent staff",
            target: "team-structure",
            details: "Shadow program for critical knowledge areas",
          },
        ],
        score: 0,
        category: "risk",
      });
    }

    return recommendations;
  }

  /**
   * Quality assurance recommendations
   */
  private suggestQualityImprovements(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const totalTasks = this.project.phases.reduce((sum, p) => sum + p.tasks.length, 0);

    // Check if QA resources are allocated
    const qaResources = (this.project.resources || []).filter(
      (r) => r.category === "qa" || r.name.toLowerCase().includes("test")
    );

    if (totalTasks > 20 && qaResources.length === 0) {
      recommendations.push({
        id: "quality-1",
        type: "quality_assurance",
        title: "Add Dedicated QA Resources",
        description: "Project has no dedicated QA/testing resources, risking quality issues.",
        impact: {
          riskReduction: 50,
          description: "Reduce defect leakage and rework costs",
        },
        confidence: 95,
        easeOfImplementation: 80,
        strategicAlignment: 90,
        actions: [
          {
            action: "Add QA analyst",
            target: "team-composition",
            details: "Allocate 1-2 QA resources for test planning and execution",
          },
          {
            action: "Define test strategy",
            target: "project-plan",
            details: "UAT, integration testing, and regression testing approach",
          },
        ],
        score: 0,
        category: "quality",
      });
    }

    return recommendations;
  }

  /**
   * Vendor/contractor optimization
   */
  private optimizeVendorMix(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const resources = this.project.resources || [];
    const costBreakdown = calculateTotalCost(this.project);

    const subcontractorCost = resources
      .filter((r) => r.designation === "subcontractor")
      .reduce((sum, r) => sum + (costBreakdown.costByResource.get(r.id) || 0), 0);

    const subcontractorPercent = (subcontractorCost / costBreakdown.totalCost) * 100;

    if (subcontractorPercent > 50) {
      const savings = subcontractorCost * 0.1; // 10% potential saving

      recommendations.push({
        id: "vendor-1",
        type: "vendor_optimization",
        title: "Optimize Vendor vs Internal Staff Mix",
        description: `${subcontractorPercent.toFixed(0)}% of costs are contractors. Consider hiring or insourcing.`,
        impact: {
          costSaving: savings,
          description: `Potential long-term savings of ${this.formatMYR(savings)}`,
        },
        confidence: 70,
        easeOfImplementation: 45,
        strategicAlignment: 75,
        actions: [
          {
            action: "Review contractor vs permanent staff costs",
            target: "procurement",
            details: "Analyze total cost of ownership including onboarding and retention",
          },
        ],
        score: 0,
        category: "cost",
      });
    }

    return recommendations;
  }

  /**
   * Geographic distribution analysis
   */
  private analyzeGeographicDistribution(): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // This would analyze resource locations (requires location data in real app)
    // Placeholder recommendation for demonstration
    const resources = this.project.resources || [];

    if (resources.length > 10) {
      recommendations.push({
        id: "geo-1",
        type: "geographic_optimization",
        title: "Consider Offshore/Nearshore Resources",
        description: "For non-critical activities, consider lower-cost geographies.",
        impact: {
          costSaving: calculateTotalCost(this.project).totalCost * 0.15,
          description: "Up to 15% cost reduction on suitable activities",
        },
        confidence: 65,
        easeOfImplementation: 50,
        strategicAlignment: 60,
        actions: [
          {
            action: "Identify tasks suitable for offshore execution",
            target: "project-plan",
            details: "Testing, documentation, routine configuration can be offshore",
          },
        ],
        score: 0,
        category: "cost",
      });
    }

    return recommendations;
  }

  /**
   * Training needs identification
   */
  private identifyTrainingNeeds(): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const resources = this.project.resources || [];

    // Check for junior resources
    const juniorResources = resources.filter((r) =>
      ["analyst", "consultant"].includes(r.designation)
    );

    if (juniorResources.length > resources.length * 0.3) {
      recommendations.push({
        id: "training-1",
        type: "training_needs",
        title: "Invest in Team Training",
        description: `${juniorResources.length} junior resources would benefit from upskilling.`,
        impact: {
          riskReduction: 20,
          timeReduction: 5,
          description: "Improve productivity and reduce supervision needs",
        },
        confidence: 80,
        easeOfImplementation: 85,
        strategicAlignment: 85,
        actions: [
          {
            action: "Schedule SAP certification training",
            target: "team-development",
            details: "Enroll junior consultants in module-specific certification programs",
          },
          {
            action: "Implement mentorship program",
            target: "team-structure",
            details: "Pair junior resources with senior consultants",
          },
        ],
        score: 0,
        category: "quality",
      });
    }

    return recommendations;
  }

  /**
   * Rank recommendations by composite score
   */
  private rankRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations
      .map((rec) => {
        // Multi-factor scoring
        const score =
          rec.confidence * 0.4 +
          rec.easeOfImplementation * 0.2 +
          rec.strategicAlignment * 0.1 +
          (rec.impact.costSaving ? 20 : 0) +
          (rec.impact.riskReduction ? rec.impact.riskReduction * 0.3 : 0);

        return { ...rec, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Helper: Find critical resources (single points of failure)
   */
  private findCriticalResources(): Resource[] {
    const resources = this.project.resources || [];
    const critical: Resource[] = [];

    resources.forEach((resource) => {
      let phaseCount = 0;
      let taskCount = 0;

      this.project.phases.forEach((phase) => {
        if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resource.id)) {
          phaseCount++;
        }
        phase.tasks.forEach((task) => {
          if (task.resourceAssignments?.some((a) => a.resourceId === resource.id)) {
            taskCount++;
          }
        });
      });

      // Critical if assigned to 50%+ of phases or 30%+ of tasks
      const totalPhases = this.project.phases.length;
      const totalTasks = this.project.phases.reduce((sum, p) => sum + p.tasks.length, 0);

      if (phaseCount / totalPhases > 0.5 || taskCount / totalTasks > 0.3) {
        critical.push(resource);
      }
    });

    return critical;
  }

  /**
   * Helper: Find work that can be parallelized
   */
  private findParallelizableWork() {
    // Simplified: Phases with no dependencies can potentially be parallelized
    return this.project.phases.filter((phase) => {
      return !phase.dependencies || phase.dependencies.length === 0;
    });
  }

  /**
   * Helper: Format MYR currency
   */
  private formatMYR(amount: number): string {
    if (amount >= 1000000) {
      return `RM ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RM ${(amount / 1000).toFixed(0)}K`;
    }
    return `RM ${amount.toFixed(0)}`;
  }
}

/**
 * Quick optimization suggestions
 */
export function getQuickWins(project: GanttProject): Recommendation[] {
  const engine = new OptimizationEngine(project);
  const allRecommendations = engine.generateRecommendations();

  // Return top 3 easiest and highest-impact recommendations
  return allRecommendations
    .filter((rec) => rec.easeOfImplementation >= 70 && rec.confidence >= 75)
    .slice(0, 3);
}

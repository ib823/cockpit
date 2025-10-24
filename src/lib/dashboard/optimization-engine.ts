/**
 * AI/ML Optimization & Recommendation Engine
 *
 * Intelligent recommendation system for resource allocation and cost optimization
 */

import { GanttProject, Resource, ResourceDesignation } from '@/types/gantt-tool';
import { calculateTotalCost, calculateUtilization, UtilizationMetrics } from './calculation-engine';
import { getDailyRate, RESOURCE_DESIGNATIONS } from '@/lib/rate-card';

export interface Recommendation {
  id: string;
  type: 'cost_optimization' | 'skill_optimization' | 'risk_mitigation' | 'timeline_optimization' | 'resource_balancing';
  title: string;
  description: string;
  impact: RecommendationImpact;
  confidence: number; // 0-100
  easeOfImplementation: number; // 0-100 (100 = easiest)
  strategicAlignment: number; // 0-100
  actions: RecommendationAction[];
  score: number; // Calculated composite score
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

    // 1. Skill-based optimization
    recommendations.push(...this.optimizeSkillMatching());

    // 2. Cost optimization
    recommendations.push(...this.optimizeCostEfficiency());

    // 3. Risk mitigation
    recommendations.push(...this.identifyRisks());

    // 4. Timeline optimization
    recommendations.push(...this.optimizeTimeline());

    // 5. Resource balancing
    recommendations.push(...this.balanceResources());

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
    const seniorResources = resources.filter(r =>
      ['principal', 'director', 'senior_manager'].includes(r.designation)
    );

    if (seniorResources.length > resources.length * 0.4) {
      const costBreakdown = calculateTotalCost(this.project);
      const potentialSaving = costBreakdown.totalCost * 0.15; // 15% potential saving

      recommendations.push({
        id: 'skill-opt-1',
        type: 'skill_optimization',
        title: 'Right-size Senior Resource Allocation',
        description: 'Your project has a high percentage of senior resources. Consider using mid-level consultants for routine tasks.',
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
            action: 'Replace senior resources on routine tasks',
            target: 'resource-mix',
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
    const expensiveUnderutilized = resources.filter(resource => {
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
        return sum + (wastedCapacity * rate);
      }, 0);

      recommendations.push({
        id: 'cost-opt-1',
        type: 'cost_optimization',
        title: 'Optimize Underutilized Expensive Resources',
        description: `${expensiveUnderutilized.length} expensive resource(s) are underutilized (<50% utilization). Consider reducing allocation or redistributing work.`,
        impact: {
          costSaving: totalWaste * 0.5, // Can save 50% of waste
          marginImprovement: 3,
          description: `Reduce wasted capacity worth ${this.formatMYR(totalWaste)}`,
        },
        confidence: 85,
        easeOfImplementation: 70,
        strategicAlignment: 75,
        actions: expensiveUnderutilized.map(resource => ({
          action: 'Increase utilization or reduce allocation',
          target: resource.id,
          details: `${resource.name} (${RESOURCE_DESIGNATIONS[resource.designation]}) is only ${Math.round(this.utilizationMetrics.resourceUtilization.get(resource.id) || 0)}% utilized`,
        })),
        score: 0,
      });
    }

    // 2. Suggest phased resource ramp-up
    if (this.project.phases.length >= 3) {
      recommendations.push({
        id: 'cost-opt-2',
        type: 'cost_optimization',
        title: 'Implement Phased Resource Ramp-up',
        description: 'Instead of full team from day 1, gradually ramp up resources as project progresses to reduce idle time.',
        impact: {
          costSaving: costBreakdown.totalCost * 0.08, // 8% potential saving
          marginImprovement: 2,
          description: 'Reduce resource idle time in early phases',
        },
        confidence: 70,
        easeOfImplementation: 65,
        strategicAlignment: 80,
        actions: [
          {
            action: 'Start with core team in Prepare phase',
            target: this.project.phases[0]?.id || '',
            details: 'Begin with PM and architects only',
          },
          {
            action: 'Ramp up during Realize phase',
            target: this.project.phases[1]?.id || '',
            details: 'Add functional and technical consultants',
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
        id: 'risk-1',
        type: 'risk_mitigation',
        title: 'Critical: Resolve Resource Over-allocation',
        description: `${this.utilizationMetrics.overallocatedResources.length} resource(s) are over-allocated, risking burnout and delays.`,
        impact: {
          riskReduction: 40,
          timeReduction: 0,
          description: 'Prevent project delays and quality issues from overworked resources',
        },
        confidence: 95,
        easeOfImplementation: 50,
        strategicAlignment: 90,
        actions: this.utilizationMetrics.overallocatedResources.map(resourceId => {
          const resource = this.project.resources?.find(r => r.id === resourceId);
          return {
            action: 'Reduce allocation or add team member',
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
        id: 'risk-2',
        type: 'risk_mitigation',
        title: 'Mitigate Single Points of Failure',
        description: 'Some resources are assigned to many critical tasks. Add backup resources or knowledge transfer.',
        impact: {
          riskReduction: 30,
          description: 'Reduce dependency on key individuals',
        },
        confidence: 80,
        easeOfImplementation: 60,
        strategicAlignment: 85,
        actions: criticalResources.map(resource => ({
          action: 'Add backup resource or pair programming',
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
        id: 'timeline-1',
        type: 'timeline_optimization',
        title: 'Parallelize Independent Work Streams',
        description: 'Some phases/tasks can run in parallel to reduce overall timeline.',
        impact: {
          timeReduction: 15, // days
          description: 'Reduce project duration by up to 2 weeks',
        },
        confidence: 75,
        easeOfImplementation: 55,
        strategicAlignment: 85,
        actions: parallelizablePhases.map((phase, idx) => ({
          action: `Run ${phase.name} in parallel`,
          target: phase.id,
          details: 'This phase has no hard dependencies on previous phases',
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
        id: 'balance-1',
        type: 'resource_balancing',
        title: 'Balance Workload Across Team',
        description: 'Redistribute work from overloaded to underutilized team members.',
        impact: {
          riskReduction: 25,
          description: 'Improve team morale and reduce burnout risk',
        },
        confidence: 80,
        easeOfImplementation: 65,
        strategicAlignment: 75,
        actions: [
          {
            action: 'Redistribute tasks',
            target: 'workload-balance',
            details: `Move work from ${overallocated.length} overloaded to ${underutilized.length} underutilized resources`,
          },
        ],
        score: 0,
      });
    }

    return recommendations;
  }

  /**
   * Rank recommendations by composite score
   */
  private rankRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations
      .map(rec => {
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

    resources.forEach(resource => {
      let phaseCount = 0;
      let taskCount = 0;

      this.project.phases.forEach(phase => {
        if (phase.phaseResourceAssignments?.some(a => a.resourceId === resource.id)) {
          phaseCount++;
        }
        phase.tasks.forEach(task => {
          if (task.resourceAssignments?.some(a => a.resourceId === resource.id)) {
            taskCount++;
          }
        });
      });

      // Critical if assigned to 50%+ of phases or 30%+ of tasks
      const totalPhases = this.project.phases.length;
      const totalTasks = this.project.phases.reduce((sum, p) => sum + p.tasks.length, 0);

      if (
        (phaseCount / totalPhases > 0.5) ||
        (taskCount / totalTasks > 0.3)
      ) {
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
    return this.project.phases.filter(phase => {
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
    .filter(rec => rec.easeOfImplementation >= 70 && rec.confidence >= 75)
    .slice(0, 3);
}

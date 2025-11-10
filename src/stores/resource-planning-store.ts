import type { ConfigTask } from "@/data/sap-deliverables";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ========== TYPES ==========
export interface ResourceProfile {
  id: string;
  role: string; // e.g., "Senior Consultant"
  region: "ABMY" | "ABSG" | "ABVN";
  skills: string[]; // e.g., ["SAP FI", "Accounting"]
  tasks: string[]; // Task IDs assigned
  utilization: number; // Percentage 0-100
  cost: number; // Total cost for this resource
  dailyRate: number; // Daily rate from catalog
}

export interface TaskWithState extends ConfigTask {
  completed: number; // Percentage 0-100
  delta: number; // Percentage remaining (100 - completed)
  assignedResource: string | null; // Resource ID
}

export interface Bottleneck {
  type: "overallocation" | "skill_gap" | "dependency_delay";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  impact: number; // Cost impact
  mitigation: string[]; // Suggested actions
  resourceId?: string;
  taskId?: string;
}

export interface Opportunity {
  type: "resource_share" | "parallel_work" | "offshore_candidate";
  description: string;
  savingsPotential: number; // MYR/SGD/VND
  confidence: number; // 0-100%
  actions: string[];
  taskIds?: string[];
}

export interface OptimizationResult {
  scenario: string;
  totalCost: number;
  margin: number;
  resources: ResourceProfile[];
  utilization: number; // Average utilization
  bottlenecks: Bottleneck[];
  opportunities: Opportunity[];
  confidence: number; // 0-100%
  timestamp: number;
}

// ========== STORE ==========
interface ResourcePlanningStore {
  // State
  selectedModules: string[];
  tasks: TaskWithState[];
  resources: ResourceProfile[];
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;

  // Computed
  getTotalEffort: () => number;
  getTotalCost: () => number;
  getBottlenecks: () => Bottleneck[];
  getAvgUtilization: () => number;
  getSkillGaps: () => string[];

  // Actions
  setSelectedModules: (modules: string[]) => void;
  setTasks: (tasks: TaskWithState[]) => void;
  updateTask: (taskId: string, updates: Partial<TaskWithState>) => void;
  addResource: (resource: Omit<ResourceProfile, "id" | "tasks" | "utilization" | "cost">) => void;
  updateResource: (resourceId: string, updates: Partial<ResourceProfile>) => void;
  removeResource: (resourceId: string) => void;
  runOptimization: () => void;
  reset: () => void;
}

export const useResourcePlanningStore = create<ResourcePlanningStore>()(
  persist(
    (set, get) => ({
      // ========== INITIAL STATE ==========
      selectedModules: [],
      tasks: [],
      resources: [],
      optimizationResult: null,
      isOptimizing: false,

      // ========== COMPUTED VALUES ==========
      getTotalEffort: () => {
        const { tasks } = get();
        return tasks.reduce((sum, t) => {
          const effort = t.baseEffort * (t.delta / 100);
          return sum + effort;
        }, 0);
      },

      getTotalCost: () => {
        const { resources } = get();
        return resources.reduce((sum, r) => sum + r.cost, 0);
      },

      getBottlenecks: () => {
        const { resources, tasks } = get();
        const bottlenecks: Bottleneck[] = [];

        // Check for overallocated resources
        resources.forEach((r) => {
          if (r.utilization > 90) {
            bottlenecks.push({
              type: "overallocation",
              severity: r.utilization > 110 ? "critical" : r.utilization > 100 ? "high" : "medium",
              description: `${r.role} is ${r.utilization.toFixed(0)}% utilized (overallocated)`,
              impact: (r.utilization - 100) * r.dailyRate * 0.1, // Estimate impact
              mitigation: [
                "Add another resource with same skills",
                "Reduce scope or timeline",
                "Share tasks with other resources",
              ],
              resourceId: r.id,
            });
          }
        });

        // Check for skill gaps
        const allRequiredSkills = new Set<string>();
        tasks.forEach((t) => t.skillRequired.forEach((s) => allRequiredSkills.add(s)));

        const allAvailableSkills = new Set<string>();
        resources.forEach((r) => r.skills.forEach((s) => allAvailableSkills.add(s)));

        const missingSkills = Array.from(allRequiredSkills).filter(
          (skill) => !allAvailableSkills.has(skill)
        );

        missingSkills.forEach((skill) => {
          const affectedTasks = tasks.filter((t) => t.skillRequired.includes(skill));
          bottlenecks.push({
            type: "skill_gap",
            severity: "high",
            description: `Missing skill: ${skill} (affects ${affectedTasks.length} tasks)`,
            impact: affectedTasks.reduce((sum, t) => sum + t.baseEffort, 0) * 450 * 8, // Estimate
            mitigation: [
              `Hire/assign resource with ${skill} skill`,
              "Train existing team members",
              "Engage external consultant",
            ],
            taskId: affectedTasks[0]?.id,
          });
        });

        return bottlenecks.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });
      },

      getAvgUtilization: () => {
        const { resources } = get();
        if (resources.length === 0) return 0;
        const total = resources.reduce((sum, r) => sum + r.utilization, 0);
        return total / resources.length;
      },

      getSkillGaps: () => {
        const { tasks, resources } = get();
        const allRequiredSkills = new Set<string>();
        tasks.forEach((t) => t.skillRequired.forEach((s) => allRequiredSkills.add(s)));

        const allAvailableSkills = new Set<string>();
        resources.forEach((r) => r.skills.forEach((s) => allAvailableSkills.add(s)));

        return Array.from(allRequiredSkills).filter((skill) => !allAvailableSkills.has(skill));
      },

      // ========== ACTIONS ==========
      setSelectedModules: (modules) => {
        set({ selectedModules: modules });
      },

      setTasks: (tasks) => {
        set({ tasks });
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        }));
      },

      addResource: (resource) => {
        const newResource: ResourceProfile = {
          ...resource,
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tasks: [],
          utilization: 0,
          cost: 0,
        };

        set((state) => ({
          resources: [...state.resources, newResource],
        }));
      },

      updateResource: (resourceId, updates) => {
        set((state) => ({
          resources: state.resources.map((r) => (r.id === resourceId ? { ...r, ...updates } : r)),
        }));
      },

      removeResource: (resourceId) => {
        set((state) => ({
          resources: state.resources.filter((r) => r.id !== resourceId),
          tasks: state.tasks.map((t) =>
            t.assignedResource === resourceId ? { ...t, assignedResource: null } : t
          ),
        }));
      },

      runOptimization: () => {
        const startTime = performance.now();
        set({ isOptimizing: true });

        try {
          const { tasks, resources } = get();

          if (tasks.length === 0 || resources.length === 0) {
            console.warn("[ResourcePlanning] Cannot optimize: no tasks or resources");
            set({ isOptimizing: false });
            return;
          }

          // ========== GREEDY ALLOCATION ALGORITHM ==========
          // Step 1: Sort tasks by risk level and effort (high risk first)
          const sortedTasks = [...tasks].sort((a, b) => {
            const riskOrder = { high: 3, medium: 2, low: 1 };
            const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            if (riskDiff !== 0) return riskDiff;
            return b.baseEffort - a.baseEffort;
          });

          // Step 2: Allocate each task to best-fit resource
          const allocation: Map<string, string[]> = new Map(); // resourceId → taskIds
          const updatedTasks: TaskWithState[] = [];

          sortedTasks.forEach((task) => {
            const effectiveEffort = task.baseEffort * (task.delta / 100);

            // Find suitable resources (have required skills)
            const suitableResources = resources.filter((r) =>
              task.skillRequired.every((skill) => r.skills.includes(skill))
            );

            if (suitableResources.length === 0) {
              // No suitable resource → task remains unassigned
              updatedTasks.push({ ...task, assignedResource: null });
              return;
            }

            // Pick resource with lowest utilization
            const targetResource = suitableResources.reduce((min, r) => {
              const minUtil = allocation.get(min.id)?.length || 0;
              const rUtil = allocation.get(r.id)?.length || 0;
              return rUtil < minUtil ? r : min;
            });

            // Assign task to resource
            const existing = allocation.get(targetResource.id) || [];
            allocation.set(targetResource.id, [...existing, task.id]);
            updatedTasks.push({ ...task, assignedResource: targetResource.id });
          });

          // Step 3: Calculate utilization and cost per resource
          const updatedResources = resources.map((r) => {
            const assignedTaskIds = allocation.get(r.id) || [];
            const assignedTasks = updatedTasks.filter((t) => assignedTaskIds.includes(t.id));

            const totalEffort = assignedTasks.reduce((sum, t) => {
              return sum + t.baseEffort * (t.delta / 100);
            }, 0);

            // Assume 20 PD capacity per resource (arbitrary baseline)
            const capacity = 20;
            const utilization = Math.min(150, (totalEffort / capacity) * 100);

            const cost = totalEffort * 8 * r.dailyRate; // 8 hrs/day

            return {
              ...r,
              tasks: assignedTaskIds,
              utilization,
              cost,
            };
          });

          // Step 4: Identify opportunities
          const opportunities: Opportunity[] = [];

          // Opportunity 1: Find sharable tasks that could be shared
          const sharableTasks = updatedTasks.filter((t) => t.sharable);
          const sharedCount = sharableTasks.length;

          if (sharedCount > 0) {
            opportunities.push({
              type: "resource_share",
              description: `${sharedCount} tasks marked as sharable across modules`,
              savingsPotential: sharedCount * 2 * 450 * 8, // Estimate: 2 PD per task
              confidence: 70,
              actions: [
                "Review sharable tasks for consolidation",
                "Coordinate with multiple module teams",
                "Validate configuration compatibility",
              ],
              taskIds: sharableTasks.map((t) => t.id),
            });
          }

          // Opportunity 2: Offshore candidates
          const offshoreCandidates = updatedTasks.filter(
            (t) => t.riskLevel === "low" && t.category === "functional"
          );

          if (offshoreCandidates.length > 3) {
            const totalEffort = offshoreCandidates.reduce(
              (sum, t) => sum + t.baseEffort * (t.delta / 100),
              0
            );
            const savings = totalEffort * 8 * (450 - 180); // MY vs VN rate diff

            opportunities.push({
              type: "offshore_candidate",
              description: `${offshoreCandidates.length} low-risk tasks suitable for offshore (ABVN)`,
              savingsPotential: savings,
              confidence: 65,
              actions: [
                "Review tasks for offshore eligibility",
                "Set up remote collaboration tools",
                "Plan knowledge transfer sessions",
              ],
              taskIds: offshoreCandidates.map((t) => t.id),
            });
          }

          // Step 5: Create optimization result
          const totalCost = updatedResources.reduce((sum, r) => sum + r.cost, 0);
          const avgUtilization =
            updatedResources.length > 0
              ? updatedResources.reduce((sum, r) => sum + r.utilization, 0) /
                updatedResources.length
              : 0;

          const result: OptimizationResult = {
            scenario: "optimized",
            totalCost,
            margin: 0.25, // 25% margin (hardcoded for MVP)
            resources: updatedResources,
            utilization: avgUtilization,
            bottlenecks: get().getBottlenecks(),
            opportunities,
            confidence: 75,
            timestamp: Date.now(),
          };

          const duration = performance.now() - startTime;
          console.log(`[ResourcePlanning] Optimization complete in ${duration.toFixed(1)}ms`);

          set({
            optimizationResult: result,
            resources: updatedResources,
            tasks: updatedTasks,
            isOptimizing: false,
          });
        } catch (error) {
          console.error("[ResourcePlanning] Optimization failed:", error);
          set({ isOptimizing: false });
        }
      },

      reset: () => {
        set({
          selectedModules: [],
          tasks: [],
          resources: [],
          optimizationResult: null,
          isOptimizing: false,
        });
      },
    }),
    {
      name: "resource-planning-storage",
      version: 1,
    }
  )
);

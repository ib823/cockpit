// MIGRATED: 2025-11-17 to match modal-design-showcase exactly
/**
 * PhaseDeletionImpactModal - Impact analysis for phase deletion
 *
 * Matches the showcase pattern from modal-design-showcase/page.tsx (lines 534-552)
 * Shows comprehensive impact analysis before phase deletion with:
 * - All tasks that will be deleted
 * - Resource allocations across all tasks
 * - Dependencies that will be broken
 * - Budget impact
 *
 * NO icons, clean design, severity dots (critical=red, high=orange, medium=yellow)
 */

"use client";

import { useMemo } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { GanttPhase, Resource, GanttHoliday } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";

interface PhaseDeletionImpactModalProps {
  phase: GanttPhase;
  allPhases: GanttPhase[];
  allResources: Resource[];
  onConfirm: () => void;
  onCancel: () => void;
  holidays: GanttHoliday[];
}

interface ImpactCategory {
  category: string;
  severity: "critical" | "high" | "medium";
  items: string[];
}

function ImpactAnalysisDisplay({ impacts }: { impacts: ImpactCategory[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {impacts.map((impact) => (
        <div key={impact.category}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                impact.severity === "critical" ? "#FF3B30" :
                  impact.severity === "high" ? "#FF9500" :
                    "#FFD60A",
            }} />
            <h4 style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1D1D1F",
              margin: 0,
            }}>
              {impact.category}
            </h4>
          </div>
          <ul style={{
            margin: 0,
            padding: "0 0 0 24px",
            fontSize: "14px",
            color: "#6B7280",
            lineHeight: 1.7,
          }}>
            {impact.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PhaseDeletionImpactModal({
  phase,
  allPhases,
  allResources,
  onConfirm,
  onCancel,
  holidays,
}: PhaseDeletionImpactModalProps) {
  // Calculate comprehensive impact analysis
  const impacts = useMemo(() => {
    const impactCategories: ImpactCategory[] = [];
    const tasks = phase.tasks || [];

    // 1. Tasks Deletion Impact
    if (tasks.length > 0) {
      const taskItems: string[] = [
        `${tasks.length} task${tasks.length !== 1 ? "s" : ""} will be permanently deleted`,
        "This action cannot be undone",
      ];

      // List task names (limit to first 5)
      tasks.slice(0, 5).forEach((task) => {
        taskItems.push(`"${task.name}"`);
      });

      if (tasks.length > 5) {
        taskItems.push(`And ${tasks.length - 5} more task${tasks.length - 5 !== 1 ? "s" : ""}...`);
      }

      impactCategories.push({
        category: "Tasks",
        severity: "critical",
        items: taskItems,
      });
    }

    // 2. Resource Allocations Impact
    const allResourceAssignments = tasks.flatMap((task) => {
      return (task.resourceAssignments || []).map((assignment) => {
        const resource = allResources.find((r) => r.id === assignment.resourceId);
        return {
          resource,
          assignment,
          task,
        };
      });
    });

    const totalResourceCost = allResourceAssignments.reduce((sum, { resource, assignment, task }) => {
      if (!resource) return sum;
      const workingDays = calculateWorkingDaysInclusive(
        new Date(task.startDate),
        new Date(task.endDate),
        holidays
      );
      const hoursPerDay = 8;
      const totalHours = workingDays * hoursPerDay * (assignment.allocationPercentage / 100);
      const cost = totalHours * resource.chargeRatePerHour;
      return sum + cost;
    }, 0);

    const totalHours = allResourceAssignments.reduce((sum, { resource, assignment, task }) => {
      if (!resource) return sum;
      const workingDays = calculateWorkingDaysInclusive(
        new Date(task.startDate),
        new Date(task.endDate),
        holidays
      );
      const hoursPerDay = 8;
      const totalHours = workingDays * hoursPerDay * (assignment.allocationPercentage / 100);
      return sum + totalHours;
    }, 0);

    const uniqueResourceIds = new Set(allResourceAssignments.map(({ assignment }) => assignment.resourceId));
    const uniqueResources = Array.from(uniqueResourceIds)
      .map((id) => allResources.find((r) => r.id === id))
      .filter(Boolean);

    if (uniqueResources.length > 0) {
      const resourceItems: string[] = [
        `${uniqueResources.length} team member${uniqueResources.length > 1 ? "s" : ""} currently allocated (${totalHours.toFixed(0)} hours total)`,
        `$${totalResourceCost.toFixed(2)} in committed costs will be lost`,
      ];

      // List top 3 resources
      uniqueResources.slice(0, 3).forEach((resource) => {
        if (!resource) return;
        const resourceAssignments = allResourceAssignments.filter(
          ({ assignment }) => assignment.resourceId === resource.id
        );
        const resourceHours = resourceAssignments.reduce((sum, { assignment, task }) => {
          const workingDays = calculateWorkingDaysInclusive(
            new Date(task.startDate),
            new Date(task.endDate),
            holidays
          );
          return sum + (workingDays * 8 * (assignment.allocationPercentage / 100));
        }, 0);

        resourceItems.push(
          `${resource.name} (${resource.designation}) - ${resourceAssignments.length} assignment${resourceAssignments.length > 1 ? "s" : ""}, ${resourceHours.toFixed(0)} hours`
        );
      });

      if (uniqueResources.length > 3) {
        resourceItems.push(`And ${uniqueResources.length - 3} more resource${uniqueResources.length - 3 !== 1 ? "s" : ""}...`);
      }

      impactCategories.push({
        category: "Resource Allocations",
        severity: "high",
        items: resourceItems,
      });
    }

    // 3. Dependencies Impact
    const dependentPhases = allPhases.filter((p) => p.dependencies.includes(phase.id));
    const taskIds = new Set(tasks.map((t) => t.id));
    const allTasksInOtherPhases = allPhases
      .filter((p) => p.id !== phase.id)
      .flatMap((p) => p.tasks || []);
    const tasksWithDependenciesToThisPhase = allTasksInOtherPhases.filter((task) =>
      task.dependencies.some((depId) => taskIds.has(depId))
    );

    if (dependentPhases.length > 0 || tasksWithDependenciesToThisPhase.length > 0) {
      const dependencyItems: string[] = [];

      if (dependentPhases.length > 0) {
        dependencyItems.push(`${dependentPhases.length} downstream phase${dependentPhases.length > 1 ? "s depend" : " depends"} on this phase`);
        dependentPhases.slice(0, 2).forEach((p) => {
          dependencyItems.push(`"${p.name}" will lose its prerequisite`);
        });
        if (dependentPhases.length > 2) {
          dependencyItems.push(`And ${dependentPhases.length - 2} more phase${dependentPhases.length - 2 !== 1 ? "s" : ""}...`);
        }
      }

      if (tasksWithDependenciesToThisPhase.length > 0) {
        dependencyItems.push(`${tasksWithDependenciesToThisPhase.length} task${tasksWithDependenciesToThisPhase.length > 1 ? "s" : ""} in other phases will lose dependencies`);
      }

      const workingDays = calculateWorkingDaysInclusive(
        new Date(phase.startDate),
        new Date(phase.endDate),
        holidays
      );
      dependencyItems.push(`Timeline impact: ${workingDays} working day${workingDays !== 1 ? "s" : ""} at risk`);

      impactCategories.push({
        category: "Dependencies",
        severity: "critical",
        items: dependencyItems,
      });
    }

    // 4. Budget Impact
    if (totalResourceCost > 0) {
      const allPhasesBudget = allPhases.reduce((sum, p) => {
        const phaseTasks = p.tasks || [];
        const phaseCost = phaseTasks.reduce((pSum, t) => {
          const taskCost = (t.resourceAssignments || []).reduce((tSum, assignment) => {
            const resource = allResources.find((r) => r.id === assignment.resourceId);
            if (!resource) return tSum;
            const workingDays = calculateWorkingDaysInclusive(
              new Date(t.startDate),
              new Date(t.endDate),
              holidays
            );
            const hours = workingDays * 8 * (assignment.allocationPercentage / 100);
            return tSum + (hours * resource.chargeRatePerHour);
          }, 0);
          return pSum + taskCost;
        }, 0);
        return sum + phaseCost;
      }, 0);

      const percentage = allPhasesBudget > 0 ? (totalResourceCost / allPhasesBudget * 100) : 0;

      impactCategories.push({
        category: "Budget Impact",
        severity: "medium",
        items: [
          `Total budget allocated: $${totalResourceCost.toFixed(2)}`,
          `This represents ${percentage.toFixed(1)}% of project budget`,
          percentage > 15 ? "Significant budget impact - executive approval recommended" : "Project contingency will absorb costs",
        ],
      });
    }

    return impactCategories;
  }, [phase, allPhases, allResources, holidays]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Delete Phase Impact Analysis"
      subtitle="Review the consequences before proceeding"
      size="large"
      footer={
        <>
          <ModalButton onClick={onCancel} variant="secondary">
            Go Back
          </ModalButton>
          <ModalButton onClick={onConfirm} variant="destructive">
            Delete Anyway
          </ModalButton>
        </>
      }
    >
      <ImpactAnalysisDisplay impacts={impacts} />
    </BaseModal>
  );
}

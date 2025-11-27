// MIGRATED: 2025-11-17 to match modal-design-showcase exactly
/**
 * TaskDeletionImpactModal - Impact analysis for task deletion
 *
 * Matches the showcase pattern from modal-design-showcase/page.tsx (lines 534-552)
 * Shows comprehensive impact analysis before task deletion with:
 * - Resource allocations that will be lost
 * - Dependencies that will be broken
 * - Budget impact
 *
 * NO icons, clean design, severity dots (critical=red, high=orange, medium=yellow)
 */

"use client";

import { useMemo } from "react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { GanttTask, GanttPhase, Resource, GanttHoliday } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";

interface TaskDeletionImpactModalProps {
  task: GanttTask;
  phase: GanttPhase;
  allTasks: GanttTask[];
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

export function TaskDeletionImpactModal({
  task,
  phase,
  allTasks,
  allResources,
  onConfirm,
  onCancel,
  holidays,
}: TaskDeletionImpactModalProps) {
  // Calculate comprehensive impact analysis
  const impacts = useMemo(() => {
    const impactCategories: ImpactCategory[] = [];

    // 1. Resource Allocations Impact
    const assignedResources = (task.resourceAssignments || []).map((assignment) => {
      const resource = allResources.find((r) => r.id === assignment.resourceId);
      return {
        resource,
        assignment,
      };
    });

    const totalResourceCost = assignedResources.reduce((sum, { resource, assignment }) => {
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

    const totalHours = assignedResources.reduce((sum, { resource, assignment }) => {
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

    if (assignedResources.length > 0) {
      const resourceItems: string[] = [
        `${assignedResources.length} team member${assignedResources.length > 1 ? "s" : ""} currently allocated (${totalHours.toFixed(0)} hours total)`,
        `$${totalResourceCost.toFixed(2)} in committed costs will be lost`,
      ];

      assignedResources.forEach(({ resource, assignment }) => {
        if (!resource) return;
        const workingDays = calculateWorkingDaysInclusive(
          new Date(task.startDate),
          new Date(task.endDate),
          holidays
        );
        const hours = workingDays * 8 * (assignment.allocationPercentage / 100);
        resourceItems.push(
          `${resource.name} (${resource.designation}) - ${assignment.allocationPercentage}% allocation, ${hours.toFixed(0)} hours`
        );
      });

      impactCategories.push({
        category: "Resource Allocations",
        severity: "high",
        items: resourceItems,
      });
    }

    // 2. Dependencies Impact
    const dependentTasks = allTasks.filter((t) => t.dependencies.includes(task.id));
    const childTasks = allTasks.filter((t) => t.parentTaskId === task.id);

    if (dependentTasks.length > 0 || childTasks.length > 0) {
      const dependencyItems: string[] = [];

      if (dependentTasks.length > 0) {
        dependencyItems.push(`${dependentTasks.length} downstream task${dependentTasks.length > 1 ? "s depend" : " depends"} on this task`);
        dependentTasks.slice(0, 2).forEach((t) => {
          dependencyItems.push(`"${t.name}" will lose its prerequisite`);
        });
        if (dependentTasks.length > 2) {
          dependencyItems.push(`And ${dependentTasks.length - 2} more task${dependentTasks.length - 2 > 1 ? "s" : ""}...`);
        }
      }

      if (childTasks.length > 0) {
        dependencyItems.push(`${childTasks.length} child task${childTasks.length > 1 ? "s" : ""} will become orphaned`);
      }

      const workingDays = calculateWorkingDaysInclusive(
        new Date(task.startDate),
        new Date(task.endDate),
        holidays
      );
      dependencyItems.push(`Timeline impact: ${workingDays} working day${workingDays !== 1 ? "s" : ""} at risk`);

      impactCategories.push({
        category: "Dependencies",
        severity: "critical",
        items: dependencyItems,
      });
    }

    // 3. Budget Impact
    if (totalResourceCost > 0) {
      const phaseBudget = phase.tasks?.reduce((sum, t) => {
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
        return sum + taskCost;
      }, 0) || 0;

      const percentage = phaseBudget > 0 ? (totalResourceCost / phaseBudget * 100) : 0;

      impactCategories.push({
        category: "Budget Impact",
        severity: "medium",
        items: [
          `Total budget allocated: $${totalResourceCost.toFixed(2)}`,
          `This represents ${percentage.toFixed(1)}% of phase budget`,
          percentage > 10 ? "Significant budget impact - approval recommended" : "Phase contingency will absorb costs",
        ],
      });
    }

    return impactCategories;
  }, [task, allTasks, allResources, holidays, phase]);

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Delete Task Impact Analysis"
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

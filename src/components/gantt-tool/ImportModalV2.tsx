/**
 * Import Modal V2 - Two-Stage Import with Mobile-Responsive Design
 *
 * Stage 1: Schedule Data (Phase | Task | Start Date | End Date)
 * Stage 2: Resource Data (Role | Designation | W1 | W2 | W3 | ...) - OPTIONAL
 *
 * Features:
 * - Mobile-responsive (320px to 4K)
 * - Real-time validation
 * - Error highlighting
 * - Touch-friendly
 * - Progress indicators
 *
 * Refactored to use BaseModal with Apple HIG standards
 */

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import {
  parseScheduleData,
  type ParsedSchedule,
  type ScheduleParseResult,
} from "@/lib/gantt-tool/schedule-parser";
import {
  parseResourceData,
  type ParsedResources,
  type ResourceParseResult,
  type ParsedResource,
} from "@/lib/gantt-tool/resource-parser";
import {
  generateScheduleTemplate,
  generateResourceTemplate,
} from "@/lib/gantt-tool/template-generator-v2";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { allocateResourcesToTasks } from "@/lib/gantt-tool/resource-allocator";
import type { ResourceDesignation, ResourceCategory } from "@/types/gantt-tool";
import {
  detectImportConflicts,
  generatePhaseSuggestions,
  generateResourceSuggestions,
  type ConflictDetectionResult,
} from "@/lib/gantt-tool/conflict-detector";
import {
  ConflictResolutionModal,
  type ConflictResolution,
} from "@/components/gantt-tool/ConflictResolutionModal";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

// Helper to ensure date is in YYYY-MM-DD format
function formatDateField(date: string | Date): string {
  if (typeof date === "string") {
    return date.includes("T") ? date.split("T")[0] : date;
  }
  // It's a Date object, format it
  return new Date(date).toISOString().split("T")[0];
}

interface ImportModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

type Stage = "schedule" | "resources" | "mapping" | "review";

export function ImportModalV2({ isOpen, onClose }: ImportModalV2Props) {
  const { currentProject, projects } = useGanttToolStoreV2();

  // Stage management
  const [currentStage, setCurrentStage] = useState<Stage>("schedule");

  // Stage 1: Schedule
  const [scheduleData, setScheduleData] = useState("");
  const [scheduleResult, setScheduleResult] = useState<ScheduleParseResult | null>(null);
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);

  // Stage 2: Resources (optional)
  const [resourceData, setResourceData] = useState("");
  const [resourceResult, setResourceResult] = useState<ResourceParseResult | null>(null);
  const [parsedResources, setParsedResources] = useState<ParsedResources | null>(null);
  const [skipResources, setSkipResources] = useState(false);

  // Stage 3: Resource Mapping (if needed)
  const [resourceMappings, setResourceMappings] = useState<
    Map<number, { designation: string; category: string }>
  >(new Map());

  // Review stage
  const [isImporting, setIsImporting] = useState(false);

  // Project creation options
  const [importMode, setImportMode] = useState<"new" | "append">("new");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Conflict detection
  const [conflictResult, setConflictResult] = useState<ConflictDetectionResult | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [preparedProjectData, setPreparedProjectData] = useState<any>(null);

  // PERMANENT FIX: Prevent body scroll when modal is open and cleanup on unmount
  useEffect(() => {
    // Prevent body scroll while modal is open
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.pointerEvents = "";
    };
  }, []);

  // Handle schedule parse
  const handleParseSchedule = () => {
    const result = parseScheduleData(scheduleData);
    setScheduleResult(result);

    if (result.success && result.data) {
      setParsedSchedule(result.data);
    }
  };

  // Handle resource parse
  const handleParseResources = () => {
    if (!parsedSchedule) return;

    const result = parseResourceData(resourceData, parsedSchedule);
    setResourceResult(result);

    if (result.success && result.data) {
      setParsedResources(result.data);

      // If there are unmapped resources, we'll need to go to mapping stage
      if (result.requiresMapping && result.data.unmappedResources.length > 0) {
        // Initialize mappings with empty values
        const initialMappings = new Map<number, { designation: string; category: string }>();
        result.data.unmappedResources.forEach((unmapped) => {
          initialMappings.set(unmapped.rowNumber, {
            designation: "",
            category: unmapped.suggestedCategory || "other",
          });
        });
        setResourceMappings(initialMappings);
      }
    }
  };

  // Handle conflict resolution
  const handleConflictResolution = async (resolution: ConflictResolution) => {
    setShowConflictModal(false);

    if (!preparedProjectData) {
      alert("No prepared data found. Please try again.");
      return;
    }

    setIsImporting(true);
    try {
      await performImportWithResolution(preparedProjectData, resolution);
    } catch (err) {
      console.error("[ImportModalV2] Import failed after conflict resolution:", err);
      alert(err instanceof Error ? err.message : "Failed to import project");
    } finally {
      setIsImporting(false);
    }
  };

  // Handle conflict cancellation
  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflictResult(null);
    setPreparedProjectData(null);
    setIsImporting(false);
  };

  // Handle final import - Create new project or add to existing
  const handleImport = async () => {
    if (!parsedSchedule) return;

    // Validate import mode
    if (importMode === "new") {
      if (!newProjectName.trim()) {
        alert("Please enter a project name.");
        return;
      }
      // Check for duplicate names
      const isDuplicate = projects.some(
        (p) => p.name.toLowerCase() === newProjectName.trim().toLowerCase()
      );
      if (isDuplicate) {
        alert(
          `A project named "${newProjectName}" already exists. Please choose a different name.`
        );
        return;
      }
    } else {
      // Append mode
      if (!selectedProjectId) {
        alert("Please select a project to append data to.");
        return;
      }
    }

    const currentState = useGanttToolStoreV2.getState();

    setIsImporting(true);
    try {
      // Determine target project
      let targetProject;
      let isNewProject = false;

      if (importMode === "new") {
        // Create new project structure
        const projectStartDate =
          parsedSchedule.phases.length > 0
            ? parsedSchedule.phases[0].startDate
            : new Date().toISOString().split("T")[0];

        targetProject = {
          id: `temp-${Date.now()}`, // Will be replaced by server
          name: newProjectName.trim(),
          description: `Imported from Excel on ${new Date().toLocaleDateString()}`,
          startDate: projectStartDate,
          phases: [],
          milestones: [],
          holidays: [],
          resources: [],
          viewSettings: {
            zoomLevel: "week" as const,
            showWeekends: true,
            showHolidays: true,
            showMilestones: true,
            showTaskDependencies: false,
            showCriticalPath: false,
            showTitles: true,
            barDurationDisplay: "all" as const,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        isNewProject = true;
      } else {
        // Append to existing project
        const existingProject = projects.find((p) => p.id === selectedProjectId);
        if (!existingProject) {
          throw new Error("Selected project not found");
        }
        targetProject = { ...existingProject };
      }

      // Step 1: Apply mappings to unmapped resources and combine all resources
      const allParsedResources: ParsedResource[] = [];

      if (parsedResources && !skipResources) {
        console.warn(" Collecting resources...");
        console.warn("  - Mapped resources:", parsedResources.resources.length);
        console.warn("  - Unmapped resources:", parsedResources.unmappedResources?.length || 0);

        // Add already-mapped resources
        allParsedResources.push(...parsedResources.resources);

        // Add mapped unmapped resources
        if (parsedResources.unmappedResources && parsedResources.unmappedResources.length > 0) {
          for (const unmapped of parsedResources.unmappedResources) {
            const mapping = resourceMappings.get(unmapped.rowNumber);
            if (!mapping || !mapping.designation || !mapping.category) {
              throw new Error(
                `Resource at row ${unmapped.rowNumber} ("${unmapped.name}") is not properly mapped`
              );
            }

            console.warn(
              `   Applying mapping for row ${unmapped.rowNumber}: ${unmapped.originalDesignation} → ${mapping.designation}, ${mapping.category}`
            );

            allParsedResources.push({
              name: unmapped.name,
              designation: mapping.designation as ResourceDesignation,
              category: mapping.category as ResourceCategory,
              weeklyEffort: unmapped.weeklyEffort,
              totalDays: unmapped.totalDays,
              originalDesignation: unmapped.originalDesignation,
              rowNumber: unmapped.rowNumber,
            });
          }
        }

        console.warn(` Total resources to process: ${allParsedResources.length}`);
      } else {
        console.warn(
          "⏭️ Skipping resources (skipResources:",
          skipResources,
          ", parsedResources:",
          !!parsedResources,
          ")"
        );
      }

      // Step 2: Create resource entities and build ID map
      const resourceIdMap = new Map<string, string>();
      const newResources = allParsedResources.map((resource, idx) => {
        const resourceId = `resource-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
        resourceIdMap.set(resource.name, resourceId);

        return {
          id: resourceId,
          name: resource.name,
          category: resource.category,
          designation: resource.designation,
          description: `Imported resource with ${resource.totalDays} total mandays`,
          createdAt: new Date().toISOString(),
          managerResourceId: null,
          email: null, // FIX: Use null instead of undefined for consistency
          department: null, // FIX: Use null instead of undefined for consistency
          location: null, // FIX: Use null instead of undefined for consistency
          projectRole: null, // FIX: Use null instead of undefined for consistency
        };
      });

      targetProject.resources = [...(targetProject.resources || []), ...newResources] as any;

      // Step 3: Allocate resources to tasks based on weekly effort
      console.warn(" Starting resource allocation...");
      console.warn("Parsed resources:", allParsedResources);
      console.warn("Resource ID map:", Array.from(resourceIdMap.entries()));

      const allocationResult = allocateResourcesToTasks(
        allParsedResources,
        parsedSchedule,
        resourceIdMap
      );

      console.warn(" Allocation result:", allocationResult);

      if (!allocationResult.success) {
        console.error("Resource allocation errors:", allocationResult.errors);
        alert(`Resource allocation failed:\n${allocationResult.errors.join("\n")}`);
        return;
      }

      // Show allocation warnings if any
      if (allocationResult.warnings.length > 0) {
        console.warn("Resource allocation warnings:", allocationResult.warnings);
      }

      console.warn(" Resource allocations created:", allocationResult.allocations.length);

      // Step 4: Create phases with tasks that have resource assignments
      const newPhases = parsedSchedule.phases.map((phase, phaseIndex) => {
        const phaseId = `phase-${Date.now()}-${phaseIndex}-${Math.random().toString(36).substr(2, 9)}`;

        const tasks = phase.tasks.map((task, taskIndex) => {
          const taskId = `task-${Date.now()}-${phaseIndex}-${taskIndex}-${Math.random().toString(36).substr(2, 9)}`;

          // Find resource allocations for this task
          const taskResourceAssignments: any[] = [];

          for (const allocatedResource of allocationResult.allocations) {
            const taskAlloc = allocatedResource.taskAllocations.find(
              (a) => a.taskName === task.name && a.phaseName === phase.name
            );

            if (taskAlloc) {
              const assignmentId = `assignment-${Date.now()}-${phaseIndex}-${taskIndex}-${allocatedResource.resourceId.slice(-6)}-${Math.random().toString(36).substr(2, 6)}`;
              taskResourceAssignments.push({
                id: assignmentId,
                resourceId: allocatedResource.resourceId,
                assignmentNotes: `Auto-allocated: ${Math.round(taskAlloc.allocation)}% based on weekly effort`,
                allocationPercentage: Math.round(taskAlloc.allocation), // Round to integer percentage
                assignedAt: taskAlloc.assignedAt,
              });
            }
          }

          console.warn(
            ` Task "${task.name}" in phase "${phase.name}": ${taskResourceAssignments.length} resource assignments`,
            taskResourceAssignments
          );

          return {
            id: taskId,
            phaseId: phaseId,
            name: task.name,
            description: "",
            startDate: task.startDate,
            endDate: task.endDate,
            dependencies: [],
            assignee: "",
            progress: 0,
            resourceAssignments: taskResourceAssignments,
            order: taskIndex,
            level: 0,
            collapsed: false,
            isParent: false,
          };
        });

        return {
          id: phaseId,
          name: phase.name,
          description: "",
          color: "#3B82F6",
          startDate: phase.startDate,
          endDate: phase.endDate,
          tasks,
          collapsed: false,
          dependencies: [],
          phaseResourceAssignments: [],
          order: phaseIndex,
        };
      });

      // Check for conflicts if appending to existing project
      if (!isNewProject && targetProject.phases.length > 0) {
        const conflicts = detectImportConflicts(targetProject, newPhases, newResources as any);

        if (conflicts.hasConflicts) {
          console.warn("[ImportModalV2] Conflicts detected:", conflicts.summary);

          // Store prepared data for later use after conflict resolution
          setPreparedProjectData({
            targetProject,
            newPhases,
            newResources,
            isNewProject,
          });

          setConflictResult(conflicts);
          setShowConflictModal(true);
          setIsImporting(false);
          return; // Block import until user resolves
        }
      }

      // No conflicts or new project - proceed with import
      // Append new phases to existing ones
      targetProject.phases = [...targetProject.phases, ...newPhases];
      targetProject.updatedAt = new Date().toISOString();

      // Log what we're about to save
      console.warn("\n About to save to database...");
      console.warn("Total phases:", targetProject.phases.length);
      const totalTasksWithResources = targetProject.phases.reduce(
        (sum, phase) =>
          sum +
          phase.tasks.filter((t) => t.resourceAssignments && t.resourceAssignments.length > 0)
            .length,
        0
      );
      console.warn("Tasks with resource assignments:", totalTasksWithResources);
      console.warn(
        "Sample task with resources:",
        targetProject.phases
          .flatMap((p) => p.tasks)
          .find((t) => t.resourceAssignments && t.resourceAssignments.length > 0)
      );

      // Prepare payload for API call
      // Only send the fields that the API expects, clean up database-only fields
      const projectPayload = {
        name: targetProject.name,
        description: targetProject.description ?? "", // FIX: Convert null/undefined to empty string
        startDate: targetProject.startDate,
        viewSettings: targetProject.viewSettings,
        budget: targetProject.budget,
        phases: targetProject.phases.map((phase: any) => ({
          id: phase.id,
          name: phase.name,
          description: phase.description ?? "", // FIX: Use nullish coalescing
          color: phase.color,
          startDate: formatDateField(phase.startDate),
          endDate: formatDateField(phase.endDate),
          collapsed: phase.collapsed,
          order: phase.order || 0,
          dependencies: phase.dependencies || [],
          tasks: (phase.tasks || []).map((task: any) => ({
            id: task.id,
            name: task.name,
            description: task.description ?? "", // FIX: Use nullish coalescing
            startDate: formatDateField(task.startDate),
            endDate: formatDateField(task.endDate),
            progress: task.progress ?? 0, // FIX: Use nullish coalescing
            assignee: task.assignee ?? "", // FIX: Use nullish coalescing
            order: task.order || 0,
            dependencies: task.dependencies || [],
            resourceAssignments: (task.resourceAssignments || []).map((ra: any) => ({
              id: ra.id,
              resourceId: ra.resourceId,
              assignmentNotes: ra.assignmentNotes ?? "", // FIX: Use nullish coalescing
              allocationPercentage: ra.allocationPercentage ?? 0, // FIX: Use nullish coalescing
              assignedAt: ra.assignedAt ?? new Date().toISOString(),
            })),
          })),
          phaseResourceAssignments: (phase.phaseResourceAssignments || []).map((pra: any) => ({
            id: pra.id,
            resourceId: pra.resourceId,
            assignmentNotes: pra.assignmentNotes ?? "", // FIX: Use nullish coalescing
            allocationPercentage: pra.allocationPercentage ?? 0, // FIX: Use nullish coalescing
            assignedAt: pra.assignedAt ?? new Date().toISOString(),
          })),
        })),
        resources: targetProject.resources.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          description: r.description ?? "", // FIX: Use nullish coalescing
          designation: r.designation,
          managerResourceId: r.managerResourceId ?? null, // FIX: Explicit null is OK here
          email: r.email ?? null, // FIX: Explicit null is OK here
          department: r.department ?? null, // FIX: Explicit null is OK here
          location: r.location ?? null, // FIX: Explicit null is OK here
          projectRole: r.projectRole ?? null, // FIX: Explicit null is OK here
          createdAt: r.createdAt ?? new Date().toISOString(),
        })),
        milestones: targetProject.milestones || [],
        holidays: targetProject.holidays || [],
      };

      console.warn(" Sending project payload with", {
        mode: importMode,
        phases: projectPayload.phases.length,
        resources: projectPayload.resources.length,
        totalTasks: projectPayload.phases.reduce((sum: number, p: any) => sum + p.tasks.length, 0),
        tasksWithResources: projectPayload.phases.reduce(
          (sum: number, p: any) =>
            sum +
            p.tasks.filter((t: any) => t.resourceAssignments && t.resourceAssignments.length > 0)
              .length,
          0
        ),
      });

      let response;
      try {
        if (isNewProject) {
          // Create new project via importProject
          console.warn(" Fetching: POST /api/gantt-tool/projects");
          response = await fetch("/api/gantt-tool/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectPayload),
          });
        } else {
          // Update existing project
          console.warn(` Fetching: PATCH /api/gantt-tool/projects/${selectedProjectId}`);
          response = await fetch(`/api/gantt-tool/projects/${selectedProjectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectPayload),
          });
        }
      } catch (fetchError) {
        console.error(" Network error during fetch:", fetchError);
        throw new Error(
          "Network error: Cannot connect to the server. Make sure the development server is running."
        );
      }

      console.warn("API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText || "Unknown Error"}`,
        }));
        console.error(" API Error Response:", errorData);

        // Log the payload that caused the error for debugging
        if (errorData.error?.includes("Validation failed")) {
          console.error(
            " Payload that failed validation:",
            JSON.stringify(projectPayload, null, 2)
          );
        }

        // Show detailed validation errors if available
        if (errorData.details) {
          console.error("Validation errors:", errorData.details);
          const validationErrors = errorData.details
            .map((d: any) => `${d.path.join(".")}: ${d.message}`)
            .join("\n");
          throw new Error(`Validation failed:\n${validationErrors}`);
        }

        const errorMessage = errorData.error || `Failed to import data (${response.status})`;
        throw new Error(errorMessage);
      }

      // Get the project ID from response
      const data = await response.json();
      const projectId = data.project?.id || (isNewProject ? data.project?.id : selectedProjectId);

      if (!projectId) {
        throw new Error("Failed to get project ID from response");
      }

      // Update local state - fetch all projects and load the created/updated one
      const store = useGanttToolStoreV2.getState();
      await store.fetchProjects(); // Refresh project list
      await store.loadProject(projectId); // Load the project (use loadProject instead of fetchProject)

      // Verify resources were persisted (only if resources were not skipped)
      if (!skipResources) {
        const updatedState = useGanttToolStoreV2.getState();
        const fetchedProject = updatedState.currentProject;
        if (fetchedProject) {
          console.warn("\n Verifying persisted data...");
          const tasksWithResources = fetchedProject.phases
            .flatMap((p) => p.tasks)
            .filter((t) => t.resourceAssignments && t.resourceAssignments.length > 0);
          console.warn("Tasks with resources after fetch:", tasksWithResources.length);
          if (tasksWithResources.length > 0) {
            console.warn(" Sample persisted task:", tasksWithResources[0]);
          } else {
            console.warn(
              " No resource assignments found after fetch (resources were imported but not assigned)"
            );
          }
        }
      } else {
        console.warn("⏭️ Resources were skipped - no resource verification needed");
      }

      alert(
        isNewProject
          ? `Project "${newProjectName}" created successfully!`
          : "Project updated successfully!"
      );

      // Close modal
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      const errorMessage = (error as Error).message || "Import failed. Please try again.";
      alert(`Import failed: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Perform import with conflict resolution
  const performImportWithResolution = async (preparedData: any, resolution: ConflictResolution) => {
    const { targetProject, newPhases, newResources, isNewProject } = preparedData;

    // Apply resolution strategy
    let finalPhases = newPhases;
    let finalResources = newResources;

    if (resolution.strategy === "refresh") {
      // Total Refresh: Replace all existing data
      console.warn("[ImportModalV2] Applying Total Refresh strategy");
      targetProject.phases = newPhases;
      targetProject.resources = newResources;
    } else if (resolution.strategy === "merge") {
      // Smart Merge: Apply suggested renames
      console.warn("[ImportModalV2] Applying Smart Merge strategy");

      // Generate suggested names for conflicts
      const phaseSuggestions = generatePhaseSuggestions(newPhases, targetProject.phases);
      const resourceSuggestions = generateResourceSuggestions(
        newResources,
        targetProject.resources
      );

      // Apply custom names from user input or use suggestions
      finalPhases = newPhases.map((phase: any) => {
        const conflictId = conflictResult?.conflicts.find(
          (c) => c.type === "phase" && (c.detail as any).phaseName === phase.name
        )?.id;

        if (conflictId && resolution.customNames?.has(conflictId)) {
          return { ...phase, name: resolution.customNames.get(conflictId)! };
        } else if (phaseSuggestions.has(phase.id)) {
          return { ...phase, name: phaseSuggestions.get(phase.id)! };
        }
        return phase;
      });

      finalResources = newResources.map((resource: any) => {
        const conflictId = conflictResult?.conflicts.find(
          (c) => c.type === "resource" && (c.detail as any).resourceName === resource.name
        )?.id;

        if (conflictId && resolution.customNames?.has(conflictId)) {
          return { ...resource, name: resolution.customNames.get(conflictId)! };
        } else if (resourceSuggestions.has(resource.id)) {
          return { ...resource, name: resourceSuggestions.get(resource.id)! };
        }
        return resource;
      });

      // Merge with existing
      targetProject.phases = [...targetProject.phases, ...finalPhases];
      targetProject.resources = [...targetProject.resources, ...finalResources];
    }

    targetProject.updatedAt = new Date().toISOString();

    // Prepare payload for API call
    const projectPayload = {
      name: targetProject.name,
      description: targetProject.description ?? "",
      startDate: targetProject.startDate,
      viewSettings: targetProject.viewSettings,
      budget: targetProject.budget,
      phases: targetProject.phases.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description ?? "",
        color: phase.color,
        startDate: formatDateField(phase.startDate),
        endDate: formatDateField(phase.endDate),
        collapsed: phase.collapsed,
        order: phase.order || 0,
        dependencies: phase.dependencies || [],
        tasks: (phase.tasks || []).map((task: any) => ({
          id: task.id,
          phaseId: task.phaseId,
          name: task.name,
          description: task.description ?? "",
          startDate: formatDateField(task.startDate),
          endDate: formatDateField(task.endDate),
          dependencies: task.dependencies || [],
          assignee: task.assignee || "",
          progress: task.progress || 0,
          resourceAssignments: task.resourceAssignments || [],
        })),
        phaseResourceAssignments: phase.phaseResourceAssignments || [],
      })),
      resources: targetProject.resources.map((resource: any) => ({
        id: resource.id,
        name: resource.name,
        category: resource.category,
        designation: resource.designation,
        description: resource.description ?? "",
        createdAt: resource.createdAt,
        managerResourceId: resource.managerResourceId,
        email: resource.email,
        department: resource.department,
        location: resource.location,
        projectRole: resource.projectRole,
      })),
      milestones: targetProject.milestones || [],
      holidays: targetProject.holidays || [],
    };

    // Make API call
    let response;
    try {
      if (isNewProject) {
        response = await fetch("/api/gantt-tool/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectPayload),
        });
      } else {
        response = await fetch(`/api/gantt-tool/projects/${selectedProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectPayload),
        });
      }
    } catch (fetchError) {
      throw new Error("Network error: Cannot connect to the server.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText || "Unknown Error"}`,
      }));
      const errorMessage = errorData.error || `Failed to import data (${response.status})`;
      throw new Error(errorMessage);
    }

    // Get the project ID from response
    const data = await response.json();
    const projectId = data.project?.id || (isNewProject ? data.project?.id : selectedProjectId);

    if (!projectId) {
      throw new Error("Failed to get project ID from response");
    }

    // Update local state
    const store = useGanttToolStoreV2.getState();
    await store.fetchProjects();
    await store.fetchProject(projectId);

    alert(
      isNewProject
        ? `Project "${newProjectName}" created successfully!`
        : "Project updated successfully with conflict resolution!"
    );

    // Close modal
    onClose();
  };

  // Navigation helpers
  const canProceedToResources = scheduleResult?.success && parsedSchedule;
  const needsMapping =
    resourceResult?.requiresMapping &&
    parsedResources?.unmappedResources &&
    parsedResources.unmappedResources.length > 0;
  const canProceedToMapping = resourceResult?.success && parsedResources && needsMapping;
  const canProceedToReview =
    canProceedToResources &&
    (skipResources ||
      (resourceResult?.success && parsedResources && !needsMapping) ||
      (needsMapping && allResourcesMapped()));

  // Check if all unmapped resources have been mapped
  function allResourcesMapped(): boolean {
    if (!parsedResources?.unmappedResources) return true;

    for (const unmapped of parsedResources.unmappedResources) {
      const mapping = resourceMappings.get(unmapped.rowNumber);
      if (!mapping || !mapping.designation || !mapping.category) {
        return false;
      }
    }
    return true;
  }

  // Get subtitle based on current stage
  const getSubtitle = () => {
    switch (currentStage) {
      case "schedule":
        return "Step 1: Import Schedule";
      case "resources":
        return "Step 2: Import Resources (Optional)";
      case "mapping":
        return "Step 3: Map Resource Designations";
      case "review":
        return "Step 4: Review & Import";
      default:
        return "";
    }
  };

  // Build footer based on current stage
  const renderFooter = () => {
    if (currentStage === "schedule") {
      return (
        <>
          <ModalButton onClick={onClose} variant="secondary">
            Cancel
          </ModalButton>
          {parsedSchedule && (
            <ModalButton
              onClick={() => setCurrentStage("resources")}
              variant="primary"
            >
              Next: Resources <ChevronRight className="w-4 h-4 ml-2 inline" />
            </ModalButton>
          )}
        </>
      );
    }

    if (currentStage === "resources") {
      return (
        <>
          <ModalButton
            onClick={() => setCurrentStage("schedule")}
            variant="secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-2 inline" /> Back
          </ModalButton>
          {skipResources && (
            <ModalButton
              onClick={() => setCurrentStage("review")}
              variant="primary"
            >
              Skip to Review <ChevronRight className="w-4 h-4 ml-2 inline" />
            </ModalButton>
          )}
          {parsedResources && (
            <ModalButton
              onClick={() => {
                if (resourceResult?.requiresMapping) {
                  setCurrentStage("mapping");
                } else {
                  setCurrentStage("review");
                }
              }}
              variant="primary"
            >
              {resourceResult?.requiresMapping ? "Next: Mapping" : "Next: Review"}{" "}
              <ChevronRight className="w-4 h-4 ml-2 inline" />
            </ModalButton>
          )}
        </>
      );
    }

    if (currentStage === "mapping") {
      return (
        <>
          <ModalButton
            onClick={() => setCurrentStage("resources")}
            variant="secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-2 inline" /> Back
          </ModalButton>
          {allResourcesMapped() && (
            <ModalButton
              onClick={() => setCurrentStage("review")}
              variant="primary"
            >
              Next: Review <ChevronRight className="w-4 h-4 ml-2 inline" />
            </ModalButton>
          )}
        </>
      );
    }

    if (currentStage === "review") {
      return (
        <>
          <ModalButton
            onClick={() => {
              if (resourceResult?.requiresMapping) {
                setCurrentStage("mapping");
              } else {
                setCurrentStage("resources");
              }
            }}
            variant="secondary"
          >
            <ChevronLeft className="w-4 h-4 mr-2 inline" /> Back
          </ModalButton>
          <ModalButton
            onClick={handleImport}
            disabled={isImporting}
            variant="primary"
          >
            {isImporting ? "Importing..." : "Import Project"}
          </ModalButton>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Import Project"
        subtitle={getSubtitle()}
        icon={<Upload className="w-5 h-5" />}
        size="fullscreen"
        footer={renderFooter()}
        preventClose={isImporting}
      >

        {/* Progress Indicator */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <StageIndicator
              icon={Calendar}
              label="Schedule"
              active={currentStage === "schedule"}
              completed={!!parsedSchedule}
            />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all duration-300 ${
                  parsedSchedule ? "bg-blue-600 w-full" : "bg-gray-300 w-0"
                }`}
              />
            </div>
            <StageIndicator
              icon={Users}
              label="Resources"
              active={currentStage === "resources"}
              completed={!!parsedResources || skipResources}
            />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all duration-300 ${
                  parsedResources || skipResources ? "bg-blue-600 w-full" : "bg-gray-300 w-0"
                }`}
              />
            </div>
            <StageIndicator
              icon={CheckCircle}
              label="Review"
              active={currentStage === "review"}
              completed={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {currentStage === "schedule" && (
            <ScheduleStage
              data={scheduleData}
              onDataChange={setScheduleData}
              result={scheduleResult}
              onParse={handleParseSchedule}
              onDownloadTemplate={generateScheduleTemplate}
            />
          )}

          {currentStage === "resources" && (
            <ResourceStage
              data={resourceData}
              onDataChange={setResourceData}
              result={resourceResult}
              onParse={handleParseResources}
              onDownloadTemplate={generateResourceTemplate}
              onSkip={() => setSkipResources(true)}
              skipped={skipResources}
            />
          )}

          {currentStage === "mapping" && parsedResources && (
            <ResourceMappingStage
              unmappedResources={parsedResources.unmappedResources}
              mappings={resourceMappings}
              onMappingsChange={setResourceMappings}
            />
          )}

          {currentStage === "review" && parsedSchedule && (
            <ReviewStage
              schedule={parsedSchedule}
              resources={parsedResources}
              skippedResources={skipResources}
              importMode={importMode}
              onImportModeChange={setImportMode}
              newProjectName={newProjectName}
              onNewProjectNameChange={setNewProjectName}
              selectedProjectId={selectedProjectId}
              onSelectedProjectIdChange={setSelectedProjectId}
              existingProjects={projects}
            />
          )}
        </div>
      </BaseModal>

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictResult && preparedProjectData && (
        <ConflictResolutionModal
          isOpen={showConflictModal}
          conflictResult={conflictResult}
          existingProject={preparedProjectData.targetProject}
          importedPhaseCount={preparedProjectData.newPhases.length}
          importedTaskCount={preparedProjectData.newPhases.reduce(
            (sum: number, p: any) => sum + p.tasks.length,
            0
          )}
          importedResourceCount={preparedProjectData.newResources.length}
          onResolve={handleConflictResolution}
          onCancel={handleConflictCancel}
        />
      )}
    </>
  );
}

// Stage Indicator Component
function StageIndicator({
  icon: Icon,
  label,
  active,
  completed,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
          completed
            ? "bg-green-100 text-green-600"
            : active
              ? "bg-blue-100 text-blue-600 ring-4 ring-blue-100"
              : "bg-gray-100 text-gray-400"
        }`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span
        className={`text-xs sm:text-sm font-medium ${
          active ? "text-blue-600" : completed ? "text-green-600" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Schedule Stage Component
function ScheduleStage({
  data,
  onDataChange,
  result,
  onParse,
  onDownloadTemplate,
}: {
  data: string;
  onDataChange: (data: string) => void;
  result: ScheduleParseResult | null;
  onParse: () => void;
  onDownloadTemplate: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">How to Import Schedule</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the Excel template</li>
              <li>Fill in your phases, tasks, and dates</li>
              <li>Select all cells (Ctrl+A) and copy (Ctrl+C)</li>
              <li>Paste below (Ctrl+V) and click "Parse Data"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Download Template Button */}
      <button
        onClick={onDownloadTemplate}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <Download className="w-5 h-5" />
        <span>Download Schedule Template</span>
      </button>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Schedule Data (TSV format)
        </label>
        <textarea
          value={data}
          onChange={(e) => onDataChange(e.target.value)}
          placeholder="Phase Name&#9;Task Name&#9;Start Date&#9;End Date&#10;Discovery&#9;Requirements Gathering&#9;2026-01-01&#9;2026-01-15"
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
        />
        <p className="mt-2 text-xs text-gray-500">
          {data.split("\n").filter((l) => l.trim()).length} lines
        </p>
      </div>

      {/* Parse Button */}
      <button
        onClick={onParse}
        disabled={!data.trim()}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Parse Schedule Data
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.success && result.data ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Successfully Parsed!</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <StatCard label="Phases" value={result.data.phases.length} />
                    <StatCard label="Tasks" value={result.data.totalTasks} />
                    <StatCard label="Start Date" value={result.data.projectStartDate} />
                    <StatCard label="Duration" value={`${result.data.durationDays} days`} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Parsing Errors</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-red-600">
                        ... and {result.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">Warnings</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Resource Stage Component (similar structure to ScheduleStage)
function ResourceStage({
  data,
  onDataChange,
  result,
  onParse,
  onDownloadTemplate,
  onSkip,
  skipped,
}: {
  data: string;
  onDataChange: (data: string) => void;
  result: ResourceParseResult | null;
  onParse: () => void;
  onDownloadTemplate: () => void;
  onSkip: () => void;
  skipped: boolean;
}) {
  if (skipped) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Resources Skipped</h3>
        <p className="text-gray-600 text-center mb-6">
          You can add resources later from the project view.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back to add resources
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">How to Import Resources (Optional)</h3>
            <p className="text-sm text-blue-800 mb-2">
              Resources are optional. Skip this step if you want to add them manually later.
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the Excel template</li>
              <li>Fill in roles, designations, and weekly effort</li>
              <li>Select all cells and copy</li>
              <li>Paste below and click "Parse Resources"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          <span>Download Resource Template</span>
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <span>Skip Resources</span>
        </button>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Resource Data (TSV format)
        </label>
        <textarea
          value={data}
          onChange={(e) => onDataChange(e.target.value)}
          placeholder="Role&#9;Designation&#9;W1&#9;W2&#9;W3&#10;Project Manager&#9;Manager&#9;5&#9;5&#9;5"
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
        />
      </div>

      {/* Parse Button */}
      <button
        onClick={onParse}
        disabled={!data.trim()}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Parse Resource Data
      </button>

      {/* Results (similar to schedule) */}
      {result && (
        <div className="space-y-4">
          {result.success && result.data ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Successfully Parsed!</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <StatCard label="Resources" value={result.data.resources.length} />
                    <StatCard label="Total Mandays" value={result.data.totalMandays} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Parsing Errors</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Resource Mapping Stage Component
function ResourceMappingStage({
  unmappedResources,
  mappings,
  onMappingsChange,
}: {
  unmappedResources: import("@/lib/gantt-tool/resource-parser").UnmappedResource[];
  mappings: Map<number, { designation: string; category: string }>;
  onMappingsChange: (mappings: Map<number, { designation: string; category: string }>) => void;
}) {
  const { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } = require("@/types/gantt-tool");

  const handleDesignationChange = (rowNumber: number, designation: string) => {
    const newMappings = new Map(mappings);
    const current = mappings.get(rowNumber) || { designation: "", category: "other" };
    newMappings.set(rowNumber, { ...current, designation });
    onMappingsChange(newMappings);
  };

  const handleCategoryChange = (rowNumber: number, category: string) => {
    const newMappings = new Map(mappings);
    const current = mappings.get(rowNumber) || { designation: "", category: "other" };
    newMappings.set(rowNumber, { ...current, category });
    onMappingsChange(newMappings);
  };

  const allMapped = unmappedResources.every((unmapped) => {
    const mapping = mappings.get(unmapped.rowNumber);
    return mapping && mapping.designation && mapping.category;
  });

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">Resource Mapping Required</h3>
            <p className="text-sm text-red-800 mb-3">
              The following resources have invalid designations that don't match the Gantt Tool's
              fixed parameters. Please map each resource to a valid designation and category to
              proceed.
            </p>
            <p className="text-sm text-red-700 font-medium">
              {unmappedResources.length} resource{unmappedResources.length > 1 ? "s" : ""} need
              {unmappedResources.length === 1 ? "s" : ""} mapping
            </p>
          </div>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Row
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Resource Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Invalid Designation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Map to Designation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Map to Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Effort
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unmappedResources.map((unmapped) => {
                const mapping = mappings.get(unmapped.rowNumber) || {
                  designation: "",
                  category: "",
                };
                const isRowMapped = mapping.designation && mapping.category;

                return (
                  <tr key={unmapped.rowNumber} className={isRowMapped ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {unmapped.rowNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{unmapped.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">
                        {unmapped.originalDesignation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping.designation}
                        onChange={(e) =>
                          handleDesignationChange(unmapped.rowNumber, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">-- Select Designation --</option>
                        {Object.entries(RESOURCE_DESIGNATIONS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {String(label)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping.category}
                        onChange={(e) => handleCategoryChange(unmapped.rowNumber, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        {Object.entries(RESOURCE_CATEGORIES).map(([key, config]: [string, any]) => (
                          <option key={key} value={key}>
                            {config.icon} {config.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{unmapped.totalDays} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status */}
      {allMapped ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              All resources have been mapped successfully. You can proceed to review.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please complete all mappings to proceed to the review stage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Review Stage Component
function ReviewStage({
  schedule,
  resources,
  skippedResources,
  importMode,
  onImportModeChange,
  newProjectName,
  onNewProjectNameChange,
  selectedProjectId,
  onSelectedProjectIdChange,
  existingProjects,
}: {
  schedule: ParsedSchedule;
  resources: ParsedResources | null;
  skippedResources: boolean;
  importMode: "new" | "append";
  onImportModeChange: (mode: "new" | "append") => void;
  newProjectName: string;
  onNewProjectNameChange: (name: string) => void;
  selectedProjectId: string | null;
  onSelectedProjectIdChange: (id: string | null) => void;
  existingProjects: any[];
}) {
  return (
    <div className="space-y-6">
      {/* Import Mode Selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Choose Import Mode</h3>
        <div className="space-y-3">
          {/* New Project Option */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="importMode"
              value="new"
              checked={importMode === "new"}
              onChange={() => onImportModeChange("new")}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-blue-900">Create New Project</div>
              <p className="text-sm text-blue-800">Import data into a brand new project</p>
              {importMode === "new" && (
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => onNewProjectNameChange(e.target.value)}
                  placeholder="Enter project name..."
                  className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}
            </div>
          </label>

          {/* Append to Existing Option */}
          {existingProjects.length > 0 && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === "append"}
                onChange={() => onImportModeChange("append")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-blue-900">Append to Existing Project</div>
                <p className="text-sm text-blue-800">Add data to an existing project</p>
                {importMode === "append" && (
                  <select
                    value={selectedProjectId || ""}
                    onChange={(e) => onSelectedProjectIdChange(e.target.value || null)}
                    className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {existingProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.phases.length} phases)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Schedule Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Phases" value={schedule.phases.length} />
          <StatCard label="Tasks" value={schedule.totalTasks} />
          <StatCard label="Start Date" value={schedule.projectStartDate} />
          <StatCard label="Duration" value={`${schedule.durationDays} days`} />
        </div>
      </div>

      {/* Resource Summary */}
      {resources && !skippedResources && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Resource Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Resources" value={resources.resources.length} />
            <StatCard label="Total Mandays" value={resources.totalMandays} />
          </div>
        </div>
      )}

      {skippedResources && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Resources skipped - you can add them later</p>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

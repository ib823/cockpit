/**
 * Gantt Tool Store V2 - Database-backed
 *
 * Uses API routes for persistence instead of localStorage.
 * Maintains backward compatibility for migration.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  GanttMilestone,
  GanttHoliday,
  GanttViewSettings,
  SidePanelState,
  SelectionState,
  PhaseFormData,
  TaskFormData,
  MilestoneFormData,
  HolidayFormData,
  Resource,
  ResourceFormData,
  TaskResourceAssignment,
  PhaseResourceAssignment,
  ProjectBudget,
  ProjectDelta,
  RACIAssignment,
  PeerLink,
} from "@/types/gantt-tool";

// Architecture types for Unified Project Model (Phase 4)
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from "@/app/architecture/v3/types";
import { PHASE_COLOR_PRESETS } from "@/types/gantt-tool";
import { differenceInDays, addDays, format } from "date-fns";
import {
  adjustDatesToWorkingDays,
  calculateWorkingDaysInclusive,
  addWorkingDays,
} from "@/lib/gantt-tool/working-days";
import {
  calculateProjectDelta,
  isDeltaEmpty,
  getDeltaSummary,
  sanitizeDelta,
} from "@/lib/gantt-tool/delta-calculator";
import { shouldBatchDelta, batchDelta, type DeltaBatch } from "@/lib/gantt-tool/delta-batcher";
import {
  saveProjectLocal,
  addToSyncQueue,
  getProjectLocal,
  getAllProjectsLocal,
} from "@/lib/gantt-tool/local-storage";
import { startBackgroundSync, stopBackgroundSync } from "@/lib/gantt-tool/background-sync";
// import { createDefaultResources } from '@/lib/gantt-tool/default-resources'; // No longer used - users add resources manually or via import

// Debounce timer for save operations (500ms)
let saveDebounceTimer: NodeJS.Timeout | null = null;

interface GanttToolStateV2 {
  // Core Data (loaded from API)
  currentProject: GanttProject | null;
  projects: GanttProject[];

  // Delta Save - Track last saved state for incremental updates
  lastSavedProject: GanttProject | null;

  // Sync state
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  syncErrorType: "foreign_key" | "validation" | "conflict" | "network" | "unknown" | null;
  saveProgress: {
    currentBatch: number;
    totalBatches: number;
    description: string;
  } | null;

  // Local-first sync status
  syncStatus: "idle" | "saving-local" | "saved-local" | "syncing-cloud" | "synced-cloud" | "error";
  lastLocalSaveAt: Date | null;
  cloudSyncPending: boolean;

  // History (Undo/Redo) - Client-side only
  history: {
    past: GanttProject[];
    future: GanttProject[];
  };

  // UI State
  sidePanel: SidePanelState;
  selection: SelectionState;
  isLoading: boolean;
  error: string | null;
  manuallyUnloaded: boolean;
  focusedPhaseId: string | null;
  validationWarnings: Array<{
    id: string;
    type: "task-outside-phase" | "overlapping-tasks" | "invalid-dates";
    message: string;
    phaseId?: string;
    taskId?: string;
  }>;

  // API Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (name: string, startDate: string, description?: string, companyLogos?: Record<string, string>) => Promise<void>;
  importProject: (data: GanttProject) => Promise<void>;
  createProjectFromTemplate: (template: GanttProject) => Promise<void>;
  saveProject: () => Promise<void>; // Auto-save current project to API
  deleteProject: (projectId: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  unloadCurrentProject: () => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Phase Management (with auto-save)
  addPhase: (data: PhaseFormData) => Promise<void>;
  updatePhase: (phaseId: string, updates: Partial<GanttPhase>) => Promise<void>;
  deletePhase: (phaseId: string) => Promise<void>;
  togglePhaseCollapse: (phaseId: string) => void;
  movePhase: (phaseId: string, newStartDate: string, newEndDate: string) => void;
  reorderPhase: (phaseId: string, direction: "up" | "down") => void;
  autoAlignPhase: (phaseId: string) => void;

  // Task Management (with auto-save)
  addTask: (data: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, phaseId: string, updates: Partial<GanttTask>) => Promise<void>;
  deleteTask: (taskId: string, phaseId: string) => Promise<void>;
  moveTask: (taskId: string, phaseId: string, newStartDate: string, newEndDate: string) => void;
  updateTaskProgress: (taskId: string, phaseId: string, progress: number) => void;
  reorderTask: (taskId: string, phaseId: string, direction: "up" | "down") => void;
  autoAlignTask: (taskId: string, phaseId: string) => void;

  // Task Hierarchy (with auto-save)
  toggleTaskCollapse: (taskId: string, phaseId: string) => void;
  makeTaskChild: (taskId: string, parentTaskId: string, phaseId: string) => void;
  promoteTask: (taskId: string, phaseId: string) => void;
  getTaskWithChildren: (taskId: string, phaseId: string) => GanttTask | null;

  // Milestone Management (with auto-save)
  addMilestone: (data: MilestoneFormData) => Promise<void>;
  updateMilestone: (milestoneId: string, updates: Partial<GanttMilestone>) => Promise<void>;
  deleteMilestone: (milestoneId: string) => Promise<void>;

  // Holiday Management (with auto-save)
  addHoliday: (data: HolidayFormData) => Promise<void>;
  deleteHoliday: (holidayId: string) => Promise<void>;

  // Resource Management (with auto-save)
  addResource: (data: ResourceFormData) => Promise<void>;
  updateResource: (resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  getResourceById: (resourceId: string) => Resource | undefined;

  // Org Chart Peer Links (explicit peer relationships created via drag-drop)
  addPeerLink: (resource1Id: string, resource2Id: string) => Promise<void>;
  removePeerLink: (peerLinkId: string) => Promise<void>;
  getPeerLinks: () => PeerLink[];
  isPeerLinked: (resource1Id: string, resource2Id: string) => boolean;

  // Resource Assignment (with auto-save)
  assignResourceToTask: (
    taskId: string,
    phaseId: string,
    resourceId: string,
    assignmentNotes: string,
    allocationPercentage: number
  ) => void;
  unassignResourceFromTask: (taskId: string, phaseId: string, assignmentId: string) => void;
  updateTaskResourceAssignment: (
    taskId: string,
    phaseId: string,
    assignmentId: string,
    assignmentNotes: string,
    allocationPercentage: number
  ) => void;
  assignResourceToPhase: (
    phaseId: string,
    resourceId: string,
    assignmentNotes: string,
    allocationPercentage: number
  ) => void;
  unassignResourceFromPhase: (phaseId: string, assignmentId: string) => void;
  updatePhaseResourceAssignment: (
    phaseId: string,
    assignmentId: string,
    assignmentNotes: string,
    allocationPercentage: number
  ) => void;

  // RACI Matrix Management (with auto-save)
  updatePhaseRaci: (phaseId: string, assignments: RACIAssignment[]) => Promise<void>;
  updateTaskRaci: (taskId: string, phaseId: string, assignments: RACIAssignment[]) => Promise<void>;

  // Logo Management (with auto-save)
  uploadProjectLogo: (companyName: string, logoDataUrl: string) => Promise<void>;
  deleteProjectLogo: (companyName: string) => Promise<void>;
  updateProjectLogos: (logos: Record<string, string>) => Promise<void>;
  selectDisplayLogo: (companyName: string) => Promise<void>;
  getProjectLogos: () => Record<string, string>;
  getCustomProjectLogos: () => Record<string, string>;

  // Budget Management (with auto-save)
  updateProjectBudget: (budget: ProjectBudget) => void;
  updateProjectName: (name: string) => Promise<void>;

  // View Settings (with auto-save)
  updateViewSettings: (updates: Partial<GanttViewSettings>) => void;
  setZoomLevel: (level: GanttViewSettings["zoomLevel"]) => void;
  toggleWeekends: () => void;
  toggleHolidays: () => void;
  toggleMilestones: () => void;
  toggleTitles: () => void;
  setBarDurationDisplay: (display: "wd" | "cd" | "resource" | "dates" | "all" | "clean") => void;

  // UI State
  openSidePanel: (
    mode: SidePanelState["mode"],
    itemType: SidePanelState["itemType"],
    itemId?: string
  ) => void;
  closeSidePanel: () => void;
  selectItem: (itemId: string, itemType: SelectionState["selectedItemType"]) => void;
  clearSelection: () => void;
  clearSyncError: () => void;

  // Focus Mode
  focusPhase: (phaseId: string) => void;
  exitFocusMode: () => void;

  // Architecture Methods (Unified Project Model - Phase 4)
  // Enable updating architecture data on the same project
  updateBusinessContext: (data: BusinessContextData) => Promise<void>;
  updateCurrentLandscape: (data: CurrentLandscapeData) => Promise<void>;
  updateProposedSolution: (data: ProposedSolutionData) => Promise<void>;
  updateDiagramSettings: (settings: DiagramSettings) => Promise<void>;
  updateArchitectureVersion: (version: string) => Promise<void>;

  // Getters
  getPhaseById: (phaseId: string) => GanttPhase | undefined;
  getTaskById: (taskId: string) => { task: GanttTask; phase: GanttPhase } | undefined;
  getMilestoneById: (milestoneId: string) => GanttMilestone | undefined;
  getProjectDuration: () => { startDate: Date; endDate: Date; durationDays: number } | null;
  getWorkingDays: (startDate: Date, endDate: Date) => number;

  // Validation
  validateProject: () => void;
  clearValidationWarnings: () => void;
}

const DEFAULT_VIEW_SETTINGS: GanttViewSettings = {
  zoomLevel: "week",
  showWeekends: true,
  showHolidays: true,
  showMilestones: true,
  showTaskDependencies: false,
  showCriticalPath: false,
  showTitles: true,
  barDurationDisplay: "all",
};

// Helper to deep clone project for history
function cloneProject(project: GanttProject | null): GanttProject | null {
  if (!project) return null;
  return JSON.parse(JSON.stringify(project));
}

// Helper to ensure date is formatted as YYYY-MM-DD string
function formatDateField(date: string | Date): string {
  try {
    if (typeof date === "string") {
      // Already a string, just ensure it's in the right format
      const cleaned = date.includes("T") ? date.split("T")[0] : date;
      // Validate format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        console.error("Invalid date format:", date, "cleaned:", cleaned);
        throw new Error(`Invalid date format: ${cleaned}`);
      }
      return cleaned;
    }
    // It's a Date object, format it
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date object:", date);
      throw new Error(`Invalid date object: ${date}`);
    }
    return format(date, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date:", date, error);
    throw error;
  }
}

export const useGanttToolStoreV2 = create<GanttToolStateV2>()(
  immer((set, get) => ({
    // Initial State
    currentProject: null,
    projects: [],
    lastSavedProject: null,
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
    syncErrorType: null,
    saveProgress: null,
    syncStatus: "idle",
    lastLocalSaveAt: null,
    cloudSyncPending: false,
    history: {
      past: [],
      future: [],
    },
    sidePanel: {
      isOpen: false,
      mode: "view",
      itemType: null,
    },
    selection: {
      selectedItemId: null,
      selectedItemType: null,
    },
    isLoading: false,
    error: null,
    manuallyUnloaded: false,
    focusedPhaseId: null,
    validationWarnings: [],

    // --- API Actions ---

    fetchProjects: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // STEP 1: Load from IndexedDB first (instant, offline-capable)
        const localProjects = await getAllProjectsLocal();
        console.log(`[Store] Loaded ${localProjects.length} projects from IndexedDB`);

        // STEP 2: Fetch from server (for sync)
        let serverProjects: GanttProject[] = [];
        try {
          const response = await fetch("/api/gantt-tool/projects");
          if (response.ok) {
            const data = await response.json();
            serverProjects = data.projects;
            console.log(`[Store] Loaded ${serverProjects.length} projects from server`);
          }
        } catch (fetchError) {
          console.warn("[Store] Could not fetch from server, using local data only:", fetchError);
        }

        // STEP 3: Merge: Local projects with unsaved changes take priority
        const projectMap = new Map<string, GanttProject>();

        // Add server projects first
        serverProjects.forEach((p) => projectMap.set(p.id, p));

        // Override with local projects (they're more recent if they exist)
        localProjects.forEach((p) => {
          const localMeta = p as any;
          // If local project is newer or has unsaved changes, use it
          if (localMeta.needsSync || localMeta.localUpdatedAt) {
            projectMap.set(p.id, p);
            console.log(`[Store] Using local version of project: ${p.name} (has unsaved changes)`);
          }
        });

        const mergedProjects = Array.from(projectMap.values());

        set((state) => {
          state.projects = mergedProjects;
          state.isLoading = false;
          state.lastSyncAt = new Date();
        });

        console.log(`[Store] Total projects after merge: ${mergedProjects.length}`);
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.isLoading = false;
        });
      }
    },

    fetchProject: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch(`/api/gantt-tool/projects/${projectId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        const data = await response.json();

        set((state) => {
          state.currentProject = data.project;
          // Deep clone to set as baseline for delta tracking
          state.lastSavedProject = JSON.parse(JSON.stringify(data.project));
          state.isLoading = false;
          state.manuallyUnloaded = false;
          state.lastSyncAt = new Date();
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Unknown error";
          state.isLoading = false;
        });
      }
    },

    createProject: async (name: string, startDate: string, description?: string, companyLogos?: Record<string, string>) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        const response = await fetch("/api/gantt-tool/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            startDate,
            description,
            viewSettings: { ...DEFAULT_VIEW_SETTINGS },
            orgChartPro: companyLogos ? { companyLogos } : undefined,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.error || "Project name already exists");
          }
          throw new Error("Failed to create project");
        }

        const data = await response.json();

        // FIX: Do NOT initialize resources with defaults
        // Users should manually add resources or import them from Excel
        // Previously this added 90+ default SAP resources which cluttered the project
        //
        // const resourceData = createDefaultResources();
        // const updateResponse = await fetch(`/api/gantt-tool/projects/${data.project.id}`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     resources: resourceData,
        //   }),
        // });
        // if (!updateResponse.ok) {
        //   throw new Error('Failed to add default resources');
        // }
        // const updatedData = await updateResponse.json();

        set((state) => {
          state.currentProject = data.project; // Use original project data, not updatedData
          // Deep clone to set as baseline for delta tracking
          state.lastSavedProject = JSON.parse(JSON.stringify(data.project));
          state.projects.push(data.project);
          state.isSyncing = false;
          state.lastSyncAt = new Date();
          state.manuallyUnloaded = false;
        });
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : "Unknown error";
          state.isSyncing = false;
        });
        // Re-throw so calling code knows creation failed
        throw error;
      }
    },

    importProject: async (data: GanttProject) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        // Create project via API with imported data
        const response = await fetch("/api/gantt-tool/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            // Generate new ID and timestamps
            id: undefined, // Let server generate
            createdAt: undefined,
            updatedAt: undefined,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.error || "Project name already exists");
          }
          throw new Error("Failed to import project");
        }

        const responseData = await response.json();

        set((state) => {
          state.currentProject = responseData.project;
          // Deep clone to set as baseline for delta tracking
          state.lastSavedProject = JSON.parse(JSON.stringify(responseData.project));
          state.projects.push(responseData.project);
          state.isSyncing = false;
          state.lastSyncAt = new Date();
          state.manuallyUnloaded = false;
        });

        // Fetch all projects to refresh the list
        await get().fetchProjects();
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : "Unknown error";
          state.isSyncing = false;
        });
        // Re-throw so calling code knows import failed
        throw error;
      }
    },

    createProjectFromTemplate: async (template: GanttProject) => {
      // Templates are just imported projects with a different name
      await get().importProject({
        ...template,
        name: `${template.name} (Copy)`,
      });
    },

    saveProject: async () => {
      const { currentProject, syncStatus } = get();

      if (!currentProject) return;

      // Skip if already saving locally
      if (syncStatus === "saving-local") {
        console.log("[Store] Save already in progress, skipping...");
        return;
      }

      // Clear existing debounce timer
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
      }

      // Debounce saves to avoid too many writes
      return new Promise<void>((resolve, reject) => {
        saveDebounceTimer = setTimeout(async () => {
          try {
            // CLIENT-SIDE FIRST: Save to IndexedDB immediately (instant!)
            set({ syncStatus: "saving-local" });

            await saveProjectLocal(currentProject);

            // Update state - saved locally!
            set((state) => {
              state.syncStatus = "saved-local";
              state.lastLocalSaveAt = new Date();
              state.cloudSyncPending = true;
              state.lastSavedProject = JSON.parse(JSON.stringify(currentProject));
            });

            // Queue for background cloud sync (non-blocking)
            await addToSyncQueue(currentProject.id);

            console.log("[Store] ✓ Saved locally, queued for cloud sync");
            resolve();
          } catch (error) {
            set((state) => {
              state.syncStatus = "error";
              state.syncError = error instanceof Error ? error.message : "Unknown error";
            });
            console.error("[Store] Local save failed:", error);
            reject(error);
          }
        }, 300); // Reduced debounce for faster feedback
      });
    },

    // Legacy server-first save (kept for fallback/migration)
    saveProjectServerFirst: async () => {
      const { currentProject, isSyncing, lastSavedProject } = get();

      if (!currentProject) return;

      // Skip if already syncing
      if (isSyncing) {
        console.log("[Store] Save already in progress, skipping...");
        return;
      }

      // Clear existing debounce timer
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
      }

      // Helper function to serialize a delta
      const serializeDelta = (delta: ProjectDelta): ProjectDelta => {
        const serialized: ProjectDelta = {};

        if (delta.projectUpdates) {
          serialized.projectUpdates = {};
          if (delta.projectUpdates.name !== undefined)
            serialized.projectUpdates.name = delta.projectUpdates.name;
          if (delta.projectUpdates.description !== undefined)
            serialized.projectUpdates.description = delta.projectUpdates.description;
          if (delta.projectUpdates.startDate !== undefined)
            serialized.projectUpdates.startDate = formatDateField(delta.projectUpdates.startDate);
          if (delta.projectUpdates.viewSettings !== undefined)
            serialized.projectUpdates.viewSettings = delta.projectUpdates.viewSettings;
          if (delta.projectUpdates.budget !== undefined)
            serialized.projectUpdates.budget = delta.projectUpdates.budget;
          if (delta.projectUpdates.orgChart !== undefined)
            serialized.projectUpdates.orgChart = delta.projectUpdates.orgChart;
        }

        if (delta.phases) {
          serialized.phases = {};
          if (delta.phases.created) {
            serialized.phases.created = delta.phases.created.map((phase) => ({
              ...phase,
              startDate: formatDateField(phase.startDate),
              endDate: formatDateField(phase.endDate),
              tasks: phase.tasks.map((task: any) => ({
                ...task,
                startDate: formatDateField(task.startDate),
                endDate: formatDateField(task.endDate),
              })),
            }));
          }
          if (delta.phases.updated) {
            serialized.phases.updated = delta.phases.updated.map((phase) => ({
              ...phase,
              startDate: formatDateField(phase.startDate),
              endDate: formatDateField(phase.endDate),
              tasks: phase.tasks.map((task: any) => ({
                ...task,
                startDate: formatDateField(task.startDate),
                endDate: formatDateField(task.endDate),
              })),
            }));
          }
          if (delta.phases.deleted) {
            serialized.phases.deleted = delta.phases.deleted;
          }
        }

        if (delta.resources) {
          serialized.resources = delta.resources;
        }

        if (delta.milestones) {
          serialized.milestones = {};
          if (delta.milestones.created) {
            serialized.milestones.created = delta.milestones.created.map((m) => ({
              ...m,
              date: formatDateField(m.date),
            }));
          }
          if (delta.milestones.updated) {
            serialized.milestones.updated = delta.milestones.updated.map((m) => ({
              ...m,
              date: formatDateField(m.date),
            }));
          }
          if (delta.milestones.deleted) {
            serialized.milestones.deleted = delta.milestones.deleted;
          }
        }

        if (delta.holidays) {
          serialized.holidays = {};
          if (delta.holidays.created) {
            serialized.holidays.created = delta.holidays.created.map((h) => ({
              ...h,
              date: formatDateField(h.date),
            }));
          }
          if (delta.holidays.updated) {
            serialized.holidays.updated = delta.holidays.updated.map((h) => ({
              ...h,
              date: formatDateField(h.date),
            }));
          }
          if (delta.holidays.deleted) {
            serialized.holidays.deleted = delta.holidays.deleted;
          }
        }

        return serialized;
      };

      // Helper function to send a delta batch
      const sendDeltaBatch = async (serializedDelta: ProjectDelta): Promise<void> => {
        const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}/delta`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serializedDelta),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText || "Unknown Error"}`,
          }));
          const errorMessage = errorData.error || `Failed to save project (${response.status})`;

          // Enhanced error logging to debug validation issues
          console.error("Save project failed:", {
            status: response.status,
            errorMessage,
            errorData,
            validationDetails: errorData.details,
          });

          // If validation failed, show detailed error
          if (errorData.details && Array.isArray(errorData.details)) {
            const detailedErrors = errorData.details
              .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
              .join(", ");
            throw new Error(`Validation failed: ${detailedErrors}`);
          }

          // Provide more context for common errors
          let userFriendlyMessage = errorMessage;
          if (response.status === 409) {
            userFriendlyMessage = "This data conflicts with existing records. " + errorMessage;
          } else if (response.status === 400) {
            userFriendlyMessage = "Invalid data: " + (errorData.message || errorMessage);
          } else if (response.status === 500) {
            userFriendlyMessage =
              "Server error while saving. Changes may have been partially saved. Please refresh the page to see the latest data.";
          }

          throw new Error(userFriendlyMessage);
        }
      };

      // Debounce the save operation (500ms)
      return new Promise<void>((resolve, reject) => {
        saveDebounceTimer = setTimeout(async () => {
          set((state) => {
            state.isSyncing = true;
            state.syncError = null;
            state.saveProgress = null;
          });

          try {
            // Calculate delta (only what changed)
            let delta = calculateProjectDelta(currentProject, lastSavedProject);

            // Sanitize delta to prevent duplicate resource assignments
            delta = sanitizeDelta(delta);

            // Skip save if nothing changed
            if (isDeltaEmpty(delta)) {
              console.log("[Store] No changes detected, skipping save");
              set((state) => {
                state.isSyncing = false;
                state.saveProgress = null;
              });
              resolve();
              return;
            }

            // Log delta summary
            console.log("[Store] Saving delta:", getDeltaSummary(delta));

            // Check if we need to batch
            if (shouldBatchDelta(delta)) {
              console.log("[Store] Large delta detected, using batched save...");
              const batches = batchDelta(delta);
              console.log(`[Store] Split into ${batches.length} batches`);

              // Save each batch sequentially
              for (const batchInfo of batches) {
                set((state) => {
                  state.saveProgress = {
                    currentBatch: batchInfo.batchNumber,
                    totalBatches: batchInfo.totalBatches,
                    description: batchInfo.description,
                  };
                });

                console.log(
                  `[Store] Batch ${batchInfo.batchNumber}/${batchInfo.totalBatches}: ${batchInfo.description}`
                );
                const serializedBatch = serializeDelta(batchInfo.batch);
                await sendDeltaBatch(serializedBatch);
              }
            } else {
              // Small delta, save in one request
              const serializedDelta = serializeDelta(delta);
              await sendDeltaBatch(serializedDelta);
            }

            set((state) => {
              state.isSyncing = false;
              state.lastSyncAt = new Date();
              state.saveProgress = null;

              // Deep clone currentProject to track as last saved state
              state.lastSavedProject = JSON.parse(JSON.stringify(currentProject));

              // Update in projects array
              const index = state.projects.findIndex((p) => p.id === currentProject.id);
              if (index !== -1) {
                state.projects[index] = currentProject;
              }
            });

            resolve();
          } catch (error) {
            set((state) => {
              state.syncError = error instanceof Error ? error.message : "Unknown error";
              state.isSyncing = false;
              state.saveProgress = null;
            });
            reject(error);
          }
        }, 500);
      });
    },

    deleteProject: async (projectId: string) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        const response = await fetch(`/api/gantt-tool/projects/${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete project");
        }

        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== projectId);
          if (state.currentProject?.id === projectId) {
            state.currentProject = null;
          }
          state.isSyncing = false;
          state.lastSyncAt = new Date();
        });

        // Refetch projects to ensure we have the latest list from the database
        await get().fetchProjects();
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : "Unknown error";
          state.isSyncing = false;
        });
        throw error; // Re-throw to let caller handle
      }
    },

    loadProject: async (projectId: string) => {
      try {
        // STEP 1: Try to load from IndexedDB first (instant, has local changes)
        const localProject = await getProjectLocal(projectId);

        if (localProject) {
          const localMeta = localProject as any;

          // STEP 2: If local version has unsaved changes, use it!
          if (localMeta.needsSync || localMeta.localUpdatedAt) {
            console.log(
              `[Store] Loading from IndexedDB (has unsaved changes): ${localProject.name}`
            );
            set((state) => {
              state.currentProject = localProject;
              state.manuallyUnloaded = false;
            });
            return;
          }

          // STEP 3: Otherwise use local but update from server if possible
          console.log(`[Store] Loading from IndexedDB: ${localProject.name}`);
          set((state) => {
            state.currentProject = localProject;
            state.manuallyUnloaded = false;
          });

          // Try to refresh from server in background (non-blocking)
          get()
            .fetchProject(projectId)
            .catch((err) => {
              console.warn("[Store] Could not refresh from server:", err);
            });
          return;
        }

        // STEP 4: Fallback to in-memory projects array (from fetchProjects)
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          console.log(`[Store] Loading from memory: ${project.name}`);
          set((state) => {
            state.currentProject = project;
            state.manuallyUnloaded = false;
          });
        } else {
          console.warn(`[Store] Project ${projectId} not found in local storage or memory`);
        }
      } catch (error) {
        console.error("[Store] Error loading project:", error);

        // Final fallback to in-memory
        const { projects } = get();
        const project = projects.find((p) => p.id === projectId);
        if (project) {
          set((state) => {
            state.currentProject = project;
            state.manuallyUnloaded = false;
          });
        }
      }
    },

    unloadCurrentProject: () => {
      set((state) => {
        state.currentProject = null;
        state.manuallyUnloaded = true;
        state.sidePanel = {
          isOpen: false,
          mode: "view",
          itemType: null,
        };
        state.selection = {
          selectedItemId: null,
          selectedItemType: null,
        };
      });
    },

    // --- History Actions ---

    canUndo: () => {
      const { history } = get();
      return history.past.length > 0;
    },

    canRedo: () => {
      const { history } = get();
      return history.future.length > 0;
    },

    undo: () => {
      const { currentProject, history } = get();
      if (!currentProject || history.past.length === 0) return;

      set((state) => {
        const previousState = state.history.past[state.history.past.length - 1];

        // Push current to future
        const currentClone = cloneProject(state.currentProject);
        if (currentClone) {
          state.history.future.push(currentClone);
        }

        // Pop from past and set as current
        state.history.past = state.history.past.slice(0, -1);
        state.currentProject = previousState;
      });

      // Save to API
      get().saveProject();
    },

    redo: () => {
      const { currentProject, history } = get();
      if (!currentProject || history.future.length === 0) return;

      set((state) => {
        const nextState = state.history.future[state.history.future.length - 1];

        // Push current to past
        const currentClone = cloneProject(state.currentProject);
        if (currentClone) {
          state.history.past.push(currentClone);
        }

        // Pop from future and set as current
        state.history.future = state.history.future.slice(0, -1);
        state.currentProject = nextState;
      });

      // Save to API
      get().saveProject();
    },

    // --- Phase Management ---

    addPhase: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        // Save to history
        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) {
            state.history.past = state.history.past.slice(-50);
          }
        }

        // For AMS phases, calculate end date based on duration
        let finalStartDate = data.startDate;
        let finalEndDate = data.endDate;

        if (data.phaseType === "ams" && data.amsDuration) {
          // AMS end date = start date + years
          const startDate = new Date(data.startDate);
          const yearsToAdd = data.amsDuration;
          const amsEndDate = new Date(startDate);
          amsEndDate.setFullYear(startDate.getFullYear() + yearsToAdd);
          finalEndDate = format(amsEndDate, "yyyy-MM-dd");
          finalStartDate = data.startDate; // AMS doesn't need working day adjustment
        } else {
          // Standard phases use working day adjustment
          const adjustedDates = adjustDatesToWorkingDays(
            data.startDate,
            data.endDate,
            state.currentProject.holidays
          );
          finalStartDate = adjustedDates.startDate;
          finalEndDate = adjustedDates.endDate;
        }

        const phaseId = `phase-${Date.now()}-${nanoid()}`;
        const colorIndex = state.currentProject.phases.length % PHASE_COLOR_PRESETS.length;

        const newPhase: GanttPhase = {
          id: phaseId,
          name: data.name,
          description: data.description,
          deliverables: data.deliverables,
          color: data.color || PHASE_COLOR_PRESETS[colorIndex],
          startDate: finalStartDate,
          endDate: finalEndDate,
          tasks: [],
          collapsed: false,
          dependencies: [],
          phaseResourceAssignments: [],
          order: state.currentProject.phases.length,
          phaseType: data.phaseType || "standard",
          amsDuration: data.phaseType === "ams" ? data.amsDuration : undefined,
        };

        state.currentProject.phases.push(newPhase);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      // Save to API and wait for completion
      await get().saveProject();
    },

    updatePhase: async (phaseId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        // Save to history
        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (phase) {
          if (updates.startDate || updates.endDate) {
            const adjustedDates = adjustDatesToWorkingDays(
              updates.startDate || phase.startDate,
              updates.endDate || phase.endDate,
              state.currentProject.holidays
            );
            updates.startDate = adjustedDates.startDate;
            updates.endDate = adjustedDates.endDate;
          }

          Object.assign(phase, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deletePhase: async (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.phases = state.currentProject.phases.filter((p) => p.id !== phaseId);
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === phaseId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    togglePhaseCollapse: (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (phase) {
          phase.collapsed = !phase.collapsed;
        }
      });
      // No auto-save for UI state changes
    },

    movePhase: (phaseId, newStartDate, newEndDate) => {
      set((state) => {
        if (!state.currentProject) return;

        // Save to history
        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        // Calculate the date shift (in days)
        const oldStartDate = new Date(phase.startDate);
        const newStart = new Date(newStartDate);
        const daysDiff = differenceInDays(newStart, oldStartDate);

        // Update phase dates
        phase.startDate = newStartDate;
        phase.endDate = newEndDate;

        // Shift all tasks by the same amount to maintain relative positions
        phase.tasks.forEach((task) => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);

          const newTaskStart = addDays(taskStart, daysDiff);
          const newTaskEnd = addDays(taskEnd, daysDiff);

          task.startDate = newTaskStart.toISOString();
          task.endDate = newTaskEnd.toISOString();
        });

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    reorderPhase: (phaseId, direction) => {
      set((state) => {
        if (!state.currentProject) return;

        const phases = state.currentProject.phases;
        const currentIndex = phases.findIndex((p) => p.id === phaseId);

        if (currentIndex === -1) return;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= phases.length) return;

        [phases[currentIndex], phases[newIndex]] = [phases[newIndex], phases[currentIndex]];

        // Update the order field for all phases to match their new array positions
        phases.forEach((phase, index) => {
          phase.order = index;
        });

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    autoAlignPhase: (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phases = state.currentProject.phases;
        const currentIndex = phases.findIndex((p) => p.id === phaseId);

        if (currentIndex === -1 || currentIndex === 0) {
          if (currentIndex === 0) {
            alert("Cannot auto-align the first phase in the project.");
          }
          return;
        }

        const currentPhase = phases[currentIndex];
        const previousPhase = phases[currentIndex - 1];

        const phaseWorkingDays = calculateWorkingDaysInclusive(
          currentPhase.startDate,
          currentPhase.endDate,
          state.currentProject.holidays
        );

        const previousEndDate = new Date(previousPhase.endDate);
        const newStartDate = addWorkingDays(
          previousEndDate.toISOString().split("T")[0],
          1,
          state.currentProject.holidays
        );

        const newEndDate = addWorkingDays(
          newStartDate.toISOString().split("T")[0],
          phaseWorkingDays,
          state.currentProject.holidays
        );

        currentPhase.startDate = newStartDate.toISOString().split("T")[0];
        currentPhase.endDate = newEndDate.toISOString().split("T")[0];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // NOTE: The following actions follow the same pattern:
    // 1. Update state using immer
    // 2. Call get().saveProject() after mutation
    // I'm implementing the core actions here. Task, Milestone, Holiday, Resource management
    // follows the same pattern as Phase management above.

    // --- Task Management (stub - implement following phase pattern) ---
    addTask: async (data) => {
      set((state) => {
        if (!state.currentProject) return;
        const phase = state.currentProject.phases.find((p) => p.id === data.phaseId);

        // FIX ISSUE #13: Add phase existence check to prevent race conditions
        if (!phase) {
          throw new Error(
            "Cannot add task: The selected phase no longer exists. " +
              "It may have been deleted by another user. Please refresh the page to see the latest project state."
          );
        }

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const adjustedDates = adjustDatesToWorkingDays(
          data.startDate,
          data.endDate,
          state.currentProject.holidays
        );

        // Validate task dates are within phase boundaries
        const taskStart = new Date(adjustedDates.startDate);
        const taskEnd = new Date(adjustedDates.endDate);
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        if (taskStart < phaseStart || taskEnd > phaseEnd) {
          throw new Error(
            `Task dates must fall within phase boundaries. ` +
            `Phase: ${format(phaseStart, "MMM d, yyyy")} - ${format(phaseEnd, "MMM d, yyyy")}. ` +
            `Task: ${format(taskStart, "MMM d, yyyy")} - ${format(taskEnd, "MMM d, yyyy")}.`
          );
        }

        const taskId = `task-${Date.now()}-${nanoid()}`;

        const newTask: GanttTask = {
          id: taskId,
          phaseId: data.phaseId,
          name: data.name,
          description: data.description,
          deliverables: data.deliverables,
          startDate: adjustedDates.startDate,
          endDate: adjustedDates.endDate,
          dependencies: data.dependencies || [],
          assignee: data.assignee,
          progress: 0,
          resourceAssignments: [],
          order: phase.tasks.length, // Set order to current array length

          // Task Hierarchy fields
          parentTaskId: (data as any).parentTaskId || null,
          level: (data as any).parentTaskId
            ? (phase.tasks.find((t) => t.id === (data as any).parentTaskId)?.level ?? 0) + 1
            : 0,
          collapsed: false,
          isParent: false,

          // AMS Configuration
          isAMS: data.isAMS,
          amsConfig: data.isAMS && data.amsRateType && data.amsFixedRate
            ? {
                rateType: data.amsRateType,
                fixedRate: data.amsFixedRate,
                isOngoing: true,
                minimumDuration: data.amsMinimumDuration,
                notes: data.amsNotes,
              }
            : undefined,
        };

        phase.tasks.push(newTask);

        // Update parent task's isParent flag if this is a child task
        if (newTask.parentTaskId) {
          const parentTask = phase.tasks.find((t) => t.id === newTask.parentTaskId);
          if (parentTask) {
            parentTask.isParent = true;
          }
        }

        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateTask: async (taskId, phaseId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);

        // FIX ISSUE #13: Add phase existence check to prevent race conditions
        if (!phase) {
          throw new Error(
            "Cannot update task: The parent phase no longer exists. " +
              "It may have been deleted by another user. Please refresh the page to see the latest project state."
          );
        }

        const task = phase.tasks.find((t) => t.id === taskId);
        if (task) {
          if (updates.startDate || updates.endDate) {
            const adjustedDates = adjustDatesToWorkingDays(
              updates.startDate || task.startDate,
              updates.endDate || task.endDate,
              state.currentProject.holidays
            );
            updates.startDate = adjustedDates.startDate;
            updates.endDate = adjustedDates.endDate;

            // Validate task dates are within phase boundaries
            const taskStart = new Date(updates.startDate);
            const taskEnd = new Date(updates.endDate);
            const phaseStart = new Date(phase.startDate);
            const phaseEnd = new Date(phase.endDate);

            if (taskStart < phaseStart || taskEnd > phaseEnd) {
              throw new Error(
                `Task dates must fall within phase boundaries. ` +
                `Phase: ${format(phaseStart, "MMM d, yyyy")} - ${format(phaseEnd, "MMM d, yyyy")}. ` +
                `Task: ${format(taskStart, "MMM d, yyyy")} - ${format(taskEnd, "MMM d, yyyy")}.`
              );
            }
          }

          Object.assign(task, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteTask: async (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        phase.tasks = phase.tasks.filter((t) => t.id !== taskId);
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === taskId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    moveTask: (taskId, phaseId, newStartDate, newEndDate) => {
      get().updateTask(taskId, phaseId, { startDate: newStartDate, endDate: newEndDate });
    },

    updateTaskProgress: (taskId, phaseId, progress) => {
      get().updateTask(taskId, phaseId, { progress });
    },

    reorderTask: (taskId, phaseId, direction) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const tasks = phase.tasks;
        const currentIndex = tasks.findIndex((t) => t.id === taskId);

        if (currentIndex === -1) return;

        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= tasks.length) return;

        [tasks[currentIndex], tasks[newIndex]] = [tasks[newIndex], tasks[currentIndex]];

        // Update the order field for all tasks to match their new array positions
        tasks.forEach((task, index) => {
          task.order = index;
        });

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    autoAlignTask: (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const tasks = phase.tasks;
        const currentIndex = tasks.findIndex((t) => t.id === taskId);

        if (currentIndex === -1 || currentIndex === 0) {
          if (currentIndex === 0) {
            alert("Cannot auto-align the first task in the phase.");
          }
          return;
        }

        const currentTask = tasks[currentIndex];
        const previousTask = tasks[currentIndex - 1];

        const taskWorkingDays = calculateWorkingDaysInclusive(
          currentTask.startDate,
          currentTask.endDate,
          state.currentProject.holidays
        );

        const previousEndDate = new Date(previousTask.endDate);
        const newStartDate = addWorkingDays(
          previousEndDate.toISOString().split("T")[0],
          1,
          state.currentProject.holidays
        );

        const newEndDate = addWorkingDays(
          newStartDate.toISOString().split("T")[0],
          taskWorkingDays,
          state.currentProject.holidays
        );

        // Validate bounds
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        if (newStartDate < phaseStart || newEndDate > phaseEnd) {
          alert(
            `Cannot auto-align: The task would fall outside phase boundaries.\n\n` +
              `Phase: ${format(phaseStart, "dd MMM yyyy")} - ${format(phaseEnd, "dd MMM yyyy")}\n` +
              `Proposed task dates: ${format(newStartDate, "dd MMM yyyy")} - ${format(newEndDate, "dd MMM yyyy")}`
          );
          return;
        }

        currentTask.startDate = newStartDate.toISOString().split("T")[0];
        currentTask.endDate = newEndDate.toISOString().split("T")[0];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // --- Task Hierarchy Management ---
    toggleTaskCollapse: (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.isParent) return;

        task.collapsed = !task.collapsed;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    makeTaskChild: (taskId, parentTaskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        const parentTask = phase.tasks.find((t) => t.id === parentTaskId);

        if (!task || !parentTask) return;

        // Prevent circular hierarchy
        if (parentTaskId === taskId) return;

        // Update task hierarchy
        task.parentTaskId = parentTaskId;
        task.level = parentTask.level + 1;

        // Update parent's isParent flag
        parentTask.isParent = true;

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    promoteTask: (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.parentTaskId) return;

        const oldParent = phase.tasks.find((t) => t.id === task.parentTaskId);

        // Remove parent relationship
        task.parentTaskId = null;
        task.level = 0;

        // Check if old parent still has children
        if (oldParent) {
          const hasOtherChildren = phase.tasks.some(
            (t) => t.parentTaskId === oldParent.id && t.id !== taskId
          );
          oldParent.isParent = hasOtherChildren;
        }

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    getTaskWithChildren: (taskId, phaseId) => {
      const state = get();
      if (!state.currentProject) return null;

      const phase = state.currentProject.phases.find((p) => p.id === phaseId);
      if (!phase) return null;

      const task = phase.tasks.find((t) => t.id === taskId);
      if (!task) return null;

      // Recursively build child tree
      const buildTaskTree = (parentId: string): GanttTask[] => {
        return phase.tasks
          .filter((t) => t.parentTaskId === parentId)
          .map((child) => ({
            ...child,
            childTasks: buildTaskTree(child.id),
          }));
      };

      return {
        ...task,
        childTasks: buildTaskTree(task.id),
      };
    },

    // --- Milestone Management (implement following phase pattern) ---
    addMilestone: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const milestoneId = `milestone-${Date.now()}-${nanoid()}`;

        const newMilestone: GanttMilestone = {
          id: milestoneId,
          name: data.name,
          description: data.description,
          date: data.date,
          icon: data.icon,
          color: data.color,
        };

        state.currentProject.milestones.push(newMilestone);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateMilestone: async (milestoneId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const milestone = state.currentProject.milestones.find((m) => m.id === milestoneId);
        if (milestone) {
          Object.assign(milestone, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteMilestone: async (milestoneId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.milestones = state.currentProject.milestones.filter(
          (m) => m.id !== milestoneId
        );
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === milestoneId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    // --- Holiday Management ---
    addHoliday: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const holidayId = `holiday-${Date.now()}-${nanoid()}`;

        const newHoliday: GanttHoliday = {
          id: holidayId,
          name: data.name,
          date: data.date,
          region: data.region,
          type: data.type,
        };

        state.currentProject.holidays.push(newHoliday);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    deleteHoliday: async (holidayId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.holidays = state.currentProject.holidays.filter(
          (h) => h.id !== holidayId
        );
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    // --- Resource Management ---
    addResource: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const resourceId = `resource-${Date.now()}-${nanoid()}`;

        const newResource: Resource = {
          id: resourceId,
          name: data.name,
          category: data.category,
          description: data.description,
          designation: data.designation,
          createdAt: new Date().toISOString(),
          managerResourceId: data.managerResourceId || null,
          email: data.email,
          department: data.department,
          location: data.location,
          projectRole: data.projectRole,
          assignmentLevel: "both",
          isBillable: true,
          chargeRatePerHour: 150,
        };

        state.currentProject.resources.push(newResource);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateResource: async (resourceId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const resource = state.currentProject.resources.find((r) => r.id === resourceId);
        if (resource) {
          // PREVENTIVE VALIDATION: Ensure managerResourceId points to existing resource
          if ('managerResourceId' in updates && updates.managerResourceId) {
            const managerExists = state.currentProject.resources.some(
              (r) => r.id === updates.managerResourceId
            );
            if (!managerExists) {
              console.warn(
                `Cannot set managerResourceId "${updates.managerResourceId}" for resource "${resource.name}" - manager does not exist. Clearing invalid reference.`
              );
              updates.managerResourceId = undefined;
            }
          }

          Object.assign(resource, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteResource: async (resourceId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.resources = state.currentProject.resources.filter(
          (r) => r.id !== resourceId
        );

        // PREVENTIVE CLEANUP: Clear any managerResourceId references to deleted resource
        state.currentProject.resources.forEach((resource) => {
          if (resource.managerResourceId === resourceId) {
            console.warn(
              `Clearing managerResourceId for "${resource.name}" because manager was deleted`
            );
            resource.managerResourceId = undefined;
          }
        });

        // Remove assignments
        state.currentProject.phases.forEach((phase) => {
          phase.tasks.forEach((task) => {
            if (task.resourceAssignments) {
              task.resourceAssignments = task.resourceAssignments.filter(
                (assignment) => assignment.resourceId !== resourceId
              );
            }
          });
        });

        // Remove peer links involving this resource
        if (state.currentProject.orgChartPro?.peerLinks) {
          state.currentProject.orgChartPro.peerLinks =
            state.currentProject.orgChartPro.peerLinks.filter(
              (link) => link.resource1Id !== resourceId && link.resource2Id !== resourceId
            );
        }

        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    getResourceById: (resourceId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.resources.find((r) => r.id === resourceId);
    },

    // --- Org Chart Peer Links ---
    addPeerLink: async (resource1Id, resource2Id) => {
      set((state) => {
        if (!state.currentProject) return;

        // Initialize orgChartPro if needed
        if (!state.currentProject.orgChartPro) {
          state.currentProject.orgChartPro = {};
        }
        if (!state.currentProject.orgChartPro.peerLinks) {
          state.currentProject.orgChartPro.peerLinks = [];
        }

        // Check if link already exists (in either direction)
        const linkExists = state.currentProject.orgChartPro.peerLinks.some(
          (link) =>
            (link.resource1Id === resource1Id && link.resource2Id === resource2Id) ||
            (link.resource1Id === resource2Id && link.resource2Id === resource1Id)
        );

        if (linkExists) {
          console.warn("Peer link already exists");
          return;
        }

        // Create new peer link
        const newLink: PeerLink = {
          id: `peer-link-${nanoid()}`,
          resource1Id,
          resource2Id,
          createdAt: new Date().toISOString(),
        };

        state.currentProject.orgChartPro.peerLinks.push(newLink);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    removePeerLink: async (peerLinkId) => {
      set((state) => {
        if (!state.currentProject?.orgChartPro?.peerLinks) return;

        state.currentProject.orgChartPro.peerLinks =
          state.currentProject.orgChartPro.peerLinks.filter((link) => link.id !== peerLinkId);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    getPeerLinks: () => {
      const { currentProject } = get();
      if (!currentProject?.orgChartPro?.peerLinks) return [];
      return currentProject.orgChartPro.peerLinks;
    },

    isPeerLinked: (resource1Id, resource2Id) => {
      const { currentProject } = get();
      if (!currentProject?.orgChartPro?.peerLinks) return false;

      return currentProject.orgChartPro.peerLinks.some(
        (link) =>
          (link.resource1Id === resource1Id && link.resource2Id === resource2Id) ||
          (link.resource1Id === resource2Id && link.resource2Id === resource1Id)
      );
    },

    // --- Resource Assignment ---
    assignResourceToTask: (taskId, phaseId, resourceId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (task.resourceAssignments?.some((a) => a.resourceId === resourceId)) {
          console.warn("Resource already assigned to this task");
          return;
        }

        const assignmentId = `assignment-${Date.now()}-${nanoid()}`;

        const newAssignment: TaskResourceAssignment = {
          id: assignmentId,
          resourceId,
          assignmentNotes,
          allocationPercentage,
          assignedAt: new Date().toISOString(),
        };

        if (!task.resourceAssignments) {
          task.resourceAssignments = [];
        }
        task.resourceAssignments.push(newAssignment);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    unassignResourceFromTask: (taskId, phaseId, assignmentId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.resourceAssignments) return;

        task.resourceAssignments = task.resourceAssignments.filter((a) => a.id !== assignmentId);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    updateTaskResourceAssignment: (
      taskId,
      phaseId,
      assignmentId,
      assignmentNotes,
      allocationPercentage
    ) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.resourceAssignments) return;

        const assignment = task.resourceAssignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.assignmentNotes = assignmentNotes;
          assignment.allocationPercentage = allocationPercentage;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      get().saveProject();
    },

    assignResourceToPhase: (phaseId, resourceId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const resource = state.currentProject.resources.find((r) => r.id === resourceId);
        if (!resource || (resource.category !== "pm" && resource.category !== "leadership")) {
          console.warn("Only PM and Leadership resources can be assigned to phases");
          return;
        }

        if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resourceId)) {
          console.warn("Resource already assigned to this phase");
          return;
        }

        const assignmentId = `phase-assignment-${Date.now()}-${nanoid()}`;

        const newAssignment: PhaseResourceAssignment = {
          id: assignmentId,
          resourceId,
          assignmentNotes,
          allocationPercentage,
          assignedAt: new Date().toISOString(),
        };

        if (!phase.phaseResourceAssignments) {
          phase.phaseResourceAssignments = [];
        }
        phase.phaseResourceAssignments.push(newAssignment);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    unassignResourceFromPhase: (phaseId, assignmentId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase || !phase.phaseResourceAssignments) return;

        phase.phaseResourceAssignments = phase.phaseResourceAssignments.filter(
          (a) => a.id !== assignmentId
        );

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    updatePhaseResourceAssignment: (
      phaseId,
      assignmentId,
      assignmentNotes,
      allocationPercentage
    ) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase || !phase.phaseResourceAssignments) return;

        const assignment = phase.phaseResourceAssignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.assignmentNotes = assignmentNotes;
          assignment.allocationPercentage = allocationPercentage;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      get().saveProject();
    },

    // --- Logo Management ---
    uploadProjectLogo: async (companyName, logoDataUrl) => {
      set((state) => {
        if (!state.currentProject) return;

        // Initialize orgChartPro if needed
        if (!state.currentProject.orgChartPro) {
          state.currentProject.orgChartPro = {};
        }
        if (!state.currentProject.orgChartPro.companyLogos) {
          state.currentProject.orgChartPro.companyLogos = {};
        }

        // Add/update logo
        state.currentProject.orgChartPro.companyLogos[companyName] = logoDataUrl;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    deleteProjectLogo: async (companyName) => {
      set((state) => {
        if (!state.currentProject?.orgChartPro?.companyLogos) return;

        delete state.currentProject.orgChartPro.companyLogos[companyName];
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateProjectLogos: async (logos) => {
      set((state) => {
        if (!state.currentProject) return;

        if (!state.currentProject.orgChartPro) {
          state.currentProject.orgChartPro = {};
        }

        state.currentProject.orgChartPro.companyLogos = logos;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    selectDisplayLogo: async (companyName: string) => {
      set((state) => {
        if (!state.currentProject) return;

        if (!state.currentProject.orgChartPro) {
          state.currentProject.orgChartPro = {};
        }

        state.currentProject.orgChartPro.selectedLogoCompanyName = companyName;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    getProjectLogos: () => {
      const { currentProject } = get();
      if (!currentProject?.orgChartPro?.companyLogos) {
        return {};
      }
      return currentProject.orgChartPro.companyLogos;
    },

    getCustomProjectLogos: () => {
      // Returns only custom logos (excludes defaults)
      const { currentProject } = get();
      if (!currentProject?.orgChartPro?.companyLogos) {
        return {};
      }
      // Default logos are: "ABeam Consulting", "ABeam", "SAP", "SAP SE"
      const defaultKeys = ["ABeam Consulting", "ABeam", "SAP", "SAP SE"];
      const customLogos: Record<string, string> = {};
      Object.entries(currentProject.orgChartPro.companyLogos).forEach(([key, value]) => {
        if (!defaultKeys.includes(key)) {
          customLogos[key] = value;
        }
      });
      return customLogos;
    },

    // --- Budget Management ---
    updateProjectBudget: (budget) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.budget = budget;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // --- Project Name Update ---
    updateProjectName: async (name: string) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.name = name;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    // --- View Settings ---
    updateViewSettings: (updates) => {
      set((state) => {
        if (!state.currentProject) return;
        Object.assign(state.currentProject.viewSettings, updates);
      });
      get().saveProject();
    },

    setZoomLevel: (level) => {
      get().updateViewSettings({ zoomLevel: level });
    },

    toggleWeekends: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showWeekends =
          !state.currentProject.viewSettings.showWeekends;
      });
      get().saveProject();
    },

    toggleHolidays: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showHolidays =
          !state.currentProject.viewSettings.showHolidays;
      });
      get().saveProject();
    },

    toggleMilestones: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showMilestones =
          !state.currentProject.viewSettings.showMilestones;
      });
      get().saveProject();
    },

    toggleTitles: () => {
      set((state) => {
        if (!state.currentProject) return;
        const currentValue = state.currentProject.viewSettings.showTitles ?? true;
        state.currentProject.viewSettings.showTitles = !currentValue;
      });
      get().saveProject();
    },

    setBarDurationDisplay: (display) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.barDurationDisplay = display;
      });
      get().saveProject();
    },

    // --- UI State ---
    openSidePanel: (mode, itemType, itemId) => {
      set((state) => {
        state.sidePanel = {
          isOpen: true,
          mode,
          itemType,
          itemId,
        };
      });
    },

    closeSidePanel: () => {
      set((state) => {
        state.sidePanel = {
          isOpen: false,
          mode: "view",
          itemType: null,
        };
      });
    },

    selectItem: (itemId, itemType) => {
      set((state) => {
        state.selection = {
          selectedItemId: itemId,
          selectedItemType: itemType,
        };
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selection = {
          selectedItemId: null,
          selectedItemType: null,
        };
      });
    },

    clearSyncError: () => {
      set((state) => {
        state.syncError = null;
        state.syncErrorType = null;
        state.syncStatus = "idle";
      });
    },

    // --- Focus Mode ---
    focusPhase: (phaseId) => {
      set((state) => {
        state.focusedPhaseId = phaseId;
      });
    },

    exitFocusMode: () => {
      set((state) => {
        state.focusedPhaseId = null;
      });
    },

    // --- Getters ---
    getPhaseById: (phaseId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.phases.find((p) => p.id === phaseId);
    },

    getTaskById: (taskId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;

      for (const phase of currentProject.phases) {
        const task = phase.tasks.find((t) => t.id === taskId);
        if (task) {
          return { task, phase };
        }
      }
      return undefined;
    },

    getMilestoneById: (milestoneId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.milestones.find((m) => m.id === milestoneId);
    },

    getProjectDuration: () => {
      const { currentProject } = get();
      if (!currentProject || currentProject.phases.length === 0) return null;

      const allDates = [
        ...currentProject.phases.map((p) => new Date(p.startDate)),
        ...currentProject.phases.map((p) => new Date(p.endDate)),
      ];

      const startDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const endDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      // Add 1 to make dates inclusive (project from Jan 5 to Jan 30 is 26 days, not 25)
      const durationDays = differenceInDays(endDate, startDate) + 1;

      return { startDate, endDate, durationDays };
    },

    getWorkingDays: (startDate, endDate) => {
      const { currentProject } = get();
      if (!currentProject) return 0;

      return calculateWorkingDaysInclusive(startDate, endDate, currentProject.holidays);
    },

    // --- Validation ---

    validateProject: () => {
      const { currentProject } = get();
      if (!currentProject) {
        set((state) => {
          state.validationWarnings = [];
        });
        return;
      }

      const warnings: Array<{
        id: string;
        type: "task-outside-phase" | "overlapping-tasks" | "invalid-dates";
        message: string;
        phaseId?: string;
        taskId?: string;
      }> = [];

      // Check each phase for validation issues
      currentProject.phases.forEach((phase) => {
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        // Check each task in the phase
        phase.tasks.forEach((task) => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);

          // Check if task is outside phase bounds
          if (taskStart < phaseStart || taskEnd > phaseEnd) {
            warnings.push({
              id: `task-outside-${phase.id}-${task.id}`,
              type: "task-outside-phase",
              message: `Task "${task.name}" in phase "${phase.name}" has dates outside the phase boundaries`,
              phaseId: phase.id,
              taskId: task.id,
            });
          }

          // Check for invalid dates (end before start)
          if (taskEnd < taskStart) {
            warnings.push({
              id: `invalid-dates-${phase.id}-${task.id}`,
              type: "invalid-dates",
              message: `Task "${task.name}" has an end date before its start date`,
              phaseId: phase.id,
              taskId: task.id,
            });
          }
        });

        // Check for invalid phase dates
        if (phaseEnd < phaseStart) {
          warnings.push({
            id: `invalid-dates-${phase.id}`,
            type: "invalid-dates",
            message: `Phase "${phase.name}" has an end date before its start date`,
            phaseId: phase.id,
          });
        }
      });

      set((state) => {
        state.validationWarnings = warnings;
      });
    },

    clearValidationWarnings: () => {
      set((state) => {
        state.validationWarnings = [];
      });
    },

    // --- RACI Matrix Management ---
    updatePhaseRaci: async (phaseId, assignments) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (phase) {
          phase.raciAssignments = assignments;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    updateTaskRaci: async (taskId, phaseId, assignments) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (task) {
          task.raciAssignments = assignments;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    // --- Architecture Methods (Unified Project Model - Phase 4) ---
    // Enable viewing same project as Timeline OR Architecture

    updateBusinessContext: async (data: BusinessContextData) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.businessContext = data;
        state.currentProject.lastArchitectureEdit = new Date().toISOString();
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateCurrentLandscape: async (data: CurrentLandscapeData) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.currentLandscape = data;
        state.currentProject.lastArchitectureEdit = new Date().toISOString();
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateProposedSolution: async (data: ProposedSolutionData) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.proposedSolution = data;
        state.currentProject.lastArchitectureEdit = new Date().toISOString();
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateDiagramSettings: async (settings: DiagramSettings) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.diagramSettings = settings;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateArchitectureVersion: async (version: string) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.architectureVersion = version;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },
  }))
);
export { useGanttToolStoreV2 as useGanttToolStore };

// Initialize background sync (client-side only)
if (typeof window !== "undefined") {
  console.log("[Store] Initializing background sync...");

  startBackgroundSync({
    onSyncStart: (projectId) => {
      const store = useGanttToolStoreV2.getState();
      if (store.currentProject?.id === projectId) {
        useGanttToolStoreV2.setState({ syncStatus: "syncing-cloud" });
      }
      console.log("[BackgroundSync] Started syncing project:", projectId);
    },

    onSyncProgress: (projectId, progress) => {
      const store = useGanttToolStoreV2.getState();
      if (store.currentProject?.id === projectId) {
        useGanttToolStoreV2.setState({
          saveProgress: {
            currentBatch: progress.current,
            totalBatches: progress.total,
            description: `Syncing to cloud (${progress.current}/${progress.total})`,
          },
        });
      }
      console.log(`[BackgroundSync] Progress: ${progress.current}/${progress.total}`);
    },

    onSyncSuccess: (projectId) => {
      const store = useGanttToolStoreV2.getState();
      if (store.currentProject?.id === projectId) {
        useGanttToolStoreV2.setState({
          syncStatus: "synced-cloud",
          lastSyncAt: new Date(),
          cloudSyncPending: false,
          saveProgress: null,
        });

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          const currentStore = useGanttToolStoreV2.getState();
          if (
            currentStore.syncStatus === "synced-cloud" &&
            currentStore.currentProject?.id === projectId
          ) {
            useGanttToolStoreV2.setState({ syncStatus: "idle" });
          }
        }, 3000);
      }
      console.log("[BackgroundSync] ✓ Successfully synced project:", projectId);
    },

    onSyncError: (projectId, error, errorType) => {
      const store = useGanttToolStoreV2.getState();
      if (store.currentProject?.id === projectId) {
        useGanttToolStoreV2.setState({
          syncStatus: "error",
          syncError: error,
          syncErrorType: errorType || "unknown",
          saveProgress: null,
        });
      }
      console.error("[BackgroundSync] ✗ Sync error for project:", projectId, error, errorType || "unknown");
    },
  });
}

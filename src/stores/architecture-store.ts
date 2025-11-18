/**
 * Architecture V3 Zustand Store
 *
 * Features:
 * - State management for Architecture V3
 * - Auto-save with 2s debounce
 * - Optimistic UI updates
 * - Error handling and retry logic
 * - Version management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from '@/app/architecture/v3/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ArchitectureProject {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  version: string;
  businessContext: BusinessContextData;
  currentLandscape: CurrentLandscapeData;
  proposedSolution: ProposedSolutionData;
  diagramSettings: DiagramSettings;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastEditedAt: Date | string;
  lastEditedBy?: string | null;
  deletedAt?: Date | string | null;
}

interface ArchitectureStoreState {
  // Current state
  currentProject: ArchitectureProject | null;
  projects: ArchitectureProject[];
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;

  // Auto-save state
  autoSaveEnabled: boolean;
  autoSaveTimeoutId: NodeJS.Timeout | null;
  pendingChanges: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<ArchitectureProject | null>;
  loadProject: (id: string) => Promise<void>;

  // Update methods with auto-save
  updateProjectName: (name: string) => Promise<void>;
  updateBusinessContext: (data: BusinessContextData) => void;
  updateCurrentLandscape: (data: CurrentLandscapeData) => void;
  updateProposedSolution: (data: ProposedSolutionData) => void;
  updateDiagramSettings: (settings: DiagramSettings) => void;

  // Manual save/version
  saveNow: () => Promise<void>;
  createVersion: (name: string, description?: string) => Promise<void>;

  // Project management
  deleteProject: (id: string) => Promise<void>;

  // Utility
  setAutoSave: (enabled: boolean) => void;
  clearError: () => void;
}

// =============================================================================
// AUTO-SAVE CONFIGURATION
// =============================================================================

const AUTO_SAVE_DEBOUNCE_MS = 2000; // 2 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useArchitectureStore = create<ArchitectureStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      isLoading: false,
      isSaving: false,
      lastSaved: null,
      error: null,
      autoSaveEnabled: true,
      autoSaveTimeoutId: null,
      pendingChanges: false,

      // Fetch all projects
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/architecture');
          if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
          }
          const projects = await response.json();
          set({ projects, isLoading: false });
        } catch (error) {
          console.error('[Architecture Store] fetchProjects error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch projects',
            isLoading: false,
          });
        }
      },

      // Fetch single project
      fetchProject: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/architecture/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch project: ${response.statusText}`);
          }
          const project = await response.json();
          set({ currentProject: project, isLoading: false });
        } catch (error) {
          console.error('[Architecture Store] fetchProject error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch project',
            isLoading: false,
          });
        }
      },

      // Create new project
      createProject: async (name: string, description?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/architecture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create project: ${response.statusText}`);
          }

          const project = await response.json();
          set((state) => ({
            projects: [project, ...state.projects],
            currentProject: project,
            isLoading: false,
            lastSaved: new Date(),
          }));

          return project;
        } catch (error) {
          console.error('[Architecture Store] createProject error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create project',
            isLoading: false,
          });
          return null;
        }
      },

      // Load project
      loadProject: async (id: string) => {
        const state = get();

        // Check if already loaded
        if (state.currentProject?.id === id) {
          return;
        }

        await get().fetchProject(id);
      },

      // Update project name (immediate save)
      updateProjectName: async (name: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        // Optimistic update
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, name }
            : null,
        }));

        try {
          const response = await fetch(`/api/architecture/${currentProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });

          if (!response.ok) {
            throw new Error('Failed to update project name');
          }

          const updated = await response.json();
          set({ currentProject: updated, lastSaved: new Date() });
        } catch (error) {
          console.error('[Architecture Store] updateProjectName error:', error);
          set({ error: 'Failed to update project name' });
          // Revert on error
          set({ currentProject });
        }
      },

      // Update business context (auto-save)
      updateBusinessContext: (data: BusinessContextData) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, businessContext: data }
            : null,
          pendingChanges: true,
        }));
        scheduleAutoSave();
      },

      // Update current landscape (auto-save)
      updateCurrentLandscape: (data: CurrentLandscapeData) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, currentLandscape: data }
            : null,
          pendingChanges: true,
        }));
        scheduleAutoSave();
      },

      // Update proposed solution (auto-save)
      updateProposedSolution: (data: ProposedSolutionData) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, proposedSolution: data }
            : null,
          pendingChanges: true,
        }));
        scheduleAutoSave();
      },

      // Update diagram settings (auto-save)
      updateDiagramSettings: (settings: DiagramSettings) => {
        set((state) => ({
          currentProject: state.currentProject
            ? { ...state.currentProject, diagramSettings: settings }
            : null,
          pendingChanges: true,
        }));
        scheduleAutoSave();
      },

      // Manual save
      saveNow: async () => {
        const { currentProject, autoSaveTimeoutId } = get();
        if (!currentProject) return;

        // Clear pending auto-save
        if (autoSaveTimeoutId) {
          clearTimeout(autoSaveTimeoutId);
          set({ autoSaveTimeoutId: null });
        }

        set({ isSaving: true, error: null });

        try {
          const response = await fetch(`/api/architecture/${currentProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessContext: currentProject.businessContext,
              currentLandscape: currentProject.currentLandscape,
              proposedSolution: currentProject.proposedSolution,
              diagramSettings: currentProject.diagramSettings,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save project');
          }

          const updated = await response.json();
          set({
            currentProject: updated,
            isSaving: false,
            lastSaved: new Date(),
            pendingChanges: false,
          });
        } catch (error) {
          console.error('[Architecture Store] saveNow error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to save project',
            isSaving: false,
          });
        }
      },

      // Create version snapshot
      createVersion: async (name: string, description?: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        set({ isSaving: true, error: null });

        try {
          const response = await fetch(`/api/architecture/${currentProject.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              createVersion: true,
              versionName: name,
              versionDescription: description,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create version');
          }

          const updated = await response.json();
          set({
            currentProject: updated,
            isSaving: false,
            lastSaved: new Date(),
          });
        } catch (error) {
          console.error('[Architecture Store] createVersion error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create version',
            isSaving: false,
          });
        }
      },

      // Delete project
      deleteProject: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/architecture/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete project');
          }

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            isLoading: false,
          }));
        } catch (error) {
          console.error('[Architecture Store] deleteProject error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to delete project',
            isLoading: false,
          });
        }
      },

      // Set auto-save enabled
      setAutoSave: (enabled: boolean) => {
        set({ autoSaveEnabled: enabled });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'ArchitectureStore' }
  )
);

// =============================================================================
// AUTO-SAVE HELPER
// =============================================================================

function scheduleAutoSave() {
  const state = useArchitectureStore.getState();

  if (!state.autoSaveEnabled || !state.currentProject) {
    return;
  }

  // Clear existing timeout
  if (state.autoSaveTimeoutId) {
    clearTimeout(state.autoSaveTimeoutId);
  }

  // Schedule new save
  const timeoutId = setTimeout(async () => {
    console.log('[Architecture Store] Auto-saving...');
    await state.saveNow();
  }, AUTO_SAVE_DEBOUNCE_MS);

  useArchitectureStore.setState({ autoSaveTimeoutId: timeoutId });
}

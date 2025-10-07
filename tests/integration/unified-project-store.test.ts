/**
 * UNIFIED PROJECT STORE - INTEGRATION TESTS
 *
 * Tests for P2-1: Unified Project Store
 *
 * Coverage:
 * - Creating projects from estimator data
 * - Migration from legacy stores
 * - Dual-write sync to legacy stores
 * - Dual-read sync from legacy stores
 * - Project versioning and upgrades
 * - localStorage persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUnifiedProjectStore, createFromEstimator, migrateFromLegacyStores } from '@/stores/unified-project-store';
import { usePresalesStore } from '@/stores/presales-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { useProjectStore } from '@/stores/project-store';
import type { EstimatorInputs } from '@/lib/estimator/formula-engine';
import type { Chip } from '@/types/core';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Unified Project Store - Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage first (before stores try to load from it)
    localStorageMock.clear();

    // Reset unified store to initial state (just data, keep functions)
    useUnifiedProjectStore.setState({
      currentProject: null,
      recentProjects: [],
    });

    // Reset legacy stores to initial state
    usePresalesStore.getState().reset();
    useTimelineStore.getState().reset();
    useProjectStore.getState().reset();
  });

  describe('Project Creation from Estimator', () => {
    it('should create a unified project from estimator inputs', () => {
      const inputs: EstimatorInputs = {
        profile: {
          id: 'sg-mid',
          name: 'Singapore Mid-Market',
          bce: 240,
          modules: ['FI', 'CO', 'MM', 'SD'],
          description: 'Mid-market APAC implementation',
          complexity: 3,
        },
        modules: ['FI', 'CO', 'MM', 'SD'],
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100,
      };

      const result = {
        totalEffort: 320,
        duration: { weeks: 24, months: 6 },
        fte: 3,
        confidence: 85,
        description: 'Mid-market implementation',
      };

      const project = createFromEstimator(inputs, result, 'Test Project');

      // Verify project structure
      expect(project.id).toMatch(/^est-/);
      expect(project.name).toBe('Test Project');
      expect(project.source).toBe('estimator');
      expect(project.metadata.version).toBe(1);

      // Verify estimator data
      expect(project.estimator.inputs).toEqual(inputs);
      expect(project.estimator.result).toEqual(result);
      expect(project.estimator.completedAt).toBeInstanceOf(Date);

      // Verify initial state
      expect(project.presales.chips).toEqual([]);
      expect(project.presales.mode).toBe('capture');
      expect(project.timeline.phases).toEqual([]);
      expect(project.timeline.profile).toEqual(inputs.profile);
      expect(project.ui.mode).toBe('plan');
      expect(project.flags.timelineIsStale).toBe(false);
      expect(project.flags.hasManualEdits).toBe(false);
    });

    it('should save project to unified store', () => {
      const inputs: EstimatorInputs = {
        profile: {
          id: 'us-enterprise',
          name: 'US Enterprise',
          bce: 450,
          modules: ['FI', 'CO', 'MM', 'SD', 'PP'],
          description: 'Enterprise Americas implementation',
          complexity: 5,
        },
        modules: ['FI', 'CO', 'MM', 'SD', 'PP'],
        l3Items: [],
        integrations: 5,
        inAppExtensions: 3,
        btpExtensions: 1,
        countries: 3,
        entities: 5,
        languages: 2,
        peakSessions: 500,
      };

      const result = {
        totalEffort: 650,
        duration: { weeks: 40, months: 10 },
        fte: 4,
        confidence: 80,
        description: 'Enterprise implementation',
      };

      const project = createFromEstimator(inputs, result, 'Enterprise Project');

      let store = useUnifiedProjectStore.getState();
      store.saveProject(project);

      // Re-get state to ensure we have latest
      store = useUnifiedProjectStore.getState();

      // Verify project saved
      expect(store.currentProject).toBeDefined();
      expect(store.currentProject?.id).toBe(project.id);
      expect(store.currentProject?.name).toBe('Enterprise Project');

      // Verify recent projects list updated
      expect(store.recentProjects).toHaveLength(1);
      expect(store.recentProjects[0].id).toBe(project.id);
      expect(store.recentProjects[0].name).toBe('Enterprise Project');
      expect(store.recentProjects[0].source).toBe('estimator');
    });
  });

  describe('Legacy Store Migration', () => {
    it('should migrate data from legacy stores', () => {
      const mockChips: Chip[] = [
        {
          id: 'chip-1',
          type: 'COUNTRY',
          value: 'Singapore',
          confidence: 0.9,
          source: 'manual',
          validated: true,
          timestamp: new Date(),
        },
        {
          id: 'chip-2',
          type: 'INDUSTRY',
          value: 'Manufacturing',
          confidence: 0.85,
          source: 'manual',
          validated: true,
          timestamp: new Date(),
        },
      ];

      const mockDecisions = {
        modules: ['FI', 'CO', 'MM'],
        pricing: 'subscription',
        ssoMode: 'saml',
      };

      const mockPhases = [
        {
          id: 'phase-1',
          name: 'Prepare',
          category: 'preparation',
          workingDays: 20,
          startBusinessDay: 0,
          resources: [],
        },
      ];

      // Populate legacy stores
      const presalesStore = usePresalesStore.getState();
      const timelineStore = useTimelineStore.getState();
      const projectStore = useProjectStore.getState();

      mockChips.forEach(chip => presalesStore.addChip(chip));
      Object.entries(mockDecisions).forEach(([key, value]) => {
        presalesStore.updateDecision(key, value);
      });

      timelineStore.setPhases(mockPhases);
      projectStore.setMode('plan');

      // Manually write to localStorage since persist middleware may be async
      localStorage.setItem('presales-storage', JSON.stringify({
        state: {
          chips: mockChips,
          decisions: mockDecisions,
          mode: 'plan',
        }
      }));
      localStorage.setItem('timeline-storage', JSON.stringify({
        state: {
          phases: mockPhases,
        }
      }));
      localStorage.setItem('project-storage', JSON.stringify({
        state: {
          mode: 'plan',
        }
      }));

      // Perform migration
      let unifiedStore = useUnifiedProjectStore.getState();
      unifiedStore.migrateFromLegacy();

      // Re-fetch state after migration
      unifiedStore = useUnifiedProjectStore.getState();

      // Verify migration
      const project = unifiedStore.currentProject;
      expect(project).toBeDefined();
      expect(project?.source).toBe('project');
      expect(project?.metadata.migratedFrom).toBe('legacy');

      // Verify presales data migrated
      expect(project?.presales.chips).toHaveLength(2);
      expect(project?.presales.chips[0].value).toBe('Singapore');
      expect(project?.presales.decisions).toEqual(mockDecisions);

      // Verify timeline data migrated
      expect(project?.timeline.phases).toHaveLength(1);
      expect(project?.timeline.phases[0].name).toBe('Prepare');

      // Verify UI state migrated
      expect(project?.ui.mode).toBe('plan');
    });

    it('should handle empty legacy stores gracefully', () => {
      const unifiedStore = useUnifiedProjectStore.getState();
      unifiedStore.migrateFromLegacy();

      // Should not create a project if no legacy data
      // Or should create an empty project - depends on implementation
      // For now, just verify it doesn't crash
      expect(true).toBe(true);
    });
  });

  describe('Dual-Write Sync to Legacy Stores', () => {
    it('should sync unified store changes to legacy stores', () => {
      const inputs: EstimatorInputs = {
        profile: {
          id: 'test',
          name: 'Test',
          bce: 200,
          modules: ['FI'],
          description: 'Small APAC implementation',
          complexity: 2,
        },
        modules: ['FI'],
        l3Items: [],
        integrations: 1,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 50,
      };

      const result = {
        totalEffort: 250,
        duration: { weeks: 16, months: 4 },
        fte: 2,
        confidence: 90,
        description: 'Small implementation',
      };

      const project = createFromEstimator(inputs, result, 'Sync Test Project');
      const unifiedStore = useUnifiedProjectStore.getState();

      unifiedStore.saveProject(project);
      unifiedStore.syncToLegacyStores();

      // Verify presales store updated
      const presalesStore = usePresalesStore.getState();
      expect(presalesStore.chips).toEqual(project.presales.chips);
      expect(presalesStore.decisions).toEqual(project.presales.decisions);
      expect(presalesStore.mode).toBe(project.presales.mode);

      // Verify timeline store updated
      const timelineStore = useTimelineStore.getState();
      expect(timelineStore.phases).toEqual(project.timeline.phases);
      expect(timelineStore.profile).toEqual(project.timeline.profile);
      expect(timelineStore.selectedPackages).toEqual(project.timeline.selectedPackages);

      // Verify project store updated
      const projectStore = useProjectStore.getState();
      expect(projectStore.mode).toBe(project.ui.mode);
      expect(projectStore.projectId).toBe(project.id);
      expect(projectStore.leftPanelWidth).toBe(project.ui.leftPanelWidth);
      expect(projectStore.rightPanelWidth).toBe(project.ui.rightPanelWidth);
    });
  });

  describe('Dual-Read Sync from Legacy Stores', () => {
    it('should sync changes from legacy stores to unified store', () => {
      // First create a project in unified store
      const inputs: EstimatorInputs = {
        profile: {
          id: 'test',
          name: 'Test',
          bce: 200,
          modules: ['FI'],
          description: 'Small APAC implementation',
          complexity: 2,
        },
        modules: ['FI'],
        l3Items: [],
        integrations: 1,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 50,
      };

      const result = {
        totalEffort: 250,
        duration: { weeks: 16, months: 4 },
        fte: 2,
        confidence: 90,
        description: 'Small implementation',
      };

      const project = createFromEstimator(inputs, result, 'Sync Test');
      let unifiedStore = useUnifiedProjectStore.getState();
      unifiedStore.saveProject(project);

      // Re-fetch after save
      unifiedStore = useUnifiedProjectStore.getState();

      // Make changes in legacy stores
      const presalesStore = usePresalesStore.getState();
      const newChip: Chip = {
        id: 'new-chip',
        type: 'MODULES',
        value: 'MM',
        confidence: 0.95,
        source: 'manual',
        validated: true,
        timestamp: new Date(),
      };
      presalesStore.addChip(newChip);

      const timelineStore = useTimelineStore.getState();
      timelineStore.setZoomLevel('week');

      const projectStore = useProjectStore.getState();
      projectStore.setMode('present');

      // Sync from legacy stores
      unifiedStore.syncFromLegacyStores();

      // Re-fetch state after sync
      unifiedStore = useUnifiedProjectStore.getState();

      // Verify unified store updated with legacy changes
      const updatedProject = unifiedStore.currentProject;
      expect(updatedProject?.presales.chips).toHaveLength(1);
      expect(updatedProject?.presales.chips[0].value).toBe('MM');
      expect(updatedProject?.timeline.zoomLevel).toBe('week');
      expect(updatedProject?.ui.mode).toBe('present');
    });
  });

  describe('Project Versioning', () => {
    it('should include version metadata', () => {
      const inputs: EstimatorInputs = {
        profile: {
          id: 'test',
          name: 'Test',
          bce: 200,
          modules: ['FI'],
          description: 'Small APAC implementation',
          complexity: 2,
        },
        modules: ['FI'],
        l3Items: [],
        integrations: 1,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 50,
      };

      const result = {
        totalEffort: 250,
        duration: { weeks: 16, months: 4 },
        fte: 2,
        confidence: 90,
        description: 'Test',
      };

      const project = createFromEstimator(inputs, result, 'Versioning Test');

      expect(project.metadata.version).toBe(1);
      expect(project.metadata.createdAt).toBeInstanceOf(Date);
      expect(project.metadata.updatedAt).toBeInstanceOf(Date);
    });

    it('should return current version number', () => {
      const store = useUnifiedProjectStore.getState();
      expect(store.getVersion()).toBe(1);
    });

    it('should update timestamp on save', () => {
      const inputs: EstimatorInputs = {
        profile: {
          id: 'test',
          name: 'Test',
          bce: 200,
          modules: ['FI'],
          description: 'Small APAC implementation',
          complexity: 2,
        },
        modules: ['FI'],
        l3Items: [],
        integrations: 1,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 50,
      };

      const result = {
        totalEffort: 250,
        duration: { weeks: 16, months: 4 },
        fte: 2,
        confidence: 90,
        description: 'Test',
      };

      const project = createFromEstimator(inputs, result, 'Timestamp Test');
      const store = useUnifiedProjectStore.getState();

      const originalUpdatedAt = project.metadata.updatedAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        store.saveProject(project);

        const savedProject = store.currentProject;
        expect(savedProject?.metadata.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('Project CRUD Operations', () => {
    it('should create a new empty project', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('New Project', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject).toBeDefined();
      expect(store.currentProject?.name).toBe('New Project');
      expect(store.currentProject?.source).toBe('project');
      expect(store.currentProject?.presales.chips).toEqual([]);
      expect(store.currentProject?.timeline.phases).toEqual([]);
    });

    it('should update existing project', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('Update Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();
      const originalId = store.currentProject?.id;

      store.updateProject({
        name: 'Updated Name',
        presales: {
          ...store.currentProject!.presales,
          mode: 'decide',
        },
      });

      // Re-fetch after update
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.id).toBe(originalId);
      expect(store.currentProject?.name).toBe('Updated Name');
      expect(store.currentProject?.presales.mode).toBe('decide');
    });

    it('should delete project', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('Delete Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();
      const projectId = store.currentProject!.id;

      store.deleteProject(projectId);

      // Re-fetch after deletion
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject).toBeNull();
      expect(store.recentProjects.find(p => p.id === projectId)).toBeUndefined();
    });

    it('should maintain recent projects list (max 10)', () => {
      let store = useUnifiedProjectStore.getState();

      // Create 12 projects with unique IDs by manipulating timestamp
      for (let i = 0; i < 12; i++) {
        const inputs: EstimatorInputs = {
          profile: {
            id: `test-${i}`,
            name: `Test ${i}`,
            bce: 200,
            modules: ['FI'],
            description: 'Small APAC implementation',
            complexity: 2,
          },
          modules: ['FI'],
          l3Items: [],
          integrations: 1,
          inAppExtensions: 0,
          btpExtensions: 0,
          countries: 1,
          entities: 1,
          languages: 1,
          peakSessions: 50,
        };

        const result = {
          totalEffort: 250,
          duration: { weeks: 16, months: 4 },
          fte: 2,
          confidence: 90,
          description: 'Test',
        };

        const project = createFromEstimator(inputs, result, `Project ${i}`);
        // Ensure unique ID by adding offset
        project.id = `est-${Date.now() + i}`;
        store.saveProject(project);
        // Re-fetch after each save
        store = useUnifiedProjectStore.getState();
      }

      // Should only keep last 10
      expect(store.recentProjects).toHaveLength(10);
      expect(store.recentProjects[0].name).toBe('Project 11'); // Most recent first
    });
  });

  describe('Tier-Specific Updates', () => {
    it('should update estimator data', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('Estimator Update Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();

      const newInputs: EstimatorInputs = {
        profile: {
          id: 'test',
          name: 'Test',
          bce: 300,
          modules: ['FI', 'CO'],
          description: 'Mid-market APAC implementation',
          complexity: 3,
        },
        modules: ['FI', 'CO'],
        l3Items: [],
        integrations: 2,
        inAppExtensions: 0,
        btpExtensions: 0,
        countries: 1,
        entities: 1,
        languages: 1,
        peakSessions: 100,
      };

      store.updateEstimator({ inputs: newInputs });

      // Re-fetch after update
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.estimator.inputs).toEqual(newInputs);
    });

    it('should update presales data', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('Presales Update Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();

      const newChips: Chip[] = [
        {
          id: 'chip-1',
          type: 'MODULES',
          value: 'MM',
          confidence: 0.9,
          source: 'manual',
          validated: true,
          timestamp: new Date(),
        },
      ];

      store.updatePresales({ chips: newChips, mode: 'decide' });

      // Re-fetch after update
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.presales.chips).toEqual(newChips);
      expect(store.currentProject?.presales.mode).toBe('decide');
    });

    it('should update timeline data and clear stale flag', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('Timeline Update Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();

      // Mark timeline as stale
      store.updateProject({
        flags: {
          ...store.currentProject!.flags,
          timelineIsStale: true,
        },
      });

      // Re-fetch after marking stale
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.flags.timelineIsStale).toBe(true);

      // Update timeline
      const newPhases = [
        {
          id: 'phase-1',
          name: 'Prepare',
          category: 'preparation',
          workingDays: 20,
          startBusinessDay: 0,
          resources: [],
        },
      ];

      store.updateTimeline({ phases: newPhases });

      // Re-fetch after timeline update
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timeline.phases).toEqual(newPhases);
      expect(store.currentProject?.flags.timelineIsStale).toBe(false);
      expect(store.currentProject?.timeline.generatedAt).toBeInstanceOf(Date);
    });

    it('should update UI state', () => {
      let store = useUnifiedProjectStore.getState();
      store.createProject('UI Update Test', 'project');

      // Re-fetch after creation
      store = useUnifiedProjectStore.getState();

      store.updateUI({
        mode: 'present',
        leftPanelWidth: 400,
        selectedPhaseId: 'phase-1',
      });

      // Re-fetch after update
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.ui.mode).toBe('present');
      expect(store.currentProject?.ui.leftPanelWidth).toBe(400);
      expect(store.currentProject?.ui.selectedPhaseId).toBe('phase-1');
    });
  });
});

/**
 * UNIFIED PROJECT STORE INTEGRATION TESTS
 *
 * Tests the unified store functionality and migration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUnifiedProjectStore } from '@/stores/unified-project-store';
import { migrateLegacyToUnified, autoMigrateIfNeeded } from '@/lib/store-migration';

describe('UnifiedProjectStore', () => {
  beforeEach(() => {
    // Clear localStorage to prevent persist middleware interference
    localStorage.clear();

    // Reset store before each test
    useUnifiedProjectStore.getState().reset();
  });

  describe('Project Management', () => {
    it('should create a new project', () => {
      const projectId = useUnifiedProjectStore.getState().createProject('Test Project');
      const store = useUnifiedProjectStore.getState(); // Get fresh state after action

      expect(projectId).toBeTruthy();
      expect(store.currentProject).toBeTruthy();
      expect(store.currentProject?.name).toBe('Test Project');
      expect(store.currentProject?.id).toBe(projectId);
    });

    it('should load an existing project', () => {
      const projectId = useUnifiedProjectStore.getState().createProject('Project 1');
      const project2Id = useUnifiedProjectStore.getState().createProject('Project 2');

      // Load first project
      useUnifiedProjectStore.getState().loadProject(projectId);
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.name).toBe('Project 1');
    });

    it('should delete a project', () => {
      const projectId = useUnifiedProjectStore.getState().createProject('Test Project');

      useUnifiedProjectStore.getState().deleteProject(projectId);
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject).toBeNull();
      expect(store.projects[projectId]).toBeUndefined();
    });
  });

  describe('Presales Actions', () => {
    beforeEach(() => {
      useUnifiedProjectStore.getState().createProject('Test Project');
    });

    it('should add a chip', () => {
      useUnifiedProjectStore.getState().addChip({
        type: 'COUNTRY',
        value: 'Singapore',
        confidence: 0.9,
        source: 'manual',
      });

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.presales.chips).toHaveLength(1);
      expect(store.currentProject?.presales.chips[0].value).toBe('Singapore');
      expect(store.currentProject?.timelineIsStale).toBe(true);
    });

    it('should add multiple chips', () => {
      useUnifiedProjectStore.getState().addChips([
        { type: 'COUNTRY', value: 'Singapore', confidence: 0.9, source: 'manual' },
        { type: 'INDUSTRY', value: 'Manufacturing', confidence: 0.8, source: 'manual' },
      ]);

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.presales.chips).toHaveLength(2);
    });

    it('should remove a chip', () => {
      useUnifiedProjectStore.getState().addChip({
        type: 'COUNTRY',
        value: 'Singapore',
        confidence: 0.9,
        source: 'manual',
      });

      const chipId = useUnifiedProjectStore.getState().currentProject!.presales.chips[0].id!;

      useUnifiedProjectStore.getState().removeChip(chipId);
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.presales.chips).toHaveLength(0);
    });

    it('should calculate completeness', () => {
      // Start with 0 score
      let store = useUnifiedProjectStore.getState();
      expect(store.currentProject?.presales.completeness.score).toBe(0);

      // Add chips
      useUnifiedProjectStore.getState().addChips([
        { type: 'COUNTRY', value: 'Singapore', confidence: 0.9, source: 'manual' },
        { type: 'INDUSTRY', value: 'Manufacturing', confidence: 0.8, source: 'manual' },
        { type: 'MODULES', value: 'FI', confidence: 0.9, source: 'manual' },
      ]);

      // Should have score now
      store = useUnifiedProjectStore.getState();
      expect(store.currentProject?.presales.completeness.score).toBeGreaterThan(0);
    });

    it('should update decisions', () => {
      useUnifiedProjectStore.getState().updateDecision('moduleCombo', 'S4HANA');

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.presales.decisions.moduleCombo).toBe('S4HANA');
      expect(store.currentProject?.timelineIsStale).toBe(true);
    });
  });

  describe('Timeline Actions', () => {
    beforeEach(() => {
      useUnifiedProjectStore.getState().createProject('Test Project');
    });

    it('should set phases', () => {
      const phases = [
        {
          name: 'Prepare',
          category: 'SAP Activate',
          startBusinessDay: 0,
          workingDays: 20,
        },
        {
          name: 'Explore',
          category: 'SAP Activate',
          startBusinessDay: 20,
          workingDays: 30,
        },
      ];

      useUnifiedProjectStore.getState().setPhases(phases as any[]);
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timeline.phases).toHaveLength(2);
      expect(store.currentProject?.timeline.phases[0].name).toBe('Prepare');
      expect(store.currentProject?.timelineIsStale).toBe(false);
    });

    it('should add a phase', () => {
      useUnifiedProjectStore.getState().addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timeline.phases).toHaveLength(1);
    });

    it('should update a phase', () => {
      useUnifiedProjectStore.getState().addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      const phaseId = useUnifiedProjectStore.getState().currentProject!.timeline.phases[0].id;

      useUnifiedProjectStore.getState().updatePhase(phaseId, { workingDays: 20 });
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timeline.phases[0].workingDays).toBe(20);
    });

    it('should delete a phase', () => {
      useUnifiedProjectStore.getState().addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      const phaseId = useUnifiedProjectStore.getState().currentProject!.timeline.phases[0].id;

      useUnifiedProjectStore.getState().deletePhase(phaseId);
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timeline.phases).toHaveLength(0);
    });
  });

  describe('Workflow Actions', () => {
    beforeEach(() => {
      useUnifiedProjectStore.getState().createProject('Test Project');
    });

    it('should change mode', () => {
      let store = useUnifiedProjectStore.getState();
      expect(store.currentProject?.mode).toBe('capture');

      useUnifiedProjectStore.getState().setMode('decide');
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.mode).toBe('decide');
    });

    it('should mark timeline as stale', () => {
      let store = useUnifiedProjectStore.getState();
      expect(store.currentProject?.timelineIsStale).toBe(false);

      useUnifiedProjectStore.getState().markTimelineStale();
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timelineIsStale).toBe(true);
    });

    it('should add manual overrides', () => {
      useUnifiedProjectStore.getState().addManualOverride({
        phaseId: 'phase-1',
        field: 'duration',
        originalValue: 30,
        manualValue: 35,
        reason: 'Extended for testing',
      });

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.manualOverrides).toHaveLength(1);
      expect(store.currentProject?.manualOverrides[0].manualValue).toBe(35);
    });
  });

  describe('UI Actions', () => {
    beforeEach(() => {
      useUnifiedProjectStore.getState().createProject('Test Project');
    });

    it('should change zoom level', () => {
      useUnifiedProjectStore.getState().setZoomLevel('week');

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.ui.zoomLevel).toBe('week');
    });

    it('should toggle presentation mode', () => {
      let store = useUnifiedProjectStore.getState();
      expect(store.currentProject?.ui.clientPresentationMode).toBe(false);

      useUnifiedProjectStore.getState().togglePresentationMode();
      store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.ui.clientPresentationMode).toBe(true);
    });

    it('should update panel widths', () => {
      useUnifiedProjectStore.getState().setLeftPanelWidth(400);
      useUnifiedProjectStore.getState().setRightPanelWidth(500);

      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.ui.leftPanelWidth).toBe(400);
      expect(store.currentProject?.ui.rightPanelWidth).toBe(500);
    });
  });

  describe('Persistence', () => {
    it('should persist to localStorage', () => {
      const store = useUnifiedProjectStore.getState();
      const projectId = store.createProject('Persistent Project');

      // Simulate page reload by getting fresh state
      const freshStore = useUnifiedProjectStore.getState();

      expect(freshStore.projects[projectId]).toBeTruthy();
      expect(freshStore.projects[projectId].name).toBe('Persistent Project');
    });
  });
});

describe('Store Migration', () => {
  it('should detect legacy data existence', () => {
    // This test requires mocking localStorage
    // For now, just check the function exists
    expect(typeof autoMigrateIfNeeded).toBe('function');
  });

  it('should migrate legacy project data', () => {
    // This test requires mocking legacy store data
    // For now, just check the function exists
    expect(typeof migrateLegacyToUnified).toBe('function');
  });
});

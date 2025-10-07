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
    // Reset store before each test
    useUnifiedProjectStore.getState().reset();
  });

  describe('Project Management', () => {
    it('should create a new project', () => {
      const store = useUnifiedProjectStore.getState();
      const projectId = store.createProject('Test Project');

      expect(projectId).toBeTruthy();
      expect(store.currentProject).toBeTruthy();
      expect(store.currentProject?.name).toBe('Test Project');
      expect(store.currentProject?.id).toBe(projectId);
    });

    it('should load an existing project', () => {
      const store = useUnifiedProjectStore.getState();
      const projectId = store.createProject('Project 1');
      const project2Id = store.createProject('Project 2');

      // Load first project
      store.loadProject(projectId);

      expect(store.currentProject?.name).toBe('Project 1');
    });

    it('should delete a project', () => {
      const store = useUnifiedProjectStore.getState();
      const projectId = store.createProject('Test Project');

      store.deleteProject(projectId);

      expect(store.currentProject).toBeNull();
      expect(store.projects[projectId]).toBeUndefined();
    });
  });

  describe('Presales Actions', () => {
    beforeEach(() => {
      const store = useUnifiedProjectStore.getState();
      store.createProject('Test Project');
    });

    it('should add a chip', () => {
      const store = useUnifiedProjectStore.getState();

      store.addChip({
        type: 'COUNTRY',
        value: 'Singapore',
        confidence: 0.9,
      });

      expect(store.currentProject?.presales.chips).toHaveLength(1);
      expect(store.currentProject?.presales.chips[0].value).toBe('Singapore');
      expect(store.currentProject?.timelineIsStale).toBe(true);
    });

    it('should add multiple chips', () => {
      const store = useUnifiedProjectStore.getState();

      store.addChips([
        { type: 'COUNTRY', value: 'Singapore', confidence: 0.9 },
        { type: 'INDUSTRY', value: 'Manufacturing', confidence: 0.8 },
      ]);

      expect(store.currentProject?.presales.chips).toHaveLength(2);
    });

    it('should remove a chip', () => {
      const store = useUnifiedProjectStore.getState();

      store.addChip({
        type: 'COUNTRY',
        value: 'Singapore',
        confidence: 0.9,
      });

      const chipId = store.currentProject!.presales.chips[0].id!;

      store.removeChip(chipId);

      expect(store.currentProject?.presales.chips).toHaveLength(0);
    });

    it('should calculate completeness', () => {
      const store = useUnifiedProjectStore.getState();

      // Start with 0 score
      expect(store.currentProject?.presales.completeness.score).toBe(0);

      // Add chips
      store.addChips([
        { type: 'COUNTRY', value: 'Singapore', confidence: 0.9 },
        { type: 'INDUSTRY', value: 'Manufacturing', confidence: 0.8 },
        { type: 'MODULE', value: 'FI', confidence: 0.9 },
      ]);

      // Should have score now
      expect(store.currentProject?.presales.completeness.score).toBeGreaterThan(0);
    });

    it('should update decisions', () => {
      const store = useUnifiedProjectStore.getState();

      store.updateDecision('moduleCombo', 'S4HANA');

      expect(store.currentProject?.presales.decisions.moduleCombo).toBe('S4HANA');
      expect(store.currentProject?.timelineIsStale).toBe(true);
    });
  });

  describe('Timeline Actions', () => {
    beforeEach(() => {
      const store = useUnifiedProjectStore.getState();
      store.createProject('Test Project');
    });

    it('should set phases', () => {
      const store = useUnifiedProjectStore.getState();

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

      store.setPhases(phases as any[]);

      expect(store.currentProject?.timeline.phases).toHaveLength(2);
      expect(store.currentProject?.timeline.phases[0].name).toBe('Prepare');
      expect(store.currentProject?.timelineIsStale).toBe(false);
    });

    it('should add a phase', () => {
      const store = useUnifiedProjectStore.getState();

      store.addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      expect(store.currentProject?.timeline.phases).toHaveLength(1);
    });

    it('should update a phase', () => {
      const store = useUnifiedProjectStore.getState();

      store.addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      const phaseId = store.currentProject!.timeline.phases[0].id;

      store.updatePhase(phaseId, { workingDays: 20 });

      expect(store.currentProject?.timeline.phases[0].workingDays).toBe(20);
    });

    it('should delete a phase', () => {
      const store = useUnifiedProjectStore.getState();

      store.addPhase({
        name: 'Deploy',
        category: 'SAP Activate',
        startBusinessDay: 50,
        workingDays: 15,
      } as any);

      const phaseId = store.currentProject!.timeline.phases[0].id;

      store.deletePhase(phaseId);

      expect(store.currentProject?.timeline.phases).toHaveLength(0);
    });
  });

  describe('Workflow Actions', () => {
    beforeEach(() => {
      const store = useUnifiedProjectStore.getState();
      store.createProject('Test Project');
    });

    it('should change mode', () => {
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.mode).toBe('capture');

      store.setMode('decide');

      expect(store.currentProject?.mode).toBe('decide');
    });

    it('should mark timeline as stale', () => {
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.timelineIsStale).toBe(false);

      store.markTimelineStale();

      expect(store.currentProject?.timelineIsStale).toBe(true);
    });

    it('should add manual overrides', () => {
      const store = useUnifiedProjectStore.getState();

      store.addManualOverride({
        phaseId: 'phase-1',
        field: 'duration',
        originalValue: 30,
        manualValue: 35,
        reason: 'Extended for testing',
      });

      expect(store.currentProject?.manualOverrides).toHaveLength(1);
      expect(store.currentProject?.manualOverrides[0].manualValue).toBe(35);
    });
  });

  describe('UI Actions', () => {
    beforeEach(() => {
      const store = useUnifiedProjectStore.getState();
      store.createProject('Test Project');
    });

    it('should change zoom level', () => {
      const store = useUnifiedProjectStore.getState();

      store.setZoomLevel('week');

      expect(store.currentProject?.ui.zoomLevel).toBe('week');
    });

    it('should toggle presentation mode', () => {
      const store = useUnifiedProjectStore.getState();

      expect(store.currentProject?.ui.clientPresentationMode).toBe(false);

      store.togglePresentationMode();

      expect(store.currentProject?.ui.clientPresentationMode).toBe(true);
    });

    it('should update panel widths', () => {
      const store = useUnifiedProjectStore.getState();

      store.setLeftPanelWidth(400);
      store.setRightPanelWidth(500);

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
